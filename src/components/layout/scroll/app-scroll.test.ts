import { describe, expect, it } from "vitest";

import { resolveAppScrollTargetTop } from "./app-scroll";
import { resolveAppScrollChromeHidden } from "./app-scroll-state";

const containerRect = { top: 64, bottom: 664, height: 600 };

describe("resolveAppScrollChromeHidden", () => {
 it.each([
  { scrollTop: 0, previousScrollTop: 0, hidden: false, expected: false },
  { scrollTop: 64, previousScrollTop: 0, hidden: false, expected: false },
  { scrollTop: 96, previousScrollTop: 64, hidden: false, expected: true },
  { scrollTop: 240, previousScrollTop: 120, hidden: false, expected: true },
  { scrollTop: 232, previousScrollTop: 240, hidden: true, expected: true },
  { scrollTop: 200, previousScrollTop: 240, hidden: true, expected: false },
  { scrollTop: 208, previousScrollTop: 200, hidden: false, expected: false },
  { scrollTop: 16, previousScrollTop: 24, hidden: true, expected: false },
  { scrollTop: -12, previousScrollTop: 8, hidden: true, expected: false },
 ])("resolves scrolling $previousScrollTop → $scrollTop to hidden=$expected", (input) => {
  expect(resolveAppScrollChromeHidden(input)).toBe(input.expected);
 });
});

describe("resolveAppScrollTargetTop", () => {
 it("aligns a target to the start of the app viewport", () => {
  expect(
   resolveAppScrollTargetTop({
    block: "start",
    containerClientHeight: 600,
    containerScrollTop: 200,
    containerRect,
    targetRect: { top: 364, bottom: 464, height: 100 },
   }),
  ).toBe(500);
 });

 it("centers a target without scrolling above zero", () => {
  expect(
   resolveAppScrollTargetTop({
    block: "center",
    containerClientHeight: 600,
    containerScrollTop: 200,
    containerRect,
    targetRect: { top: 364, bottom: 464, height: 100 },
   }),
  ).toBe(250);

  expect(
   resolveAppScrollTargetTop({
    block: "center",
    containerClientHeight: 600,
    containerScrollTop: 0,
    containerRect,
    targetRect: { top: 80, bottom: 120, height: 40 },
   }),
  ).toBe(0);
 });

 it("keeps a fully visible target stationary in nearest mode", () => {
  expect(
   resolveAppScrollTargetTop({
    block: "nearest",
    containerClientHeight: 600,
    containerScrollTop: 200,
    containerRect,
    targetRect: { top: 164, bottom: 264, height: 100 },
   }),
  ).toBe(200);
 });

 it("reveals targets above or below the viewport in nearest mode", () => {
  expect(
   resolveAppScrollTargetTop({
    block: "nearest",
    containerClientHeight: 600,
    containerScrollTop: 500,
    containerRect,
    targetRect: { top: 24, bottom: 84, height: 60 },
   }),
  ).toBe(460);

  expect(
   resolveAppScrollTargetTop({
    block: "nearest",
    containerClientHeight: 600,
    containerScrollTop: 200,
    containerRect,
    targetRect: { top: 724, bottom: 824, height: 100 },
   }),
  ).toBe(360);
 });
});
