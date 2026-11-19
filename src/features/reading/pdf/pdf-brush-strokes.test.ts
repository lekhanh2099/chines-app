import { describe, expect, it } from "vitest";

import { createPdfStroke, pdfAnnotationPayloadSchema, type PdfStroke } from "./pdf-annotations";
import { finishPdfBrushStroke, liveBrushWidth, pdfBrushOutlinePath } from "./pdf-brush-strokes";

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
  const large = brush([0.2, 0.2], [0.2, 0.3]);
  const smallWidth = finishPdfBrushStroke([small], small.id, 1.4, 4)[0]?.width ?? 0;
  const largeWidth = finishPdfBrushStroke([large], large.id, 1.4, 4)[0]?.width ?? 0;
  expect(largeWidth).toBeGreaterThan(smallWidth * 5);
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
