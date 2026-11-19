import { describe, expect, it } from "vitest";

import { createPdfInkPointerGate } from "./pdf-ink-pointer-gate";

type InkPointer = Parameters<ReturnType<typeof createPdfInkPointerGate>["down"]>[0];

const pen: InkPointer = { pointerId: 1, pointerType: "pen", isPrimary: true };
const palm: InkPointer = { pointerId: 2, pointerType: "touch", isPrimary: true };
const finger: InkPointer = { pointerId: 3, pointerType: "touch", isPrimary: false };
const mouse: InkPointer = { pointerId: 4, pointerType: "mouse", isPrimary: true };
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
});
