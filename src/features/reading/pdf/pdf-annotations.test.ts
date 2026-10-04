import { describe, expect, it } from "vitest";

import {
 appendPdfStrokePoint,
 createPdfStroke,
 erasePdfStrokesAtPoint,
 pdfStrokePath,
 updateStrokeAtId,
} from "@/features/reading/pdf/pdf-annotations";

describe("HanziHome PDF annotation geometry", () => {
 const point = { x: 0.2, y: 0.3 };

 it("creates and appends normalized strokes deterministically", () => {
  const stroke = createPdfStroke("pen", "#ff0000", 4, point);
  expect(appendPdfStrokePoint(stroke, point)).toEqual(stroke);
  const extended = appendPdfStrokePoint(stroke, { x: 0.4, y: 0.5 });
  expect(extended.points).toHaveLength(2);
  expect(pdfStrokePath(extended)).toContain("M 200 300 L 400 500");
 });

 it("erases only strokes touched by the normalized point", () => {
  const near = createPdfStroke("highlighter", "#ffff00", 16, point);
  const far = createPdfStroke("pen", "#000000", 4, { x: 0.8, y: 0.8 });
  expect(erasePdfStrokesAtPoint([near, far], point)).toEqual([far]);
 });

 it("extends only the identified stroke without replacing other strokes or source points", () => {
  const first = createPdfStroke("pen", "#ff0000", 4, point);
  const second = createPdfStroke("pen", "#000000", 4, { x: 0.8, y: 0.8 });
  const updated = updateStrokeAtId([first, second], first.id, { x: 0.4, y: 0.5 });
  expect(updated[0]?.points).toEqual([point, { x: 0.4, y: 0.5 }]);
  expect(updated[1]).toBe(second);
  expect(first.points).toEqual([point]);
  expect(updateStrokeAtId([first, second], "missing", point)).toEqual([first, second]);
 });
});
