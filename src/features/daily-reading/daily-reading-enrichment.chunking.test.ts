import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";

import type { DailyReading } from "@/features/daily-reading/daily-reading.schemas";

const mocks = vi.hoisted(() => ({ requestProvider: vi.fn() }));

vi.mock("@/features/daily-reading/daily-reading-enrichment-provider.server", () => ({
 requestDailyReadingEnrichmentProvider: mocks.requestProvider,
}));

import { generateDailyReadingEnrichment } from "@/features/daily-reading/daily-reading-enrichment.server";

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

const paragraphs = Array.from({ length: 45 }, (_, index) => ({
 id: `short-p${index + 1}`,
 order: index + 1,
 zh: `第${index + 1}段介绍一个很短的文化活动内容。`,
}));

const reading: DailyReading = {
 schemaVersion: "2.0.0",
 id: "daily:2026-08-19:abcdef12",
 publishedDate: "2026-08-19",
 capturedAt: "2026-08-19T06:00:00.000Z",
 releaseKind: "manual",
 provenance: "source-captured",
 source: {
  titleZh: "城市文化活动",
  publisher: "中国新闻网",
  url: "https://www.chinanews.com.cn/cul/2026/08-19/many-paragraphs.shtml",
  publishedAt: "2026-08-19T02:00:00.000Z",
  capturedAt: "2026-08-19T06:00:00.000Z",
 },
 article: {
  titleZh: "城市文化活动",
  paragraphs,
  hanCharacterCount: paragraphs.reduce((sum, paragraph) => sum + paragraph.zh.length, 0),
  fingerprint: "abcdef12",
 },
 classification: { topic: "culture", targetLevel: "HSK5", estimatedLevel: null },
 estimatedMinutes: 4,
 enrichment: {
  translation: { status: "idle" },
  vocabulary: { status: "idle" },
  grammar: { status: "idle" },
  questions: { status: "idle" },
 },
};

function paragraphIdsFromPrompt(prompt: string) {
 return [...prompt.matchAll(/\[(short-p\d+)\]/gu)]
  .map((match) => match[1])
  .filter((value): value is string => value !== undefined);
}

describe("Daily Reading translation chunk bounds", () => {
 beforeEach(() => {
  mocks.requestProvider.mockReset();
  mocks.requestProvider.mockImplementation((input: { prompt: string }) => {
   const ids = paragraphIdsFromPrompt(input.prompt);
   if (ids.length === 0) {
    return Promise.resolve({
     ok: true,
     model: runtime.model,
     content: JSON.stringify({
      titleVi: "Hoạt động văn hóa đô thị",
      whyWorthReadingVi: "Kiểm tra bài có nhiều đoạn ngắn.",
     }),
    });
   }
   return Promise.resolve({
    ok: true,
    model: runtime.model,
    content: JSON.stringify({
     paragraphs: ids.map((paragraphId) => ({
      paragraphId,
      vi: `Nghĩa ${paragraphId}`,
      roleVi: "Nội dung",
     })),
    }),
   });
  });
 });

 it("covers all 45 paragraphs while keeping every provider chunk within the draft limit", async () => {
  const result = await generateDailyReadingEnrichment({
   reading,
   runtime,
   module: "translation",
  });

  expect(result).toMatchObject({ ok: true, module: "translation" });
  if (!result.ok || result.module !== "translation")
   throw new Error("Expected translation success.");

  expect(result.data.paragraphs.map((paragraph) => paragraph.paragraphId)).toEqual(
   paragraphs.map((paragraph) => paragraph.id),
  );
  expect(mocks.requestProvider.mock.calls.length).toBe(16);
  for (const call of mocks.requestProvider.mock.calls.slice(1)) {
   expect(paragraphIdsFromPrompt(call[0]?.prompt ?? "").length).toBeLessThanOrEqual(3);
  }
 });

 it("splits only an invalid translation chunk and preserves source order", async () => {
  let truncatedResponses = 0;
  mocks.requestProvider.mockImplementation((input: { prompt: string }) => {
   const ids = paragraphIdsFromPrompt(input.prompt);
   if (ids.length === 0) {
    return Promise.resolve({
     ok: true,
     model: runtime.model,
     content: JSON.stringify({
      titleVi: "Hoạt động văn hóa đô thị",
      whyWorthReadingVi: "Kiểm tra phục hồi JSON bị cắt.",
     }),
    });
   }
   if (truncatedResponses < 2 && ids.length === 3) {
    truncatedResponses += 1;
    return Promise.resolve({ ok: true, model: runtime.model, content: '{"paragraphs":[' });
   }
   return Promise.resolve({
    ok: true,
    model: runtime.model,
    content: JSON.stringify({
     paragraphs: ids.map((paragraphId) => ({
      paragraphId,
      vi: `Nghĩa ${paragraphId}`,
      roleVi: "Nội dung",
     })),
    }),
   });
  });

  const result = await generateDailyReadingEnrichment({
   reading,
   runtime,
   module: "translation",
  });

  expect(result).toMatchObject({ ok: true, module: "translation" });
  if (!result.ok || result.module !== "translation")
   throw new Error("Expected translation success.");
  expect(result.data.paragraphs.map((paragraph) => paragraph.paragraphId)).toEqual(
   paragraphs.map((paragraph) => paragraph.id),
  );
  expect(truncatedResponses).toBe(2);
  expect(mocks.requestProvider.mock.calls.length).toBe(19);
 });
});
