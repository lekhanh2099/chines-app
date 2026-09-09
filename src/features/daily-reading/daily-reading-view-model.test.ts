import { describe, expect, it } from "vitest";

import {
 dailyReadingCaptureRunSchema,
 dailyReadingEnrichmentRunSchema,
 dailyReadingSchema,
} from "@/features/daily-reading/daily-reading.schemas";
import {
 buildDailyReadingActivityEntries,
 buildDailyReadingReaderDocument,
 getDailyReadingLearningSummary,
} from "@/features/daily-reading/daily-reading-view-model";

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
  classification: {
   topic: "society",
   targetLevel: "HSK5",
   estimatedLevel: null,
  },
  estimatedMinutes: 2,
  enrichment: {
   translation: {
    status: "ready",
    updatedAt: "2026-08-19T10:05:00+07:00",
    generatedBy: { provider: "Groq", model: "openai/gpt-oss-20b" },
    data: {
     titleVi: "Không gian đọc công cộng ngày càng nhiều trong thành phố",
     whyWorthReadingVi: "",
     adaptationNoticeVi: "",
     paragraphs: [
      {
       paragraphId: "source-p1",
       vi: "Những năm gần đây, ngày càng nhiều thành phố xây dựng không gian đọc công cộng.",
       roleVi: "",
      },
      {
       paragraphId: "source-p2",
       vi: "Các không gian này không chỉ có sách mà còn tổ chức tọa đàm và hoạt động văn hóa.",
       roleVi: "",
      },
      {
       paragraphId: "source-p3",
       vi: "Nhiều người dân xem đây là nơi mới để học tập và giao lưu hằng ngày.",
       roleVi: "",
      },
     ],
    },
   },
   vocabulary: { status: "idle" },
   grammar: { status: "blocked", reason: "quota-exhausted" },
   questions: { status: "idle" },
  },
 });
}

describe("Daily Reading presentation model", () => {
 it("builds a canonical Reader document from immutable source paragraphs without persisted pinyin", () => {
  const document = buildDailyReadingReaderDocument(readingFixture(), []);

  expect(document.source.kind).toBe("article");
  expect(document.title).toBe("城市里的公共阅读空间越来越多");
  expect(document.titleVi).toContain("Không gian đọc");
  expect(document.segments).toHaveLength(3);
  expect(document.segments[0]).toMatchObject({
   id: "source-p1",
   kind: "paragraph",
   zh: "近年来，越来越多城市开始建设面向公众的阅读空间。",
  });
  expect(document.segments[0]?.vi).toContain("Những năm gần đây");
  expect(document.segments.every((segment) => !("pinyin" in segment))).toBe(true);
  expect(document.metadata).toEqual([]);
  expect(document.capabilities).toEqual(["pinyin", "translation"]);
 });

 it("derives one compact learning status without hiding partial success", () => {
  expect(getDailyReadingLearningSummary(readingFixture())).toEqual({
   ready: 1,
   total: 4,
   running: false,
   attention: true,
   complete: false,
  });
 });

 it("merges capture and enrichment history by the real attempt timestamp", () => {
  const reading = readingFixture();
  const capture = dailyReadingCaptureRunSchema.parse({
   id: "capture-1",
   date: "2026-08-19",
   kind: "manual",
   status: "succeeded",
   stage: "completed",
   attemptedAt: "2026-08-19T10:00:00+07:00",
   completedAt: "2026-08-19T10:00:10+07:00",
   errorCode: "",
   errorDetail: "",
   articleId: reading.id,
  });
  const enrichment = dailyReadingEnrichmentRunSchema.parse({
   id: "enrichment-1",
   runId: "11111111-1111-4111-8111-111111111111",
   articleId: reading.id,
   articleFingerprint: reading.article.fingerprint,
   module: "grammar",
   status: "blocked",
   attemptedAt: "2026-08-19T10:06:00+07:00",
   startedAt: "2026-08-19T10:06:00+07:00",
   completedAt: "2026-08-19T10:06:01+07:00",
   errorCode: "quota-exhausted",
   errorDetail: "Groq đang hết quota hoặc bị giới hạn tần suất.",
   workflowRunId: "workflow-run-1",
   progressCompleted: 0,
   progressTotal: 1,
   receipt: null,
   reused: false,
  });

  const entries = buildDailyReadingActivityEntries({
   items: [reading],
   captureRuns: [capture],
   enrichmentRuns: [enrichment],
  });

  expect(entries.map((entry) => entry.id)).toEqual(["enrichment-1", "capture-1"]);
  expect(entries[0]).toMatchObject({
   kind: "enrichment",
   articleId: reading.id,
   articleTitleZh: reading.article.titleZh,
   status: "blocked",
  });
 });
});
