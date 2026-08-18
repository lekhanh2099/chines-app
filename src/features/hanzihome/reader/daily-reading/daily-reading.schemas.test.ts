import { describe, expect, it } from "vitest";

import { dailyReadingGenerateStreamEventSchema, dailyReadingSchema } from "./daily-reading.schemas";

const legacyReading = {
 schemaVersion: "1.0.0",
 id: "daily-legacy",
 publishedDate: "2026-08-18",
 createdAt: "2026-08-18T03:00:00.000Z",
 releaseKind: "manual",
 titleZh: "城市博物馆的新展览",
 titleVi: "Triển lãm mới của bảo tàng thành phố",
 whyWorthReadingVi: "Bài đọc giúp luyện cách mô tả một hoạt động văn hóa.",
 adaptationNoticeVi: "Bản học tập được biên soạn từ nguồn báo chí.",
 topic: "culture",
 level: "HSK5",
 estimatedMinutes: 8,
 paragraphs: Array.from({ length: 4 }, (_value, index) => ({
  id: `p${index + 1}`,
  order: index + 1,
  zh: `这是第${index + 1}段用于测试每日阅读数据兼容性的中文内容。`,
  vi: `Đây là đoạn ${index + 1} dùng để kiểm tra tính tương thích dữ liệu.`,
  roleVi: "thân bài",
 })),
 vocabulary: Array.from({ length: 8 }, (_value, index) => ({
  id: `v${index + 1}`,
  order: index + 1,
  hanzi: `词语${index + 1}`,
  meaningVi: `nghĩa ${index + 1}`,
  meaningInContextVi: `nghĩa trong bài ${index + 1}`,
  categoryVi: "danh từ",
 })),
 grammarPoints: Array.from({ length: 3 }, (_value, index) => ({
  id: `g${index + 1}`,
  patternZh: `结构${index + 1}`,
  explanationVi: `Giải thích ${index + 1}`,
  evidenceSentenceZh: `这是第${index + 1}段用于测试每日阅读数据兼容性的中文内容。`,
 })),
 questions: Array.from({ length: 5 }, (_value, index) => ({
  id: `q${index + 1}`,
  type: index === 0 ? "main_idea" : "detail",
  promptZh: `问题${index + 1}是什么？`,
  promptVi: `Câu hỏi ${index + 1} là gì?`,
  answerZh: `答案${index + 1}。`,
  answerVi: `Đáp án ${index + 1}.`,
  evidenceParagraphIds: ["p1"],
 })),
 sourcePhrasesZh: [],
 verificationSummaryVi: "Nội dung được tạo từ nguồn đã kiểm tra.",
 source: {
  titleZh: "城市博物馆推出新展览",
  publisher: "中国新闻网",
  url: "https://www.chinanews.com.cn/cul/2026/08-18/123.shtml",
  publishedAt: "2026-08-18T02:00:00.000Z",
  capturedAt: "2026-08-18T03:00:00.000Z",
 },
 generatedByProvider: "Google Gemini",
 generatedByModel: "gemini-test",
};

describe("Daily Reading schemas", () => {
 it("upgrades locally saved readings that predate generated pinyin fields", () => {
  const parsed = dailyReadingSchema.parse(legacyReading);

  expect(parsed.titlePinyin).toBe("");
  expect(parsed.paragraphs.every((paragraph) => paragraph.pinyin === "")).toBe(true);
  expect(parsed.vocabulary.every((item) => item.pinyin === "")).toBe(true);
  expect(parsed.pinyinReviewStatus).toBe("auto-generated");
 });

 it("accepts progress, result, and bounded error stream events", () => {
  expect(
   dailyReadingGenerateStreamEventSchema.parse({ type: "progress", stage: "repairing_learning" }),
  ).toEqual({ type: "progress", stage: "repairing_learning" });
  expect(
   dailyReadingGenerateStreamEventSchema.parse({
    type: "error",
    payload: { code: "source-unavailable", detail: "No usable source." },
   }),
  ).toEqual({
   type: "error",
   payload: { code: "source-unavailable", detail: "No usable source." },
  });
  expect(
   dailyReadingGenerateStreamEventSchema.safeParse({
    type: "error",
    payload: { code: "made-up", detail: "Nope" },
   }).success,
  ).toBe(false);
 });

 it("accepts a source-metadata and reading-core checkpoint without raw article text", () => {
  const checkpoint = {
   source: legacyReading.source,
   core: {
    titleZh: legacyReading.titleZh,
    titleVi: legacyReading.titleVi,
    whyWorthReadingVi: legacyReading.whyWorthReadingVi,
    topic: legacyReading.topic,
    level: legacyReading.level,
    estimatedMinutes: legacyReading.estimatedMinutes,
    paragraphs: legacyReading.paragraphs.map(({ zh, vi, roleVi }) => ({ zh, vi, roleVi })),
   },
  };

  expect(
   dailyReadingGenerateStreamEventSchema.parse({ type: "checkpoint", payload: checkpoint }),
  ).toEqual({
   type: "checkpoint",
   payload: checkpoint,
  });
 });
});
