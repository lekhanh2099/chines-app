import { describe, expect, it } from "vitest";

import { dailyReadingSchema } from "@/features/daily-reading/model/daily-reading.schemas";
import {
 availableTabs,
 filterDailyReadingArticles,
 filterDailyReadingVocabItems,
 findDailyReading,
} from "@/features/daily-reading/components/daily-reading-library-utils";

function readingFixture() {
 return dailyReadingSchema.parse({
  schemaVersion: "2.0.0",
  id: "daily:2026-08-19:abc12345",
  publishedDate: "2026-08-19",
  capturedAt: "2026-08-19T10:00:00+07:00",
  releaseKind: "manual",
  provenance: "source-captured",
  source: {
   titleZh: "城市里的公共阅读空间越来越多",
   publisher: "中国新闻网",
   url: "https://www.chinanews.com.cn/example/article.html",
   publishedAt: "2026-08-19T08:00:00+08:00",
   capturedAt: "2026-08-19T10:00:00+07:00",
  },
  article: {
   titleZh: "城市里的公共阅读空间越来越多",
   paragraphs: [
    { id: "source-p1", order: 1, zh: "近年来，越来越多城市开始建设面向公众的阅读空间。" },
    { id: "source-p2", order: 2, zh: "这些空间不仅提供图书，也举办讲座和文化活动。" },
    { id: "source-p3", order: 3, zh: "不少市民把这里当成日常学习和交流的新场所。" },
   ],
   hanCharacterCount: 68,
   fingerprint: "abc12345",
  },
  classification: { topic: "society", targetLevel: "HSK5", estimatedLevel: null },
  estimatedMinutes: 2,
  enrichment: {
   translation: {
    status: "ready",
    updatedAt: "2026-08-19T10:05:00+07:00",
    generatedBy: { provider: "Groq", model: "openai/gpt-oss-20b" },
    data: {
     titleVi: "Không gian đọc công cộng",
     whyWorthReadingVi: "",
     adaptationNoticeVi: "",
     paragraphs: [
      { paragraphId: "source-p1", vi: "Những năm gần đây.", roleVi: "" },
      { paragraphId: "source-p2", vi: "Các không gian này.", roleVi: "" },
      { paragraphId: "source-p3", vi: "Nhiều người dân.", roleVi: "" },
     ],
    },
   },
   vocabulary: { status: "idle" },
   grammar: { status: "blocked", reason: "quota-exhausted" },
   questions: { status: "idle" },
  },
 });
}

describe("Daily Reading library utils", () => {
 it("finds a reading by id or returns null", () => {
  const reading = readingFixture();
  expect(findDailyReading([reading], reading.id)).toBe(reading);
  expect(findDailyReading([reading], "missing")).toBeNull();
 });

 it("only offers enrichment tabs whose module is ready", () => {
  expect(availableTabs(readingFixture())).toEqual(["reader", "notes", "support", "source"]);
 });

 it("filters articles by Chinese title, publisher or Vietnamese title", () => {
  const reading = readingFixture();
  const items = [reading];
  expect(filterDailyReadingArticles(items, "  ")).toBe(items);
  expect(filterDailyReadingArticles(items, "阅读")).toEqual([reading]);
  expect(filterDailyReadingArticles(items, "新闻")).toEqual([reading]);
  expect(filterDailyReadingArticles(items, "KHÔNG GIAN")).toEqual([reading]);
  expect(filterDailyReadingArticles(items, "unrelated")).toEqual([]);
 });

 it("filters vocabulary by hanzi, meaning, category or in-context meaning", () => {
  const items = [
   {
    id: "v1",
    order: 1,
    hanzi: "阅读",
    meaningVi: "đọc",
    categoryVi: "Động từ",
    meaningInContextVi: "đọc sách",
   },
  ];
  expect(filterDailyReadingVocabItems(items, "")).toBe(items);
  expect(filterDailyReadingVocabItems(items, "阅")).toEqual(items);
  expect(filterDailyReadingVocabItems(items, "ĐỘNG")).toEqual(items);
  expect(filterDailyReadingVocabItems(items, "sách")).toEqual(items);
  expect(filterDailyReadingVocabItems(items, "xyz")).toEqual([]);
 });
});
