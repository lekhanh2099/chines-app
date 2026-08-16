import { describe, expect, it } from "vitest";

import { resolveListeningShortcut } from "./useListeningHotkeys";

describe("resolveListeningShortcut", () => {
 it.each([
  [{ code: "Digit1", key: "1" }, "previous"],
  [{ code: "Digit2", key: "2" }, "play-toggle"],
  [{ code: "Digit3", key: "3" }, "repeat"],
  [{ code: "Digit4", key: "4" }, "next"],
  [{ code: "Digit5", key: "5" }, "toggle-loop"],
  [{ code: "Space", key: " " }, "play-toggle"],
  [{ code: "ArrowLeft", key: "ArrowLeft" }, "previous"],
  [{ code: "ArrowRight", key: "ArrowRight" }, "next"],
  [{ code: "KeyR", key: "r" }, "repeat"],
  [{ code: "KeyL", key: "L" }, "toggle-loop"],
  [{ code: "Escape", key: "Escape" }, "stop"],
 ] as const)("maps %o to %s", (event, action) => {
  expect(resolveListeningShortcut(event)).toBe(action);
 });

 it("ignores unrelated keys", () => {
  expect(resolveListeningShortcut({ code: "KeyA", key: "a" })).toBeNull();
 });
});