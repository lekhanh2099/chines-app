import { describe, expect, it } from "vitest";

import {
 buildTranslationDiff,
 buildVietnameseWordDiff,
 summarizeTranslationDiff,
 summarizeWordDiff,
 translationScoreBadgeVariant,
 translationScoreLabel,
} from "./translation-comparison";

describe("translation-comparison", () => {
 describe("buildVietnameseWordDiff", () => {
  it("detects exact matches in Vietnamese words", () => {
   const tokens = buildVietnameseWordDiff(
    "Lý Doãn Mỹ là người Hàn Quốc",
    "Lý Doãn Mỹ là người Hàn Quốc",
   );
   const summary = summarizeWordDiff(tokens);

   expect(summary.correct).toBe(7);
   expect(summary.missing).toBe(0);
   expect(summary.replaced).toBe(0);
   expect(summary.extra).toBe(0);
  });

  it("identifies missing and replaced words in Vietnamese", () => {
   const tokens = buildVietnameseWordDiff(
    "Lý Doãn Mỹ là một người Hàn Quốc đang làm việc ở Trung Quốc",
    "Lý Doãn Mỹ là người Hàn Quốc làm việc tại Trung Quốc",
   );
   const summary = summarizeWordDiff(tokens);

   expect(summary.missing).toBe(2); // "một", "đang"
   expect(summary.replaced).toBe(1); // "tại" instead of "ở"
   expect(summary.correct).toBe(11);
  });

  it("handles empty expected or actual gracefully", () => {
   expect(buildVietnameseWordDiff("", "")).toEqual([]);
   expect(summarizeWordDiff(buildVietnameseWordDiff("Một hai", "")).missing).toBe(2);
   expect(summarizeWordDiff(buildVietnameseWordDiff("", "Một hai")).extra).toBe(2);
  });
 });

 describe("buildTranslationDiff and summarizeTranslationDiff", () => {
  it("uses character-level diff for vi-zh (Chinese answer)", () => {
   const tokens = buildTranslationDiff("你好世界", "你好", "vi-zh");
   const summary = summarizeTranslationDiff(tokens, "vi-zh");

   expect(summary.correct).toBe(2);
   expect(summary.missing).toBe(2);
  });

  it("uses word-level diff for zh-vi (Vietnamese answer)", () => {
   const tokens = buildTranslationDiff("Xin chào thế giới", "Xin chào bạn", "zh-vi");
   const summary = summarizeTranslationDiff(tokens, "zh-vi");

   expect(summary.correct).toBe(2);
   expect(summary.replaced).toBe(1); // "bạn" instead of "thế giới" or "thế"
  });
 });

 describe("translationScoreBadgeVariant and translationScoreLabel", () => {
  it("returns correct variant and label across score ranges", () => {
   expect(translationScoreBadgeVariant(100)).toBe("success");
   expect(translationScoreLabel(100)).toBe("Chính xác · 100%");

   expect(translationScoreBadgeVariant(85)).toBe("warning");
   expect(translationScoreLabel(85)).toBe("Rất tốt · 85%");

   expect(translationScoreBadgeVariant(70)).toBe("warning");
   expect(translationScoreLabel(70)).toBe("Khá tốt · 70%");

   expect(translationScoreBadgeVariant(50)).toBe("danger");
   expect(translationScoreLabel(50)).toBe("Cần cải thiện · 50%");
  });
 });
});
