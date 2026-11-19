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
  const [kept, finished] = finishPdfBrushStroke([pen, stroke], stroke.id, 1.4, 4, 0).strokes;
  expect(kept).toBe(pen);
  expect(finished?.widths).toHaveLength(stroke.points.length);
  expect(pdfAnnotationPayloadSchema.safeParse({ strokes: [kept, finished] }).success).toBe(true);
 });

 it("sizes the brush to the writing, like a real brush on larger characters", () => {
  const small = brush([0.2, 0.2], [0.2, 0.21]);
  const large = brush([0.2, 0.2], [0.2, 0.25]);
  const widthOf = (stroke: PdfStroke, setting: number) =>
   finishPdfBrushStroke([stroke], stroke.id, 1.4, setting, 0).strokes[0]?.width ?? 0;
  const smallWidth = widthOf(small, 4);
  const largeWidth = widthOf(large, 4);
  expect(largeWidth).toBeCloseTo(smallWidth * 5, 0);
  const heavier = widthOf(large, 8);
  expect(heavier).toBeCloseTo(largeWidth * 2, 1);
 });

 it("draws the next stroke at the last brush width while it is in progress", () => {
  const finished = finishPdfBrushStroke(
   [brush([0.2, 0.2], [0.2, 0.4])],
   "missing",
   1.4,
   4,
   0,
  ).strokes;
  expect(liveBrushWidth(finished, 4)).toBe(8);
  expect(liveBrushWidth([], 5)).toBe(10);
 });

 it("outlines a finished stroke as a filled shape", () => {
  const stroke = brush([0.2, 0.2], [0.2, 0.3]);
  const [finished] = finishPdfBrushStroke([stroke], stroke.id, 1.4, 4, 0).strokes;
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
   for (const stroke of strokes) {
    page = finishPdfBrushStroke([...page, stroke], stroke.id, 1.4, 4, prior).strokes;
   }
  }
  return page;
 };
 let prior = 0;
 /**
  * Shapes a character like a handwritten one: as tall as its size on a page
  * 1.4 times taller than wide, and a little narrower than tall.
  */
 const squared = (strokes: PdfStroke[], top: number): PdfStroke[] =>
  strokes.map((stroke) => {
   const left = Math.min(...strokes.flatMap((item) => item.points.map((point) => point.x)));
   return {
    ...stroke,
    points: stroke.points.map((point) => ({
     x: left + (point.x - left) * 0.8,
     y: top + (point.y - top) / 1.4,
    })),
   };
  });
 const widthsOf = (page: PdfStroke[], index: number) =>
  page.slice(index * 4, index * 4 + 4).map((stroke) => stroke.width);

 it("never changes a stroke once it is finished", () => {
  prior = 0;
  const characters = [
   ...Array.from({ length: 4 }, (_, index) => character(0.05 + index * 0.12, 0.1, 0.1)),
   ...Array.from({ length: 4 }, (_, index) => character(0.05 + index * 0.05, 0.4, 0.04)),
  ];
  let page: PdfStroke[] = [];
  for (const strokes of characters) {
   for (const stroke of strokes) {
    const next = finishPdfBrushStroke([...page, stroke], stroke.id, 1.4, 4, 0).strokes;
    page.forEach((finished, index) => expect(next[index]).toBe(finished));
    page = next;
   }
  }
 });

 it("keeps every character even, and follows a new writing size within a few characters", () => {
  prior = 0;
  // Square characters (the page is 1.4 times taller than wide), spaced like handwriting.
  const big = Array.from({ length: 5 }, (_, index) =>
   character(0.05 + index * 0.125, 0.1, 0.1),
  ).map((strokes) => squared(strokes, 0.1));
  const small = Array.from({ length: 8 }, (_, index) =>
   character(0.05 + index * 0.05, 0.4, 0.04),
  ).map((strokes) => squared(strokes, 0.4));
  const page = write([...big, ...small]);
  for (let index = 0; index < big.length + small.length; index += 1) {
   const widths = widthsOf(page, index);
   for (const width of widths) expect(width).toBeCloseTo(widths[0] ?? 0, 5);
  }
  const lastBig = widthsOf(page, big.length - 1)[0] ?? 0;
  for (let index = big.length + small.length - 3; index < big.length + small.length; index += 1) {
   expect(widthsOf(page, index)[0] ?? 0).toBeLessThan(lastBig * 0.6);
  }
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

 it("weighs the first character of a page from the writer's usual size", () => {
  const characters = Array.from({ length: 5 }, (_, index) =>
   character(0.05 + index * 0.06, 0.1, 0.05),
  );
  prior = 0;
  const settled = widthsOf(write(characters), 4)[0] ?? 0;
  // The usual size (in page units) of characters this big.
  prior = (0.05 * 1000 * 1.4 * 1.26) / 1.05;
  const first = widthsOf(write(characters.slice(0, 1)), 0);
  for (const width of first) expect(Math.abs(width - settled)).toBeLessThan(settled * 0.15);
 });
});
