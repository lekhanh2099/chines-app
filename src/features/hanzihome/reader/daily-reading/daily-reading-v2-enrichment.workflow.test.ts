import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AiRuntimeReceipt } from "@/lib/ai-task-contract";

import type { DailyReadingV2EnrichmentArticle } from "./daily-reading-v2-enrichment.schemas";

const mocks = vi.hoisted(() => ({
 completeDailyReadingEnrichmentJob: vi.fn(),
 createServiceRoleSupabaseClient: vi.fn(),
 generateDailyReadingV2Enrichment: vi.fn(),
 markDailyReadingEnrichmentJobRunning: vi.fn(),
 recordUserAiRuntimeActivity: vi.fn(),
 recordUserAiRuntimeReceiptActivity: vi.fn(),
 resolveUserAiRuntimeSnapshot: vi.fn(),
 updateDailyReadingEnrichmentJobProgress: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service-role.server", () => ({
 createServiceRoleSupabaseClient: mocks.createServiceRoleSupabaseClient,
}));
vi.mock("@/services/ai-runtime.service", () => ({
 recordUserAiRuntimeActivity: mocks.recordUserAiRuntimeActivity,
 recordUserAiRuntimeReceiptActivity: mocks.recordUserAiRuntimeReceiptActivity,
 resolveUserAiRuntimeSnapshot: mocks.resolveUserAiRuntimeSnapshot,
}));
vi.mock("./daily-reading-v2-enrichment-jobs.server", () => ({
 completeDailyReadingEnrichmentJob: mocks.completeDailyReadingEnrichmentJob,
 markDailyReadingEnrichmentJobRunning: mocks.markDailyReadingEnrichmentJobRunning,
 updateDailyReadingEnrichmentJobProgress: mocks.updateDailyReadingEnrichmentJobProgress,
}));
vi.mock("./daily-reading-v2-enrichment.server", () => ({
 generateDailyReadingV2Enrichment: mocks.generateDailyReadingV2Enrichment,
}));

import { dailyReadingEnrichmentWorkflow } from "./daily-reading-v2-enrichment.workflow";

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
const reading: DailyReadingV2EnrichmentArticle = {
 id: "daily-v2:2026-08-27:1234abcd",
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
  mocks.completeDailyReadingEnrichmentJob.mockResolvedValue(undefined);
  mocks.recordUserAiRuntimeActivity.mockResolvedValue(undefined);
  mocks.updateDailyReadingEnrichmentJobProgress.mockResolvedValue(undefined);
 });

 it("runs modules sequentially and continues after one module fails", async () => {
  mocks.generateDailyReadingV2Enrichment
   .mockResolvedValueOnce({
    ok: false,
    status: "failed",
    module: "translation",
    errorCode: "invalid-response",
    errorDetail: "AI response was truncated.",
   })
   .mockResolvedValueOnce({
    ok: true,
    module: "vocabulary",
    data: { items: [] },
    generatedBy: { provider: "Google Gemini", model: "models/gemini-2.5-flash-lite" },
   });

  await dailyReadingEnrichmentWorkflow({
   userId: "user-1",
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

  expect(mocks.generateDailyReadingV2Enrichment).toHaveBeenNthCalledWith(
   1,
   expect.objectContaining({ module: "translation" }),
  );
  expect(mocks.generateDailyReadingV2Enrichment).toHaveBeenNthCalledWith(
   2,
   expect.objectContaining({ module: "vocabulary", targetCount: 12 }),
  );
  expect(mocks.completeDailyReadingEnrichmentJob).toHaveBeenCalledTimes(2);
  expect(mocks.recordUserAiRuntimeActivity).toHaveBeenNthCalledWith(
   1,
   expect.objectContaining({ status: "failure", errorCode: "invalid-response" }),
  );
  expect(mocks.recordUserAiRuntimeActivity).toHaveBeenNthCalledWith(
   2,
   expect.objectContaining({ status: "success" }),
  );
 });

 it("does not call a provider after the job is already terminal", async () => {
  mocks.markDailyReadingEnrichmentJobRunning.mockResolvedValue(false);

  await dailyReadingEnrichmentWorkflow({
   userId: "user-1",
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

  expect(mocks.generateDailyReadingV2Enrichment).not.toHaveBeenCalled();
  expect(mocks.completeDailyReadingEnrichmentJob).not.toHaveBeenCalled();
  expect(mocks.recordUserAiRuntimeActivity).not.toHaveBeenCalled();
 });
});
