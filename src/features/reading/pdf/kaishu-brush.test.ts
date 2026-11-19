import { describe, expect, it } from "vitest";

import {
 brushOutline,
 brushWidthsForStroke,
 classifyBrushStroke,
 estimateBrushEm,
 estimateWritingEm,
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

describe("Kaishu brush character size", () => {
 /** A sparse character (a cross of two long strokes) in a box at `left`. */
 const sparse = (left: number, size: number) => [
  drawn({ x: left, y: size / 2 }, { x: left + size, y: size / 2 }),
  drawn({ x: left + size / 2, y: 0 }, { x: left + size / 2, y: size }),
 ];
 /**
  * A dense character like 呢 or 镶: a left part (a vertical crossed by three
  * short horizontals) and a boxed right part, with a small gap between them.
  */
 const dense = (left: number, size: number) => [
  drawn({ x: left + size * 0.15, y: 0 }, { x: left + size * 0.15, y: size }),
  ...[0.2, 0.5, 0.8].map((row) =>
   drawn({ x: left, y: size * row }, { x: left + size * 0.3, y: size * row }),
  ),
  drawn({ x: left + size * 0.5, y: 0 }, { x: left + size * 0.5, y: size }),
  drawn({ x: left + size, y: 0 }, { x: left + size, y: size }),
  ...[0, 0.33, 0.66, 1].map((row) =>
   drawn({ x: left + size * 0.5, y: size * row }, { x: left + size, y: size * row }),
  ),
 ];

 it("gives a sparse and a dense character of the same size the same weight", () => {
  const size = 60;
  const strokes: BrushPoint[][] = [];
  const estimates: { kind: string; em: number }[] = [];
  for (let index = 0; index < 12; index += 1) {
   const kind = index % 2 === 0 ? "sparse" : "dense";
   const character = kind === "sparse" ? sparse(index * 75, size) : dense(index * 75, size);
   for (const stroke of character) {
    strokes.push(stroke);
    if (index >= 4) estimates.push({ kind, em: estimateWritingEm(strokes, 1.2, 1.26).em });
   }
  }
  for (const { em } of estimates) {
   expect(em).toBeGreaterThan(size * 1.2 * 0.85);
   expect(em).toBeLessThan(size * 1.2 * 1.15);
  }
 });
});
