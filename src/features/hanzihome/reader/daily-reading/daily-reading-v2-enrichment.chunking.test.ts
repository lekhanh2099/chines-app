import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";

import type { DailyReadingV2 } from "./daily-reading-v2.schemas";

const mocks = vi.hoisted(() => ({ requestProvider: vi.fn() }));

vi.mock("./daily-reading-v2-enrichment-provider.server", () => ({
 requestDailyReadingV2EnrichmentProvider: mocks.requestProvider,
}));

import { generateDailyReadingV2Enrichment } from "./daily-reading-v2-enrichment.server";

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

const reading: DailyReadingV2 = {
 schemaVersion: "2.0.0",
 id: "daily-v2:2026-08-19:abcdef12",
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

describe("Daily Reading V2 translation chunk bounds", () => {
 beforeEach(() => {
  mocks.requestProvider.mockReset();
  mocks.requestProvider.mockImplementation((input: { prompt: string }) => {
   const ids = paragraphIdsFromPrompt(input.prompt);
   return Promise.resolve({
    ok: true,
    model: runtime.model,
    content: JSON.stringify({
     titleVi: "Hoạt động văn hóa đô thị",
     whyWorthReadingVi: "Kiểm tra bài có nhiều đoạn ngắn.",
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
  const result = await generateDailyReadingV2Enrichment({
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
  expect(mocks.requestProvider.mock.calls.length).toBe(3);
  for (const call of mocks.requestProvider.mock.calls) {
   expect(paragraphIdsFromPrompt(call[0]?.prompt ?? "").length).toBeLessThanOrEqual(20);
  }
 });
});
