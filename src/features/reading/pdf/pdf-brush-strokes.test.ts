import { describe, expect, it } from "vitest";

import { createPdfStroke, pdfAnnotationPayloadSchema, type PdfStroke } from "./pdf-annotations";
import { finishPdfBrushStroke, liveBrushWidth, pdfBrushOutlinePath } from "./pdf-brush-strokes";

/** A brush stroke through page points (0–1), sampled densely. */
function brushThrough(corners: [number, number][]): PdfStroke {
 const points = corners.slice(1).flatMap(([x, y], index) => {
  const [startX = x, startY = y] = corners[index] ?? [];
  return Array.from({ length: 10 }, (_, step) => ({
   x: startX + ((x - startX) * step) / 10,
   y: startY + ((y - startY) * step) / 10,
  }));
 });
 const [lastX = 0, lastY = 0] = corners.at(-1) ?? [];
 points.push({ x: lastX, y: lastY });
 return { ...createPdfStroke("brush", "#111827", 8, points[0] ?? { x: 0, y: 0 }), points };
}

/** A brush stroke from `from` to `to` on the page (0–1), sampled every step. */
function brush(from: [number, number], to: [number, number]): PdfStroke {
 const points = Array.from({ length: 21 }, (_, step) => ({
  x: from[0] + ((to[0] - from[0]) * step) / 20,
  y: from[1] + ((to[1] - from[1]) * step) / 20,
 }));
 return { ...createPdfStroke("brush", "#111827", 8, points[0] ?? { x: 0, y: 0 }), points };
}

describe("finishing a Kaishu brush stroke", () => {
 it("fixes one width per point and leaves the other strokes alone", () => {
  const pen = createPdfStroke("pen", "#ef4444", 4, { x: 0.1, y: 0.1 });
  const stroke = brush([0.2, 0.2], [0.2, 0.26]);
  const [kept, finished] = finishPdfBrushStroke([pen, stroke], stroke.id, 1.4, 4);
  expect(kept).toBe(pen);
  expect(finished?.widths).toHaveLength(stroke.points.length);
  expect(pdfAnnotationPayloadSchema.safeParse({ strokes: [kept, finished] }).success).toBe(true);
 });

 it("sizes the brush to the writing, like a real brush on larger characters", () => {
  const small = brush([0.2, 0.2], [0.2, 0.21]);
  const large = brush([0.2, 0.2], [0.2, 0.25]);
  const smallWidth = finishPdfBrushStroke([small], small.id, 1.4, 4)[0]?.width ?? 0;
  const largeWidth = finishPdfBrushStroke([large], large.id, 1.4, 4)[0]?.width ?? 0;
  expect(largeWidth).toBeCloseTo(smallWidth * 5, 0);
  const heavier = finishPdfBrushStroke([large], large.id, 1.4, 8)[0]?.width ?? 0;
  expect(heavier).toBeCloseTo(largeWidth * 2, 1);
 });

 it("draws the next stroke at the last brush width while it is in progress", () => {
  const finished = finishPdfBrushStroke([brush([0.2, 0.2], [0.2, 0.4])], "missing", 1.4, 4);
  expect(liveBrushWidth(finished, 4)).toBe(8);
  expect(liveBrushWidth([], 5)).toBe(10);
 });

 it("outlines a finished stroke as a filled shape", () => {
  const stroke = brush([0.2, 0.2], [0.2, 0.3]);
  const [finished] = finishPdfBrushStroke([stroke], stroke.id, 1.4, 4);
  expect(finished && pdfBrushOutlinePath(finished, 1.4)).toMatch(/^M .* Z$/);
 });
});

describe("brush strokes in saved annotations", () => {
 it("rejects a stroke whose widths do not match its points", () => {
  const stroke = { ...brush([0.2, 0.2], [0.2, 0.3]), widths: [1, 1] };
  expect(pdfAnnotationPayloadSchema.safeParse({ strokes: [stroke] }).success).toBe(false);
 });
});

describe("weighing whole characters", () => {
 /** A boxed character (like 口 with a middle bar) at `left`, `top` on the page, `size` wide. */
 const character = (left: number, top: number, size: number): PdfStroke[] =>
  [
   [
    [0, 0],
    [0, 1],
   ],
   [
    [0, 0],
    [1, 0],
    [1, 1],
   ],
   [
    [0, 0.5],
    [1, 0.5],
   ],
   [
    [0, 1],
    [1, 1],
   ],
  ].map((corners) =>
   brushThrough(corners.map(([x = 0, y = 0]) => [left + x * size, top + y * size])),
  );
 /** Writes characters stroke by stroke, finishing each as the app does. */
 const write = (characters: PdfStroke[][]) => {
  let page: PdfStroke[] = [];
  for (const strokes of characters) {
   for (const stroke of strokes) page = finishPdfBrushStroke([...page, stroke], stroke.id, 1.4, 4);
  }
  return page;
 };

 it("re-weighs a finished character for its own size when the writing gets smaller", () => {
  const big = Array.from({ length: 5 }, (_, index) => character(0.05 + index * 0.12, 0.1, 0.1));
  const small = Array.from({ length: 4 }, (_, index) => character(0.05 + index * 0.05, 0.4, 0.04));
  const page = write([...big, ...small]);
  const widthsOf = (characterIndex: number) =>
   page.slice(characterIndex * 4, characterIndex * 4 + 4).map((stroke) => stroke.width);
  const lastBig = widthsOf(big.length - 2);
  const firstSmall = widthsOf(big.length);
  const thirdSmall = widthsOf(big.length + 2);
  // The first small character, finished once the next one starts, weighs
  // like the small characters after it, not like the big ones before it.
  firstSmall.forEach((width, index) => {
   expect(width).toBeCloseTo(thirdSmall[index] ?? 0, 0);
   expect(width).toBeLessThan((lastBig[index] ?? 0) * 0.6);
  });
 });

 it("gives a detached part (口 beside 襄 in 嚷) the weight of its character", () => {
  /** A short boxed part on the left and a tall part on the right, a small gap apart. */
  const withSidePart = (left: number): PdfStroke[] => [
   brushThrough([
    [left, 0.13],
    [left, 0.17],
   ]),
   brushThrough([
    [left, 0.13],
    [left + 0.025, 0.13],
    [left + 0.025, 0.17],
   ]),
   brushThrough([
    [left, 0.17],
    [left + 0.025, 0.17],
   ]),
   ...character(left + 0.035, 0.1, 0.07),
  ];
  const page = write([
   ...Array.from({ length: 4 }, (_, index) => character(0.05 + index * 0.12, 0.1, 0.1)),
   withSidePart(0.53),
   character(0.65, 0.1, 0.1),
  ]);
  const part = page.slice(16, 19).map((stroke) => stroke.width);
  const body = page.slice(19, 23).map((stroke) => stroke.width);
  for (const width of part) expect(width).toBeCloseTo(body[0] ?? 0, 0);
 });

 it("weighs the first characters on a page right away, without a jump later", () => {
  const characters = Array.from({ length: 5 }, (_, index) =>
   character(0.05 + index * 0.06, 0.1, 0.05),
  );
  const widthsOf = (page: PdfStroke[], index: number) =>
   page.slice(index * 4, index * 4 + 4).map((stroke) => stroke.width);
  const afterThree = write(characters.slice(0, 3));
  const afterFive = write(characters);
  for (let index = 0; index < 3; index += 1) {
   // Writing on does not change the first characters noticeably…
   widthsOf(afterThree, index).forEach((width, stroke) => {
    const later = widthsOf(afterFive, index)[stroke] ?? 0;
    expect(Math.abs(width - later)).toBeLessThan(later * 0.12);
   });
   // …and they already weigh like the characters after them.
   for (const width of widthsOf(afterFive, index)) {
    expect(Math.abs(width - (widthsOf(afterFive, 4)[0] ?? 0))).toBeLessThan(width * 0.15);
   }
  }
 });
});
