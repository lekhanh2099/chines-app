import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AiRuntimeReceipt } from "@/lib/ai-task-contract";

import type { DailyReadingEnrichmentArticle } from "@/features/daily-reading/daily-reading-enrichment.schemas";

const mocks = vi.hoisted(() => ({
 buildDailyReadingTranslationResponse: vi.fn(),
 completeDailyReadingEnrichmentJob: vi.fn(),
 createDailyReadingTranslationPlan: vi.fn(),
 createServiceRoleSupabaseClient: vi.fn(),
 generateDailyReadingEnrichment: vi.fn(),
 generateDailyReadingTranslationGroup: vi.fn(),
 generateDailyReadingTranslationMetadata: vi.fn(),
 markDailyReadingEnrichmentJobRunning: vi.fn(),
 recordUserAiRuntimeActivity: vi.fn(),
 recordUserAiRuntimeReceiptActivity: vi.fn(),
 resolveUserAiRuntimeSnapshot: vi.fn(),
 updateDailyReadingEnrichmentJobProgress: vi.fn(),
 writeTranslationProgress: vi.fn(),
 closeTranslationProgress: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("workflow", () => ({
 getWritable: () => ({
  getWriter: () => ({
   write: mocks.writeTranslationProgress,
   close: mocks.closeTranslationProgress,
   releaseLock: vi.fn(),
  }),
 }),
}));
vi.mock("@/lib/supabase/service-role.server", () => ({
 createServiceRoleSupabaseClient: mocks.createServiceRoleSupabaseClient,
}));
vi.mock("@/services/ai-runtime.service", () => ({
 recordUserAiRuntimeActivity: mocks.recordUserAiRuntimeActivity,
 recordUserAiRuntimeReceiptActivity: mocks.recordUserAiRuntimeReceiptActivity,
 resolveUserAiRuntimeSnapshot: mocks.resolveUserAiRuntimeSnapshot,
}));
vi.mock("@/features/daily-reading/daily-reading-enrichment-jobs.server", () => ({
 completeDailyReadingEnrichmentJob: mocks.completeDailyReadingEnrichmentJob,
 markDailyReadingEnrichmentJobRunning: mocks.markDailyReadingEnrichmentJobRunning,
 updateDailyReadingEnrichmentJobProgress: mocks.updateDailyReadingEnrichmentJobProgress,
}));
vi.mock("@/features/daily-reading/daily-reading-enrichment.server", () => ({
 buildDailyReadingTranslationResponse: mocks.buildDailyReadingTranslationResponse,
 createDailyReadingTranslationPlan: mocks.createDailyReadingTranslationPlan,
 generateDailyReadingEnrichment: mocks.generateDailyReadingEnrichment,
 generateDailyReadingTranslationGroup: mocks.generateDailyReadingTranslationGroup,
 generateDailyReadingTranslationMetadata: mocks.generateDailyReadingTranslationMetadata,
}));

import { dailyReadingEnrichmentWorkflow } from "@/features/daily-reading/daily-reading-enrichment.workflow";

const keyId = "11111111-1111-4111-8111-111111111111";
const translationReceipt: AiRuntimeReceipt = {
 taskId: "daily-reading.translation",
 provider: "gemini",
 model: "models/gemini-2.5-flash-lite",
 keyId,
 keyLabel: "Gemini miễn phí",
 resolutionSource: "assigned",
};
const vocabularyReceipt: AiRuntimeReceipt = {
 ...translationReceipt,
 taskId: "daily-reading.vocabulary",
};
const reading: DailyReadingEnrichmentArticle = {
 id: "daily:2026-08-27:1234abcd",
 source: {
  titleZh: "城市文化活动",
  publisher: "中国新闻网",
  url: "https://www.chinanews.com.cn/cul/2026/08-27/example.shtml",
  publishedAt: "2026-08-27T01:00:00.000Z",
  capturedAt: "2026-08-27T02:00:00.000Z",
 },
 article: {
  titleZh: "城市文化活动",
  paragraphs: [{ id: "source-p1", order: 1, zh: "城市举办文化活动。" }],
  hanCharacterCount: 10,
  fingerprint: "1234abcd",
 },
 classification: { topic: "culture", targetLevel: "HSK5", estimatedLevel: null },
};

describe("Daily Reading enrichment workflow", () => {
 beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.createServiceRoleSupabaseClient.mockReturnValue({ scope: "service-role" });
  mocks.resolveUserAiRuntimeSnapshot.mockResolvedValue({
   ok: true,
   runtime: {
    keyId,
    provider: "gemini",
    providerLabel: "Google Gemini",
    label: "Gemini miễn phí",
    maskedKey: "AIza***",
    model: "models/gemini-2.5-flash-lite",
    priority: 0,
    apiKey: "secret",
    capabilities: [
     "conversation",
     "daily-reading-translation",
     "daily-reading-learning",
     "lookup",
     "structured-memory",
     "semantic-memory",
    ],
    taskId: "daily-reading.translation",
    resolutionSource: "assigned",
   },
  });
  mocks.markDailyReadingEnrichmentJobRunning.mockResolvedValue(true);
  mocks.completeDailyReadingEnrichmentJob.mockResolvedValue(true);
  mocks.recordUserAiRuntimeActivity.mockResolvedValue(undefined);
  mocks.recordUserAiRuntimeReceiptActivity.mockResolvedValue(undefined);
  mocks.updateDailyReadingEnrichmentJobProgress.mockResolvedValue(undefined);
  mocks.createDailyReadingTranslationPlan.mockReturnValue({
   groups: [
    [
     {
      paragraphId: "source-p1",
      sourceParagraphId: "source-p1",
      zh: "城市举办文化活动。",
     },
    ],
   ],
   progressTotal: 2,
  });
 });

 it("runs modules sequentially and continues after one module fails", async () => {
  mocks.generateDailyReadingTranslationMetadata.mockResolvedValueOnce({
   ok: false,
   errorCode: "invalid-response",
   errorDetail: "AI response was truncated.",
  });
  mocks.generateDailyReadingEnrichment.mockResolvedValueOnce({
   ok: true,
   module: "vocabulary",
   data: { items: [] },
   generatedBy: { provider: "Google Gemini", model: "models/gemini-2.5-flash-lite" },
  });

  await dailyReadingEnrichmentWorkflow({
   userId: "user-1",
   runId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
   reading,
   jobs: [
    {
     jobId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
     module: "translation",
     targetCount: null,
     receipt: translationReceipt,
    },
    {
     jobId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
     module: "vocabulary",
     targetCount: 12,
     receipt: vocabularyReceipt,
    },
   ],
  });

  expect(mocks.generateDailyReadingTranslationMetadata).toHaveBeenCalledOnce();
  expect(mocks.generateDailyReadingEnrichment).toHaveBeenCalledWith(
   expect.objectContaining({ module: "vocabulary", targetCount: 12 }),
  );
  expect(mocks.completeDailyReadingEnrichmentJob).toHaveBeenCalledTimes(2);
  expect(mocks.recordUserAiRuntimeReceiptActivity).toHaveBeenCalledWith(
   expect.objectContaining({ status: "failure", errorCode: "invalid-response" }),
  );
  expect(mocks.recordUserAiRuntimeActivity).toHaveBeenCalledWith(
   expect.objectContaining({ status: "success" }),
  );
 });

 it("checkpoints translation metadata and chunks in separate workflow steps", async () => {
  mocks.createDailyReadingTranslationPlan.mockReturnValue({
   groups: [
    [{ paragraphId: "source-p1::segment-1", sourceParagraphId: "source-p1", zh: "城市" }],
    [{ paragraphId: "source-p1::segment-2", sourceParagraphId: "source-p1", zh: "文化" }],
   ],
   progressTotal: 3,
  });
  mocks.generateDailyReadingTranslationMetadata.mockResolvedValue({
   ok: true,
   data: { titleVi: "Hoạt động văn hóa", whyWorthReadingVi: "Đáng đọc." },
  });
  mocks.generateDailyReadingTranslationGroup
   .mockResolvedValueOnce({
    ok: true,
    data: [{ paragraphId: "source-p1::segment-1", vi: "Thành phố", roleVi: "Mở bài" }],
   })
   .mockResolvedValueOnce({
    ok: true,
    data: [{ paragraphId: "source-p1::segment-2", vi: "văn hóa", roleVi: "" }],
   });
  mocks.buildDailyReadingTranslationResponse.mockReturnValue({
   ok: true,
   module: "translation",
   data: {
    titleVi: "Hoạt động văn hóa",
    whyWorthReadingVi: "Đáng đọc.",
    adaptationNoticeVi: "Bản dịch hỗ trợ học tập.",
    paragraphs: [{ paragraphId: "source-p1", vi: "Thành phố văn hóa", roleVi: "Mở bài" }],
   },
   generatedBy: { provider: "Google Gemini", model: "models/gemini-2.5-flash-lite" },
  });

  await dailyReadingEnrichmentWorkflow({
   userId: "user-1",
   runId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
   reading,
   jobs: [
    {
     jobId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
     module: "translation",
     targetCount: null,
     receipt: translationReceipt,
    },
   ],
  });

  expect(mocks.generateDailyReadingTranslationMetadata).toHaveBeenCalledOnce();
  expect(mocks.generateDailyReadingTranslationGroup).toHaveBeenCalledTimes(2);
  expect(mocks.writeTranslationProgress).toHaveBeenCalledOnce();
  expect(mocks.updateDailyReadingEnrichmentJobProgress).toHaveBeenNthCalledWith(
   1,
   expect.objectContaining({ completed: 1, total: 3 }),
  );
  expect(mocks.updateDailyReadingEnrichmentJobProgress).toHaveBeenNthCalledWith(
   2,
   expect.objectContaining({ completed: 2, total: 3 }),
  );
  expect(mocks.updateDailyReadingEnrichmentJobProgress).toHaveBeenNthCalledWith(
   3,
   expect.objectContaining({ completed: 3, total: 3 }),
  );
  expect(mocks.completeDailyReadingEnrichmentJob).toHaveBeenCalledOnce();
  expect(mocks.recordUserAiRuntimeActivity).toHaveBeenCalledWith(
   expect.objectContaining({ status: "success" }),
  );
 });

 it("does not call a provider after the job is already terminal", async () => {
  mocks.markDailyReadingEnrichmentJobRunning.mockResolvedValue(false);

  await dailyReadingEnrichmentWorkflow({
   userId: "user-1",
   runId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
   reading,
   jobs: [
    {
     jobId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
     module: "translation",
     targetCount: null,
     receipt: translationReceipt,
    },
   ],
  });

  expect(mocks.generateDailyReadingEnrichment).not.toHaveBeenCalled();
  expect(mocks.generateDailyReadingTranslationMetadata).not.toHaveBeenCalled();
  expect(mocks.completeDailyReadingEnrichmentJob).not.toHaveBeenCalled();
  expect(mocks.recordUserAiRuntimeActivity).not.toHaveBeenCalled();
 });

 it("does not record another terminal activity when the job was already completed", async () => {
  mocks.completeDailyReadingEnrichmentJob.mockResolvedValue(false);
  mocks.generateDailyReadingEnrichment.mockResolvedValue({
   ok: true,
   module: "vocabulary",
   data: { items: [] },
   generatedBy: { provider: "Google Gemini", model: "models/gemini-2.5-flash-lite" },
  });

  await dailyReadingEnrichmentWorkflow({
   userId: "user-1",
   runId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
   reading,
   jobs: [
    {
     jobId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
     module: "vocabulary",
     targetCount: 12,
     receipt: vocabularyReceipt,
    },
   ],
  });

  expect(mocks.recordUserAiRuntimeActivity).not.toHaveBeenCalled();
  expect(mocks.recordUserAiRuntimeReceiptActivity).not.toHaveBeenCalled();
 });
});
