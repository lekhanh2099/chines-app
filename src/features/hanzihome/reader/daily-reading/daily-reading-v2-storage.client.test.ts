import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DailyReadingV2, DailyReadingV2CaptureRun } from "./daily-reading-v2.schemas";
import {
 getDailyReadingV2Snapshot,
 hasScheduledCapturedArticleForDate,
 markDailyReadingV2EnrichmentRunInterrupted,
 removeAllDailyReadingV2Articles,
 removeDailyReadingV2Article,
 saveDailyReadingV2Article,
 saveDailyReadingV2EnrichmentRun,
 scheduledCaptureRunBlocksDate,
 updateDailyReadingV2Enrichment,
} from "./daily-reading-v2-storage.client";

const values = new Map<string, string>();

const article: DailyReadingV2 = {
 schemaVersion: "2.0.0",
 id: "daily-v2:2026-08-19:1234abcd",
 publishedDate: "2026-08-19",
 capturedAt: "2026-08-19T06:00:00.000Z",
 releaseKind: "scheduled",
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
   {
    id: "source-p1",
    order: 1,
    zh: "第一段介绍城市博物馆最近推出的传统文化专题展览以及展览面向年轻观众设计的新内容。",
   },
   {
    id: "source-p2",
    order: 2,
    zh: "第二段介绍策展团队如何利用器物照片和互动资料帮助观众理解不同历史时期的日常生活。",
   },
   {
    id: "source-p3",
    order: 3,
    zh: "第三段介绍博物馆与学校和社区合作，希望把一次参观变成持续的公共文化学习活动。",
   },
  ],
  hanCharacterCount: 120,
  fingerprint: "1234abcd",
 },
 classification: {
  topic: "culture",
  targetLevel: "HSK5",
  estimatedLevel: null,
 },
 estimatedMinutes: 2,
 enrichment: {
  translation: { status: "idle" },
  vocabulary: { status: "idle" },
  grammar: { status: "idle" },
  questions: { status: "idle" },
 },
};

function run(overrides: Partial<DailyReadingV2CaptureRun> = {}): DailyReadingV2CaptureRun {
 return {
  id: "capture-1",
  date: "2026-08-19",
  kind: "scheduled",
  status: "pending",
  stage: "discovering",
  attemptedAt: "2026-08-19T03:00:00.000Z",
  completedAt: "",
  errorCode: "",
  errorDetail: "",
  articleId: "",
  ...overrides,
 };
}

describe("Daily Reading V2 storage", () => {
 beforeEach(() => {
  values.clear();
  vi.stubGlobal("window", {
   localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
   },
   dispatchEvent: vi.fn(),
   addEventListener: vi.fn(),
   removeEventListener: vi.fn(),
  });
 });

 afterEach(() => {
  vi.unstubAllGlobals();
 });

 it("persists a captured article before enrichment and treats it as the scheduled success", () => {
  const saved = saveDailyReadingV2Article(article);
  const snapshot = getDailyReadingV2Snapshot();

  expect(saved.id).toBe(article.id);
  expect(snapshot.items.find((item) => item.id === article.id)?.article.paragraphs).toEqual(
   article.article.paragraphs,
  );
  expect(hasScheduledCapturedArticleForDate("2026-08-19")).toBe(true);
  expect(values.has("chines-app:daily-reading:v2")).toBe(true);
  expect(JSON.stringify(saved)).not.toMatch(/pinyin/iu);
 });

 it("deletes article data without deleting diagnostic run history", () => {
  saveDailyReadingV2Article(article);
  saveDailyReadingV2EnrichmentRun({
   id: "enrichment-delete-proof",
   articleId: article.id,
   module: "translation",
   status: "failed",
   attemptedAt: "2026-08-19T07:00:00.000Z",
   completedAt: "2026-08-19T07:00:01.000Z",
   errorCode: "provider-unavailable",
   errorDetail: "Groq temporarily unavailable.",
  });

  expect(removeDailyReadingV2Article(article.id)).toBe(true);
  const snapshot = getDailyReadingV2Snapshot();
  expect(snapshot.items).toHaveLength(0);
  expect(snapshot.enrichmentRuns.map((item) => item.id)).toContain("enrichment-delete-proof");
  expect(removeDailyReadingV2Article(article.id)).toBe(false);
 });

 it("clears all saved articles while keeping the ledger available for diagnostics", () => {
  saveDailyReadingV2Article(article);
  const second: DailyReadingV2 = {
   ...article,
   id: "daily-v2:2026-08-20:8765dcba",
   publishedDate: "2026-08-20",
   capturedAt: "2026-08-20T06:00:00.000Z",
   source: {
    ...article.source,
    url: "https://www.chinanews.com.cn/cul/2026/08-20/456.shtml",
    capturedAt: "2026-08-20T06:00:00.000Z",
   },
   article: {
    ...article.article,
    fingerprint: "8765dcba",
   },
  };
  saveDailyReadingV2Article(second);

  expect(removeAllDailyReadingV2Articles()).toBe(2);
  expect(getDailyReadingV2Snapshot().items).toHaveLength(0);
  expect(values.has("chines-app:daily-reading:v2")).toBe(true);
 });

 it("updates only the requested enrichment module and preserves the captured source", () => {
  saveDailyReadingV2Article(article);
  updateDailyReadingV2Enrichment(article.id, {
   module: "translation",
   state: {
    status: "ready",
    updatedAt: "2026-08-19T07:00:00.000Z",
    generatedBy: { provider: "Groq", model: "openai/gpt-oss-20b" },
    data: {
     titleVi: "Triển lãm văn hóa truyền thống tại bảo tàng thành phố",
     whyWorthReadingVi: "Bài đọc về hoạt động văn hóa công cộng.",
     adaptationNoticeVi: "Bản dịch hỗ trợ học tập.",
     paragraphs: article.article.paragraphs.map((paragraph) => ({
      paragraphId: paragraph.id,
      vi: `Nghĩa ${paragraph.id}`,
      roleVi: "Nội dung",
     })),
    },
   },
  });
  updateDailyReadingV2Enrichment(article.id, {
   module: "grammar",
   state: {
    status: "failed",
    errorCode: "invalid-response",
    updatedAt: "2026-08-19T07:01:00.000Z",
   },
  });

  const saved = getDailyReadingV2Snapshot().items.find((item) => item.id === article.id);
  expect(saved?.article).toEqual(article.article);
  expect(saved?.source).toEqual(article.source);
  expect(saved?.enrichment.translation.status).toBe("ready");
  expect(saved?.enrichment.grammar).toMatchObject({
   status: "failed",
   errorCode: "invalid-response",
  });
  expect(saved?.enrichment.vocabulary.status).toBe("idle");
  expect(saved?.enrichment.questions.status).toBe("idle");
 });

 it("marks only an interrupted running module as failed and keeps the article readable", () => {
  saveDailyReadingV2Article(article);
  updateDailyReadingV2Enrichment(article.id, {
   module: "vocabulary",
   state: { status: "running", startedAt: "2026-08-19T07:00:00.000Z" },
  });
  saveDailyReadingV2EnrichmentRun({
   id: "enrichment-1",
   articleId: article.id,
   module: "vocabulary",
   status: "pending",
   attemptedAt: "2026-08-19T07:00:00.000Z",
   completedAt: "",
   errorCode: "",
   errorDetail: "",
  });

  markDailyReadingV2EnrichmentRunInterrupted("enrichment-1");

  const snapshot = getDailyReadingV2Snapshot();
  const saved = snapshot.items.find((item) => item.id === article.id);
  expect(saved?.article.paragraphs).toEqual(article.article.paragraphs);
  expect(saved?.enrichment.vocabulary).toMatchObject({
   status: "failed",
   errorCode: "cancelled",
  });
  expect(snapshot.enrichmentRuns.find((item) => item.id === "enrichment-1")).toMatchObject({
   status: "failed",
   errorCode: "cancelled",
  });
 });

 it("blocks fresh/succeeded capture attempts but allows immediate interrupted recovery", () => {
  expect(
   scheduledCaptureRunBlocksDate(run(), "2026-08-19", new Date("2026-08-19T03:10:00.000Z")),
  ).toBe(true);
  expect(
   scheduledCaptureRunBlocksDate(
    run({ status: "succeeded", completedAt: "2026-08-19T03:04:00.000Z", articleId: article.id }),
    "2026-08-19",
    new Date("2026-08-19T20:00:00.000Z"),
   ),
  ).toBe(true);
  expect(
   scheduledCaptureRunBlocksDate(
    run({ status: "failed", errorCode: "interrupted", completedAt: "2026-08-19T03:01:00.000Z" }),
    "2026-08-19",
    new Date("2026-08-19T03:02:00.000Z"),
   ),
  ).toBe(false);
 });
});
