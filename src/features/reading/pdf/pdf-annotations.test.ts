import { describe, expect, it } from "vitest";

import {
 appendPdfStrokePoints,
 equalPdfAnnotationPayloads,
 createPdfStroke,
 erasePdfStrokesAtPoint,
 pdfStrokePath,
 updateStrokeAtId,
} from "@/features/reading/pdf/pdf-annotations";

describe("HanziHome PDF annotation geometry", () => {
 const point = { x: 0.2, y: 0.3 };

 it("compares complete stroke content when reconciling a lost acknowledgement", () => {
  const stroke = createPdfStroke("pen", "#ff0000", 4, point);
  const payload = { strokes: [stroke] };
  expect(
   equalPdfAnnotationPayloads(payload, { strokes: [{ ...stroke, points: [{ ...point }] }] }),
  ).toBe(true);
  expect(equalPdfAnnotationPayloads(payload, { strokes: [{ ...stroke, width: 5 }] })).toBe(false);
  expect(
   equalPdfAnnotationPayloads(payload, { strokes: [{ ...stroke, points: [{ x: 0.3, y: 0.3 }] }] }),
  ).toBe(false);
  expect(equalPdfAnnotationPayloads(payload, { strokes: [] })).toBe(false);
 });

 it("creates and appends normalized strokes deterministically", () => {
  const stroke = createPdfStroke("pen", "#ff0000", 4, point);
  expect(appendPdfStrokePoints(stroke, [point])).toBe(stroke);
  const extended = appendPdfStrokePoints(stroke, [{ x: 0.4, y: 0.5 }]);
  expect(extended.points).toHaveLength(2);
  expect(pdfStrokePath(extended)).toBe("M 200 300 L 400 500");
 });

 it("keeps every sample a zoomed-in page can show, and drops sub-pixel jitter", () => {
  const stroke = createPdfStroke("pen", "#ff0000", 4, point);
  const samples = [
   { x: 0.2005, y: 0.3 },
   { x: 0.20052, y: 0.3 },
   { x: 0.201, y: 0.3 },
  ];
  expect(appendPdfStrokePoints(stroke, samples).points).toHaveLength(1);
  expect(appendPdfStrokePoints(stroke, samples, 0.0003).points).toEqual([
   point,
   { x: 0.2005, y: 0.3 },
   { x: 0.201, y: 0.3 },
  ]);
 });

 it("draws a smooth curve through the midpoints between samples", () => {
  const stroke = {
   ...createPdfStroke("pen", "#ff0000", 4, { x: 0, y: 0 }),
   points: [
    { x: 0, y: 0 },
    { x: 0.1, y: 0.1 },
    { x: 0.2, y: 0 },
    { x: 0.3, y: 0.1 },
   ],
  };
  expect(pdfStrokePath(stroke)).toBe("M 0 0 Q 100 100 150 50 Q 200 0 250 50 L 300 100");
  expect(pdfStrokePath({ ...stroke, points: [point] })).toBe("M 200 300 L 200 300");
 });

 it("erases only strokes touched by the normalized point", () => {
  const near = createPdfStroke("highlighter", "#ffff00", 16, point);
  const far = createPdfStroke("pen", "#000000", 4, { x: 0.8, y: 0.8 });
  expect(erasePdfStrokesAtPoint([near, far], point)).toEqual([far]);
 });

 it("extends only the identified stroke without replacing other strokes or source points", () => {
  const first = createPdfStroke("pen", "#ff0000", 4, point);
  const second = createPdfStroke("pen", "#000000", 4, { x: 0.8, y: 0.8 });
  const updated = updateStrokeAtId([first, second], first.id, [{ x: 0.4, y: 0.5 }]);
  expect(updated[0]?.points).toEqual([point, { x: 0.4, y: 0.5 }]);
  expect(updated[1]).toBe(second);
  expect(first.points).toEqual([point]);
  expect(updateStrokeAtId([first, second], "missing", [point])).toEqual([first, second]);
 });

 it("erases within a circle that is round on screen, along whole segments", () => {
  // A page 1.4 times taller than wide: 0.01 of its height is 0.014 of its width.
  const aspect = 1.4;
  const line = createPdfStroke("pen", "#000000", 1, { x: 0.2, y: 0.5 });
  const across = {
   ...line,
   points: [
    { x: 0.2, y: 0.5 },
    { x: 0.8, y: 0.5 },
   ],
  };
  // The middle of a long segment is hit, though no recorded point is near it.
  expect(erasePdfStrokesAtPoint([across], { x: 0.5, y: 0.5 }, 0.01, aspect)).toEqual([]);
  // 0.009 of the height above is 0.0126 of the width: outside a 0.01 eraser…
  expect(erasePdfStrokesAtPoint([across], { x: 0.5, y: 0.491 }, 0.01, aspect)).toEqual([across]);
  // …while 0.009 of the width to the side of an upright line is inside it.
  const upright = {
   ...line,
   points: [
    { x: 0.5, y: 0.2 },
    { x: 0.5, y: 0.8 },
   ],
  };
  expect(erasePdfStrokesAtPoint([upright], { x: 0.509, y: 0.5 }, 0.01, aspect)).toEqual([]);
 });

 it("reaches the widest part of a brush stroke", () => {
  const brush = {
   ...createPdfStroke("brush", "#000000", 10, { x: 0.2, y: 0.5 }),
   points: [
    { x: 0.2, y: 0.5 },
    { x: 0.8, y: 0.5 },
   ],
   widths: [1, 2],
  };
  // Half the widest width (10 × 2 / 1000 / 2 = 0.01) plus a 0.001 eraser.
  expect(erasePdfStrokesAtPoint([brush], { x: 0.5, y: 0.5105 }, 0.001)).toEqual([]);
  expect(erasePdfStrokesAtPoint([brush], { x: 0.5, y: 0.512 }, 0.001)).toEqual([brush]);
 });
});
