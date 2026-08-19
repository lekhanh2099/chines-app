import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DailyReadingV2 } from "./daily-reading-v2.schemas";

vi.mock("./daily-reading-lock.client", () => ({
 DailyReadingGenerationBusyError: class extends Error {},
 withDailyReadingGenerationLock: <Result>(task: () => Promise<Result>) => task(),
}));

import {
 enrichDailyReadingV2LearningSupport,
 enrichDailyReadingV2Module,
} from "./daily-reading-v2-enrichment.client";
import {
 getDailyReadingV2Snapshot,
 saveDailyReadingV2Article,
} from "./daily-reading-v2-storage.client";

const values = new Map<string, string>();

const article: DailyReadingV2 = {
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
   {
    id: "source-p2",
    order: 2,
    zh: "策展团队利用器物照片和互动资料，帮助观众理解不同历史时期的日常生活。",
   },
   {
    id: "source-p3",
    order: 3,
    zh: "博物馆还与学校和社区合作，希望把一次参观变成持续的公共文化学习活动。",
   },
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

const readyTranslation: Extract<DailyReadingV2["enrichment"]["translation"], { status: "ready" }> =
 {
  status: "ready",
  updatedAt: "2026-08-19T06:30:00.000Z",
  generatedBy: { provider: "Groq", model: "openai/gpt-oss-20b" },
  data: {
   titleVi: "Triển lãm văn hóa truyền thống tại bảo tàng thành phố",
   whyWorthReadingVi: "Bài đọc nói về bảo tàng và học tập văn hóa công cộng.",
   adaptationNoticeVi: "Bản dịch hỗ trợ học tập.",
   paragraphs: article.article.paragraphs.map((paragraph) => ({
    paragraphId: paragraph.id,
    vi: `Nghĩa ${paragraph.id}`,
    roleVi: "Nội dung",
   })),
  },
 };

describe("Daily Reading V2 enrichment client", () => {
 beforeEach(() => {
  values.clear();
  vi.stubGlobal("navigator", { onLine: true });
  vi.stubGlobal("window", {
   localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
   },
   dispatchEvent: vi.fn(),
   addEventListener: vi.fn(),
   removeEventListener: vi.fn(),
   setTimeout,
   clearTimeout,
  });
  saveDailyReadingV2Article(article);
 });

 afterEach(() => {
  vi.unstubAllGlobals();
 });

 it("marks all pending learning modules blocked after missing-key without touching the article", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json(
    {
     ok: false,
     status: "blocked",
     module: "translation",
     reason: "missing-ai-key",
     errorCode: "missing-ai-key",
     errorDetail: "Chưa có API key AI đang hoạt động cho phần hỗ trợ học tập.",
    },
    { status: 409 },
   ),
  );
  vi.stubGlobal("fetch", fetchMock);

  const updated = await enrichDailyReadingV2LearningSupport(article.id);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(updated.article).toEqual(article.article);
  expect(updated.enrichment.translation).toMatchObject({
   status: "blocked",
   reason: "missing-ai-key",
  });
  expect(updated.enrichment.vocabulary).toMatchObject({
   status: "blocked",
   reason: "missing-ai-key",
  });
  expect(updated.enrichment.grammar).toMatchObject({ status: "blocked", reason: "missing-ai-key" });
  expect(updated.enrichment.questions).toMatchObject({
   status: "blocked",
   reason: "missing-ai-key",
  });
 });

 it("skips ready modules and never overwrites them when a later module becomes blocked", async () => {
  saveDailyReadingV2Article({
   ...article,
   enrichment: { ...article.enrichment, translation: readyTranslation },
  });
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json(
    {
     ok: false,
     status: "blocked",
     module: "vocabulary",
     reason: "missing-ai-key",
     errorCode: "missing-ai-key",
     errorDetail: "Chưa có API key AI đang hoạt động cho phần hỗ trợ học tập.",
    },
    { status: 409 },
   ),
  );
  vi.stubGlobal("fetch", fetchMock);

  const updated = await enrichDailyReadingV2LearningSupport(article.id);
  const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body ?? "");

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(requestBody).toContain('"module":"vocabulary"');
  expect(updated.enrichment.translation).toEqual(readyTranslation);
  expect(updated.enrichment.vocabulary).toMatchObject({
   status: "blocked",
   reason: "missing-ai-key",
  });
  expect(updated.enrichment.grammar).toMatchObject({ status: "blocked", reason: "missing-ai-key" });
  expect(updated.enrichment.questions).toMatchObject({
   status: "blocked",
   reason: "missing-ai-key",
  });
 });

 it("persists a successful module without resetting another module or sending sibling state", async () => {
  const before = getDailyReadingV2Snapshot().items.find((item) => item.id === article.id);
  expect(before?.enrichment.translation.status).toBe("idle");
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json({
    ok: true,
    module: "translation",
    data: readyTranslation.data,
    generatedBy: readyTranslation.generatedBy,
   }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const updated = await enrichDailyReadingV2Module(article.id, "translation");
  const requestBody = String(fetchMock.mock.calls[0]?.[1]?.body ?? "");

  expect(updated.enrichment.translation.status).toBe("ready");
  expect(updated.enrichment.grammar.status).toBe("idle");
  expect(updated.article).toEqual(article.article);
  expect(JSON.stringify(updated.enrichment.translation)).not.toMatch(/pinyin/iu);
  expect(requestBody).toContain('"article"');
  expect(requestBody).toContain('"classification"');
  expect(requestBody).not.toContain('"enrichment"');
  expect(requestBody).not.toContain('"publishedDate"');
 });
});
