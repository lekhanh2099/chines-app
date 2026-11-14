import { describe, expect, it } from "vitest";

import {
 calculateChineseAccuracy,
 calculateTranslationSimilarity,
 normalizeChineseAnswer,
 normalizeVietnameseAnswer,
} from "./text-comparison";

describe("HanziHome practice comparison", () => {
 it("normalizes punctuation without changing Chinese characters", () => {
  expect(normalizeChineseAnswer(" 你好！ ")).toBe("你好");
  expect(calculateChineseAccuracy("你好。", "你好")).toBe(100);
  expect(calculateChineseAccuracy("你好", "你坏")).toBe(50);
 });

 it("scores Vietnamese translation by token overlap and edit similarity", () => {
  expect(normalizeVietnameseAnswer(" Xin chào! ")).toBe("xin chào");
  expect(calculateTranslationSimilarity("Xin chào bạn", "xin chào bạn")).toBe(100);
  expect(calculateTranslationSimilarity("Xin chào bạn", "xin bạn")).toBeGreaterThan(40);
  expect(calculateTranslationSimilarity("Xin chào bạn", "")).toBe(0);
 });
});
