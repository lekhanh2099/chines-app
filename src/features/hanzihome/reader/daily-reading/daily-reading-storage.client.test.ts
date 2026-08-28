import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DailyReading, DailyReadingCaptureRun } from "./daily-reading.schemas";
import {
 getDailyReadingSnapshot,
 hasScheduledCapturedArticleForDate,
 removeAllDailyReadingArticles,
 removeDailyReadingArticle,
 saveDailyReadingArticle,
 saveDailyReadingEnrichmentRun,
 scheduledCaptureRunBlocksDate,
 updateDailyReadingEnrichment,
} from "./daily-reading-storage.client";
import { defaultDailyReadingSettings } from "./daily-reading.settings";

const values = new Map<string, string>();

const article: DailyReading = {
 schemaVersion: "2.0.0",
 id: "daily:2026-08-19:1234abcd",
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

function run(overrides: Partial<DailyReadingCaptureRun> = {}): DailyReadingCaptureRun {
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

describe("Daily Reading storage", () => {
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
  const saved = saveDailyReadingArticle(article);
  const snapshot = getDailyReadingSnapshot();

  expect(saved.id).toBe(article.id);
  expect(snapshot.items.find((item) => item.id === article.id)?.article.paragraphs).toEqual(
   article.article.paragraphs,
  );
  expect(hasScheduledCapturedArticleForDate("2026-08-19")).toBe(true);
  expect(values.has("chines-app:daily-reading")).toBe(true);
  expect(JSON.stringify(saved)).not.toMatch(/pinyin/iu);
 });

 it("deletes article data without deleting diagnostic run history", () => {
  saveDailyReadingArticle(article);
  saveDailyReadingEnrichmentRun({
   id: "enrichment-delete-proof",
   runId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
   articleId: article.id,
   articleFingerprint: article.article.fingerprint,
   module: "translation",
   status: "failed",
   attemptedAt: "2026-08-19T07:00:00.000Z",
   startedAt: "2026-08-19T07:00:00.000Z",
   completedAt: "2026-08-19T07:00:01.000Z",
   errorCode: "provider-unavailable",
   errorDetail: "Groq temporarily unavailable.",
   workflowRunId: "workflow-delete-proof",
   progressCompleted: 1,
   progressTotal: 1,
   receipt: null,
   reused: false,
  });

  expect(removeDailyReadingArticle(article.id)).toBe(true);
  const snapshot = getDailyReadingSnapshot();
  expect(snapshot.items).toHaveLength(0);
  expect(snapshot.enrichmentRuns.map((item) => item.id)).toContain("enrichment-delete-proof");
  expect(removeDailyReadingArticle(article.id)).toBe(false);
 });

 it("clears all saved articles while keeping the ledger available for diagnostics", () => {
  saveDailyReadingArticle(article);
  const second: DailyReading = {
   ...article,
   id: "daily:2026-08-20:8765dcba",
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
  saveDailyReadingArticle(second);

  expect(removeAllDailyReadingArticles()).toBe(2);
  expect(getDailyReadingSnapshot().items).toHaveLength(0);
  expect(values.has("chines-app:daily-reading")).toBe(true);
 });

 it("migrates the previous versioned settings into canonical storage", async () => {
  values.set("chines-app:daily-reading-settings:v3", JSON.stringify(defaultDailyReadingSettings));
  vi.resetModules();
  const storage = await import("./daily-reading-storage.client");

  expect(storage.readDailyReadingSettings()).toEqual(defaultDailyReadingSettings);
  expect(values.has("chines-app:daily-reading-settings")).toBe(true);
 });

 it("updates only the requested enrichment module and preserves the captured source", () => {
  saveDailyReadingArticle(article);
  updateDailyReadingEnrichment(article.id, {
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
  updateDailyReadingEnrichment(article.id, {
   module: "grammar",
   state: {
    status: "failed",
    errorCode: "invalid-response",
    updatedAt: "2026-08-19T07:01:00.000Z",
   },
  });

  const saved = getDailyReadingSnapshot().items.find((item) => item.id === article.id);
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

 it("migrates the previous versioned ledger into canonical storage", async () => {
  values.set(
   "chines-app:daily-reading:v2",
   JSON.stringify({
    schemaVersion: "2.2.0",
    items: [article],
    captureRuns: [],
    enrichmentRuns: [],
    legacyRuns: [],
   }),
  );
  vi.resetModules();
  const storage = await import("./daily-reading-storage.client");

  expect(storage.getDailyReadingSnapshot().items).toEqual([article]);
  expect(values.has("chines-app:daily-reading")).toBe(true);
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
