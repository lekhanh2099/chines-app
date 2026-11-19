import { describe, expect, it } from "vitest";

import {
 brushOutline,
 brushWidthsForStroke,
 classifyBrushStroke,
 estimateBrushEm,
 type BrushPoint,
} from "./kaishu-brush";
import { KAISHU_BRUSH_TEMPLATES } from "./kaishu-brush-templates";

const EM = 100;

/** A polyline through `corners`, sampled densely as a stylus would. */
function drawn(...corners: BrushPoint[]): BrushPoint[] {
 const points: BrushPoint[] = [];
 corners.slice(1).forEach((end, index) => {
  const start = corners[index] ?? end;
  for (let step = 0; step < 20; step += 1) {
   points.push({
    x: start.x + ((end.x - start.x) * step) / 20,
    y: start.y + ((end.y - start.y) * step) / 20,
   });
  }
 });
 const last = corners.at(-1);
 if (last) points.push(last);
 return points;
}

describe("Kaishu brush classification", () => {
 it("reads the basic strokes from their direction of travel", () => {
  expect(classifyBrushStroke(drawn({ x: 10, y: 50 }, { x: 80, y: 48 }), EM).type).toBe("heng");
  expect(classifyBrushStroke(drawn({ x: 50, y: 10 }, { x: 50, y: 90 }), EM).type).toBe("shu");
  expect(classifyBrushStroke(drawn({ x: 60, y: 20 }, { x: 20, y: 80 }), EM).type).toBe("pie");
  expect(classifyBrushStroke(drawn({ x: 20, y: 30 }, { x: 80, y: 70 }), EM).type).toMatch(/^na_l_/);
  expect(classifyBrushStroke(drawn({ x: 20, y: 80 }, { x: 60, y: 60 }), EM).type).toBe("ti");
  expect(classifyBrushStroke(drawn({ x: 50, y: 50 }, { x: 55, y: 56 }), EM).type).toBe("dian");
 });

 it("splits bends at the corner and recognises a hook at the end", () => {
  const bend = classifyBrushStroke(drawn({ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 90 }), EM);
  expect(bend.type).toMatch(/^zhe:heng-shu@/);
  expect(bend.cuts[0]).toBeCloseTo(60 / 130, 1);
  const hook = classifyBrushStroke(drawn({ x: 50, y: 10 }, { x: 50, y: 90 }, { x: 38, y: 80 }), EM);
  expect(hook.type).toBe("gou:shu>other");
 });

 it("tells a dot from a stroke relative to the character size, not the page", () => {
  const short = drawn({ x: 0, y: 0 }, { x: 6, y: 8 });
  expect(classifyBrushStroke(short, EM).type).toBe("dian");
  expect(classifyBrushStroke(short, 20).type).not.toBe("dian");
 });
});

describe("Kaishu brush widths", () => {
 it("gives every point a width, swelling where a KaiTi stroke swells", () => {
  const vertical = drawn({ x: 50, y: 10 }, { x: 50, y: 90 });
  const widths = brushWidthsForStroke(vertical, EM, KAISHU_BRUSH_TEMPLATES);
  expect(widths).toHaveLength(vertical.length);
  const pie = drawn({ x: 60, y: 20 }, { x: 20, y: 80 });
  const pieWidths = brushWidthsForStroke(pie, EM, KAISHU_BRUSH_TEMPLATES);
  // a 撇 starts heavy and tapers to a point
  expect(pieWidths[2]).toBeGreaterThan((pieWidths.at(-2) ?? 0) * 1.5);
 });

 it("estimates the character size from the median stroke", () => {
  expect(estimateBrushEm([10, 30, 20], 3)).toBe(60);
 });

 it("builds a stroke from shapes all wound the same way, so bends union without holes", () => {
  const bend = drawn({ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 });
  const outline = brushOutline(
   bend,
   bend.map((_, index) => 4 + (index % 5)),
  );
  const shapes = outline.split("Z").filter((shape) => shape.trim());
  expect(shapes.length).toBeGreaterThan(10);
  for (const shape of shapes) {
   const numbers = shape.replace(/[ML]/g, " ").trim().split(/\s+/).map(Number);
   let area = 0;
   for (let index = 0; index < numbers.length; index += 2) {
    const next = (index + 2) % numbers.length;
    area +=
     (numbers[index] ?? 0) * (numbers[next + 1] ?? 0) -
     (numbers[next] ?? 0) * (numbers[index + 1] ?? 0);
   }
   expect(area).toBeGreaterThanOrEqual(0);
  }
  expect(brushOutline([{ x: 5, y: 5 }], [4]).match(/L/g)).toHaveLength(9);
 });
});
