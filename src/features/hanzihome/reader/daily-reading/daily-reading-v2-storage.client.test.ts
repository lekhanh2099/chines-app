import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DailyReadingV2, DailyReadingV2CaptureRun } from "./daily-reading-v2.schemas";
import {
 getDailyReadingV2Snapshot,
 hasScheduledCapturedArticleForDate,
 saveDailyReadingV2Article,
 scheduledCaptureRunBlocksDate,
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
   { id: "source-p1", order: 1, zh: "第一段介绍城市博物馆最近推出的传统文化专题展览以及展览面向年轻观众设计的新内容。" },
   { id: "source-p2", order: 2, zh: "第二段介绍策展团队如何利用器物照片和互动资料帮助观众理解不同历史时期的日常生活。" },
   { id: "source-p3", order: 3, zh: "第三段介绍博物馆与学校和社区合作，希望把一次参观变成持续的公共文化学习活动。" },
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
