import { describe, expect, it } from "vitest";

import { shouldSubmitDictationEnter } from "./VideoDictationPanel";

describe("shouldSubmitDictationEnter", () => {
 it("does not submit while IME composition is active", () => {
  expect(shouldSubmitDictationEnter({ key: "Enter", isComposing: true })).toBe(false);
 });

 it("submits on Enter when IME composition is finished", () => {
  expect(shouldSubmitDictationEnter({ key: "Enter", isComposing: false })).toBe(true);
 });

 it("ignores non-Enter keys", () => {
  expect(shouldSubmitDictationEnter({ key: "a", isComposing: false })).toBe(false);
  expect(shouldSubmitDictationEnter({ key: "Escape", isComposing: false })).toBe(false);
 });
});
