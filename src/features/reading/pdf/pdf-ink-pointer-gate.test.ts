import { describe, expect, it } from "vitest";

import { createPdfInkPointerGate } from "./pdf-ink-pointer-gate";

type InkPointer = Parameters<ReturnType<typeof createPdfInkPointerGate>["down"]>[0];

const at = { clientX: 100, clientY: 100, timeStamp: 1000 };
const pen: InkPointer = { pointerId: 1, pointerType: "pen", isPrimary: true, ...at };
const palm: InkPointer = { pointerId: 2, pointerType: "touch", isPrimary: true, ...at };
const finger: InkPointer = { pointerId: 3, pointerType: "touch", isPrimary: false, ...at };
const mouse: InkPointer = { pointerId: 4, pointerType: "mouse", isPrimary: true, ...at };
const third: InkPointer = { pointerId: 5, pointerType: "touch", isPrimary: false, ...at };
const later = (pointer: InkPointer, ms: number, dx = 0): InkPointer => ({
 ...pointer,
 timeStamp: pointer.timeStamp + ms,
 clientX: pointer.clientX + dx,
});
const fingerInk = { canInk: true, touchInk: true };
const penInk = { canInk: true, touchInk: false };

describe("PDF ink pointer gate", () => {
 it("ignores a palm resting while the pen writes, and keeps the pen stroke", () => {
  const gate = createPdfInkPointerGate();
  expect(gate.down(pen, fingerInk)).toEqual({
   draws: true,
   pans: false,
   discardActive: false,
   penArrived: true,
  });
  expect(gate.down(palm, fingerInk)).toEqual({
   draws: false,
   pans: false,
   discardActive: false,
   penArrived: false,
  });
  expect(gate.inks(palm)).toBe(false);
  expect(gate.pans(palm)).toBe(false);
  gate.up(palm);
  expect(gate.inks(pen)).toBe(true);
 });

 it("takes back a palm stroke when the pen lands right after it", () => {
  const gate = createPdfInkPointerGate();
  expect(gate.down(palm, fingerInk).draws).toBe(true);
  const landing = gate.down(pen, fingerInk);
  expect(landing).toMatchObject({ draws: true, discardActive: true, penArrived: true });
  expect(gate.inks(palm)).toBe(false);
  expect(gate.inks(pen)).toBe(true);
 });

 it("pans with one finger instead of drawing when finger ink is off", () => {
  const gate = createPdfInkPointerGate();
  expect(gate.down(palm, penInk)).toMatchObject({ draws: false, pans: true });
  expect(gate.pans(palm)).toBe(true);
  gate.up(palm);
  expect(gate.pans(palm)).toBe(false);
 });

 it("stops a palm pan the moment the pen lands", () => {
  const gate = createPdfInkPointerGate();
  gate.down(palm, penInk);
  expect(gate.down(pen, penInk).draws).toBe(true);
  expect(gate.pans(palm)).toBe(false);
 });

 it("turns a finger stroke into a pinch when a second finger lands", () => {
  const gate = createPdfInkPointerGate();
  expect(gate.down(palm, fingerInk).draws).toBe(true);
  expect(gate.down(finger, fingerInk)).toMatchObject({
   draws: false,
   pans: false,
   discardActive: true,
  });
  expect(gate.inks(palm)).toBe(false);
  expect(gate.inks(finger)).toBe(false);
 });

 it("inks with a mouse, and with nothing while no tool can edit", () => {
  expect(createPdfInkPointerGate().down(mouse, penInk).draws).toBe(true);
  const locked = createPdfInkPointerGate();
  expect(locked.down(pen, { canInk: false, touchInk: true }).draws).toBe(false);
  expect(locked.down(palm, { canInk: false, touchInk: true }).draws).toBe(false);
 });
 it("reports a quick two-finger tap for undo and a three-finger tap for redo", () => {
  const gate = createPdfInkPointerGate();
  gate.down(palm, penInk);
  gate.down(later(finger, 40), penInk);
  expect(gate.up(later(palm, 150)).tapFingers).toBe(0);
  expect(gate.up(later(finger, 160)).tapFingers).toBe(2);

  gate.down(later(palm, 1000), penInk);
  gate.down(later(finger, 1020), penInk);
  gate.down(later(third, 1050), penInk);
  gate.up(later(palm, 1200));
  gate.up(later(finger, 1210));
  expect(gate.up(later(third, 1220)).tapFingers).toBe(3);
 });

 it("does not take a pinch, a slow press, or a palm while writing for a tap", () => {
  const pinch = createPdfInkPointerGate();
  pinch.down(palm, penInk);
  pinch.down(finger, penInk);
  pinch.track(later(finger, 50, 40));
  pinch.up(later(palm, 150));
  expect(pinch.up(later(finger, 160)).tapFingers).toBe(0);

  const slow = createPdfInkPointerGate();
  slow.down(palm, penInk);
  slow.down(finger, penInk);
  slow.up(later(palm, 700));
  expect(slow.up(later(finger, 710)).tapFingers).toBe(0);

  const writing = createPdfInkPointerGate();
  writing.down(pen, penInk);
  writing.down(later(palm, 10), penInk);
  writing.down(later(finger, 20), penInk);
  writing.up(later(palm, 100));
  expect(writing.up(later(finger, 110)).tapFingers).toBe(0);

  const afterPen = createPdfInkPointerGate();
  afterPen.down(pen, penInk);
  afterPen.up(later(pen, 50));
  afterPen.down(later(palm, 300), penInk);
  afterPen.down(later(finger, 310), penInk);
  afterPen.up(later(palm, 400));
  expect(afterPen.up(later(finger, 410)).tapFingers).toBe(0);
 });
});
