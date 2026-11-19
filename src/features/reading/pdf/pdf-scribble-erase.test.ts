import { describe, expect, it } from "vitest";

import { createPdfStroke, type PdfPoint, type PdfStroke } from "./pdf-annotations";
import { isPdfScribble, pdfStrokesErasedByScribble } from "./pdf-scribble-erase";

function stroke(points: PdfPoint[], tool: PdfStroke["tool"] = "pen"): PdfStroke {
 const [first = { x: 0, y: 0 }] = points;
 return { ...createPdfStroke(tool, "#ef4444", 4, first), points };
}

/** Samples a polyline every `step`, as a pencil would report it. */
function sampled(corners: PdfPoint[], step = 0.002): PdfPoint[] {
 const points: PdfPoint[] = [];
 corners.slice(1).forEach((end, index) => {
  const start = corners[index] ?? end;
  const count = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / step));
  for (let i = 0; i < count; i += 1) {
   points.push({
    x: start.x + ((end.x - start.x) * i) / count,
    y: start.y + ((end.y - start.y) * i) / count,
   });
  }
 });
 const last = corners.at(-1);
 if (last) points.push(last);
 return points;
}

/** A quick left-right scribble over a box, drifting down a little each pass. */
function scribbleOver(left: number, right: number, top: number, passes = 6) {
 const corners = Array.from({ length: passes + 1 }, (_, index) => ({
  x: index % 2 === 0 ? left : right,
  y: top + index * 0.004,
 }));
 return stroke(sampled(corners));
}

// A short handwritten word: three letters at x 0.30–0.38, y 0.48–0.52.
const word = [
 stroke(
  sampled([
   { x: 0.3, y: 0.48 },
   { x: 0.3, y: 0.52 },
  ]),
 ),
 stroke(
  sampled([
   { x: 0.33, y: 0.52 },
   { x: 0.345, y: 0.48 },
   { x: 0.36, y: 0.52 },
  ]),
 ),
 stroke(
  sampled([
   { x: 0.37, y: 0.49 },
   { x: 0.38, y: 0.51 },
   { x: 0.37, y: 0.52 },
  ]),
 ),
];
const farNote = stroke(
 sampled([
  { x: 0.7, y: 0.2 },
  { x: 0.8, y: 0.2 },
 ]),
);

describe("scribble to erase", () => {
 it("erases the strokes a back-and-forth scribble covers, and only those", () => {
  const scribble = scribbleOver(0.29, 0.39, 0.485);
  const erased = pdfStrokesErasedByScribble([...word, farNote, scribble], scribble);
  expect(erased.sort()).toEqual(word.map((item) => item.id).sort());
 });

 it("erases with an up-and-down scribble over a tall mark too", () => {
  const corners = Array.from({ length: 7 }, (_, index) => ({
   x: 0.296 + index * 0.002,
   y: index % 2 === 0 ? 0.475 : 0.525,
  }));
  const scribble = stroke(sampled(corners));
  expect(pdfStrokesErasedByScribble([...word, scribble], scribble)).toEqual([word[0]?.id]);
 });

 it("keeps handwriting written over ink, even zigzag or looped letters", () => {
  const humps: PdfPoint[] = [];
  for (let hump = 0; hump < 3; hump += 1) {
   const x = 0.3 + hump * 0.04;
   humps.push({ x, y: 0.52 }, { x: x + 0.01, y: 0.48 }, { x: x + 0.02, y: 0.5 });
   humps.push({ x: x + 0.03, y: 0.48 }, { x: x + 0.04, y: 0.52 });
  }
  const loops: PdfPoint[] = [];
  for (let index = 0; index <= 72; index += 1) {
   const angle = (index / 24) * Math.PI * 2;
   loops.push({
    x: 0.31 + index * 0.0008 + 0.01 * Math.cos(angle),
    y: 0.5 + 0.015 * Math.sin(angle),
   });
  }
  const zigzag = Array.from({ length: 9 }, (_, index) => ({
   x: 0.29 + index * 0.012,
   y: index % 2 === 0 ? 0.475 : 0.525,
  }));
  for (const writing of [stroke(sampled(humps)), stroke(loops), stroke(sampled(zigzag))]) {
   expect(isPdfScribble(writing.points)).toBe(false);
   expect(pdfStrokesErasedByScribble([...word, writing], writing)).toEqual([]);
  }
 });

 it("keeps a long line the scribble only clips", () => {
  const underline = stroke(
   sampled([
    { x: 0.05, y: 0.495 },
    { x: 0.95, y: 0.495 },
   ]),
  );
  const scribble = scribbleOver(0.29, 0.39, 0.485);
  const erased = pdfStrokesErasedByScribble([...word, underline, scribble], scribble);
  expect(erased).not.toContain(underline.id);
  expect(erased).toHaveLength(word.length);
 });

 it("stays ink when it covers nothing, or is a straight or highlighter stroke", () => {
  const scribble = scribbleOver(0.6, 0.7, 0.8);
  expect(isPdfScribble(scribble.points)).toBe(true);
  expect(pdfStrokesErasedByScribble([...word, scribble], scribble)).toEqual([]);

  const line = stroke(
   sampled([
    { x: 0.29, y: 0.5 },
    { x: 0.39, y: 0.5 },
   ]),
  );
  expect(pdfStrokesErasedByScribble([...word, line], line)).toEqual([]);

  const marker: PdfStroke = { ...scribbleOver(0.29, 0.39, 0.485), tool: "highlighter" };
  expect(pdfStrokesErasedByScribble([...word, marker], marker)).toEqual([]);
 });

 it("needs several passes: a single back-and-forth is not a scribble", () => {
  expect(isPdfScribble(scribbleOver(0.29, 0.39, 0.485, 2).points)).toBe(false);
 });

 it("erases with the Kaishu brush too, after four passes", () => {
  const brushScribble: PdfStroke = { ...scribbleOver(0.29, 0.39, 0.485, 4), tool: "brush" };
  expect(pdfStrokesErasedByScribble([...word, brushScribble], brushScribble)).toHaveLength(
   word.length,
  );
 });
});
