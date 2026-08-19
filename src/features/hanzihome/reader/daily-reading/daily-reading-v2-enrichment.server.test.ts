import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";

import type { DailyReadingV2 } from "./daily-reading-v2.schemas";

const mocks = vi.hoisted(() => ({
 requestProvider: vi.fn(),
}));

vi.mock("./daily-reading-v2-enrichment-provider.server", () => ({
 requestDailyReadingV2EnrichmentProvider: mocks.requestProvider,
}));

import { generateDailyReadingV2Enrichment } from "./daily-reading-v2-enrichment.server";

const reading: DailyReadingV2 = {
 schemaVersion: "2.0.0",
 id: "daily-v2:2026-08-19:1234abcd",
 publishedDate: "2026-08-19",
 capturedAt: "2026-08-19T06:00:00.000Z",
 releaseKind: "manual",
 provenance: "source-captured",
 source: {
  titleZh: "城市博物馆推出传统文化专题展览",
  publisher: "中国新闻网",
  url: "https://www.chinanews.com.cn/cul/2026/08-19/123.shtml",
  publishedAt: "2026-08-19T02:00:00.000Z",
  capturedAt: "2026-08-19T06:00:00.000Z",
 },
 article: {
  titleZh: "城市博物馆推出传统文化专题展览",
  paragraphs: [
   { id: "source-p1", order: 1, zh: "城市博物馆最近推出传统文化专题展览，吸引了很多年轻观众。" },
   { id: "source-p2", order: 2, zh: "策展团队利用器物照片和互动资料，帮助观众理解不同历史时期的日常生活。" },
   { id: "source-p3", order: 3, zh: "博物馆还与学校和社区合作，希望把一次参观变成持续的公共文化学习活动。" },
  ],
  hanCharacterCount: 94,
  fingerprint: "1234abcd",
 },
 classification: { topic: "culture", targetLevel: "HSK5", estimatedLevel: null },
 estimatedMinutes: 2,
 enrichment: {
  translation: { status: "idle" },
  vocabulary: { status: "idle" },
  grammar: { status: "idle" },
  questions: { status: "idle" },
 },
};

const runtime: ResolvedUserAiRuntime = {
 keyId: "11111111-1111-4111-8111-111111111111",
 provider: "groq",
 providerLabel: "Groq",
 label: "Groq chính",
 maskedKey: "gsk_****1234",
 model: "openai/gpt-oss-20b",
 priority: 0,
 apiKey: "user-secret-key",
 capabilities: [
  "conversation",
  "daily-reading-translation",
  "daily-reading-learning",
  "lookup",
  "structured-memory",
 ],
};

function providerJson(value: object) {
 return { ok: true, content: JSON.stringify(value), model: runtime.model } as const;
}

describe("Daily Reading V2 enrichment generation", () => {
 beforeEach(() => {
  mocks.requestProvider.mockReset();
 });

 it("translates the immutable paragraphs by exact paragraph id and never asks for pinyin", async () => {
  mocks.requestProvider.mockResolvedValue(
   providerJson({
    titleVi: "Bảo tàng thành phố mở triển lãm văn hóa truyền thống",
    whyWorthReadingVi: "Bài đọc cho thấy bảo tàng đang kết nối người trẻ với văn hóa công cộng.",
    paragraphs: [
     { paragraphId: "source-p1", vi: "Đoạn một.", roleVi: "Mở bài" },
     { paragraphId: "source-p2", vi: "Đoạn hai.", roleVi: "Triển khai" },
     { paragraphId: "source-p3", vi: "Đoạn ba.", roleVi: "Kết" },
    ],
   }),
  );

  const result = await generateDailyReadingV2Enrichment({
   reading,
   runtime,
   module: "translation",
  });

  expect(result).toMatchObject({ ok: true, module: "translation" });
  if (!result.ok || result.module !== "translation") throw new Error("Expected translation success.");
  expect(result.data.paragraphs.map((paragraph) => paragraph.paragraphId)).toEqual([
   "source-p1",
   "source-p2",
   "source-p3",
  ]);
  expect(result.data).not.toHaveProperty("pinyin");
  const prompt = mocks.requestProvider.mock.calls[0]?.[0]?.prompt ?? "";
  expect(prompt).toContain("[source-p1]");
  expect(prompt).toContain("[source-p2]");
  expect(prompt).toContain("[source-p3]");
  expect(prompt).toContain("Do not generate pinyin");
 });

 it("repairs vocabulary once when the provider invents a word outside the article", async () => {
  const invalidItems = Array.from({ length: 10 }, (_, index) => ({
   hanzi: index === 0 ? "不存在的词" : index === 1 ? "博物馆" : `文化${index}`,
   meaningVi: `Nghĩa ${index}`,
   meaningInContextVi: `Nghĩa ngữ cảnh ${index}`,
   categoryVi: "Danh từ",
  }));
  const validWords = [
   "博物馆",
   "传统文化",
   "专题展览",
   "年轻观众",
   "策展团队",
   "器物照片",
   "互动资料",
   "日常生活",
   "学校",
   "社区",
  ];
  mocks.requestProvider
   .mockResolvedValueOnce(providerJson({ items: invalidItems }))
   .mockResolvedValueOnce(
    providerJson({
     items: validWords.map((hanzi, index) => ({
      hanzi,
      meaningVi: `Nghĩa ${index}`,
      meaningInContextVi: `Nghĩa ngữ cảnh ${index}`,
      categoryVi: "Từ trong bài",
     })),
    }),
   );

  const result = await generateDailyReadingV2Enrichment({
   reading,
   runtime,
   module: "vocabulary",
  });

  expect(result).toMatchObject({ ok: true, module: "vocabulary" });
  expect(mocks.requestProvider).toHaveBeenCalledTimes(2);
  const repairPrompt = mocks.requestProvider.mock.calls[1]?.[0]?.prompt ?? "";
  expect(repairPrompt).toContain("SCHEMA/CONTENT REPAIR");
 });

 it("rejects grammar examples that are not complete sentences from the source", async () => {
  const invalidGrammar = {
   items: [
    { patternZh: "利用……", explanationVi: "Giải thích 1", evidenceSentenceZh: "Một câu không có trong bài。" },
    { patternZh: "帮助……", explanationVi: "Giải thích 2", evidenceSentenceZh: "Câu sai thứ hai。" },
    { patternZh: "希望……", explanationVi: "Giải thích 3", evidenceSentenceZh: "Câu sai thứ ba。" },
   ],
  };
  mocks.requestProvider.mockResolvedValue(providerJson(invalidGrammar));

  const result = await generateDailyReadingV2Enrichment({
   reading,
   runtime,
   module: "grammar",
  });

  expect(result).toMatchObject({
   ok: false,
   status: "failed",
   module: "grammar",
   errorCode: "invalid-response",
  });
  expect(mocks.requestProvider).toHaveBeenCalledTimes(2);
 });

 it("requires question evidence ids to belong to the captured article", async () => {
  mocks.requestProvider.mockResolvedValue(
   providerJson({
    items: [
     { type: "main_idea", promptZh: "主旨是什么？", promptVi: "Ý chính là gì?", answerZh: "介绍博物馆的新展览。", answerVi: "Giới thiệu triển lãm mới.", evidenceParagraphIds: ["missing-p"] },
     { type: "detail", promptZh: "谁来看展览？", promptVi: "Ai xem triển lãm?", answerZh: "年轻观众。", answerVi: "Khán giả trẻ.", evidenceParagraphIds: ["source-p1"] },
     { type: "detail", promptZh: "团队用了什么？", promptVi: "Nhóm dùng gì?", answerZh: "器物照片和互动资料。", answerVi: "Ảnh hiện vật và tư liệu tương tác.", evidenceParagraphIds: ["source-p2"] },
     { type: "inference", promptZh: "为什么合作？", promptVi: "Vì sao hợp tác?", answerZh: "为了持续学习。", answerVi: "Để duy trì việc học.", evidenceParagraphIds: ["source-p3"] },
     { type: "summary", promptZh: "请概括全文。", promptVi: "Hãy tóm tắt.", answerZh: "博物馆通过展览和合作推动公共文化学习。", answerVi: "Bảo tàng thúc đẩy học văn hóa công cộng qua triển lãm và hợp tác.", evidenceParagraphIds: ["source-p1", "source-p3"] },
    ],
    sourcePhrasesZh: ["传统文化"],
    verificationSummaryVi: "Mọi câu trả lời dựa trên bài nguồn.",
   }),
  );

  const result = await generateDailyReadingV2Enrichment({
   reading,
   runtime,
   module: "questions",
  });

  expect(result).toMatchObject({
   ok: false,
   status: "failed",
   module: "questions",
   errorCode: "invalid-response",
  });
 });

 it("propagates provider quota errors without falling back to a system key", async () => {
  mocks.requestProvider.mockResolvedValue({
   ok: false,
   errorCode: "quota-exhausted",
   errorDetail: "Groq đang hết quota hoặc bị giới hạn tần suất.",
   model: runtime.model,
  });

  const result = await generateDailyReadingV2Enrichment({
   reading,
   runtime,
   module: "grammar",
  });

  expect(result).toMatchObject({
   ok: false,
   status: "failed",
   module: "grammar",
   errorCode: "quota-exhausted",
  });
  expect(mocks.requestProvider).toHaveBeenCalledTimes(1);
 });
});
