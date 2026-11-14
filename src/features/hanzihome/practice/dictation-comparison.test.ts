import { describe, expect, it } from "vitest";

import { buildDictationDiff, summarizeDictationDiff } from "./dictation-comparison";

describe("HanziHome dictation comparison", () => {
 it("captures missing, extra, replacement, and transposition mistakes", () => {
  const exact = summarizeDictationDiff(buildDictationDiff("你好", "你好"));
  expect(exact.correct).toBe(2);
  expect(exact.totalExpected).toBe(2);

  const transposed = summarizeDictationDiff(buildDictationDiff("你好", "好你"));
  expect(transposed.transposed).toBe(2);

  const replaced = summarizeDictationDiff(buildDictationDiff("你好", "你坏"));
  expect(replaced.replaced).toBe(1);
 });
});
