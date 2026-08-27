import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 attachWorkflowRunToDailyReadingJobs: vi.fn(),
 completeDailyReadingEnrichmentJob: vi.fn(),
 createDailyReadingEnrichmentJobs: vi.fn(),
 deleteDailyReadingEnrichmentJobs: vi.fn(),
 getAiRuntimeReceipt: vi.fn(),
 listDailyReadingEnrichmentJobs: vi.fn(),
 recordUserAiRuntimeReceiptActivity: vi.fn(),
 recordUserAiTaskBlockedActivity: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
 resolveUserAiTaskRuntime: vi.fn(),
 start: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("workflow/api", () => ({ start: mocks.start }));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: object, init?: ResponseInit) => Response.json(body, init),
}));
vi.mock("@/services/ai-runtime.service", () => ({
 getAiRuntimeReceipt: mocks.getAiRuntimeReceipt,
 recordUserAiRuntimeReceiptActivity: mocks.recordUserAiRuntimeReceiptActivity,
 recordUserAiTaskBlockedActivity: mocks.recordUserAiTaskBlockedActivity,
 resolveUserAiTaskRuntime: mocks.resolveUserAiTaskRuntime,
}));
vi.mock(
 "@/features/hanzihome/reader/daily-reading/daily-reading-v2-enrichment-jobs.server",
 () => ({
  attachWorkflowRunToDailyReadingJobs: mocks.attachWorkflowRunToDailyReadingJobs,
  completeDailyReadingEnrichmentJob: mocks.completeDailyReadingEnrichmentJob,
  createDailyReadingEnrichmentJobs: mocks.createDailyReadingEnrichmentJobs,
  DailyReadingEnrichmentJobStorageError: class DailyReadingEnrichmentJobStorageError extends Error {},
  deleteDailyReadingEnrichmentJobs: mocks.deleteDailyReadingEnrichmentJobs,
  listDailyReadingEnrichmentJobs: mocks.listDailyReadingEnrichmentJobs,
 }),
);
vi.mock("@/features/hanzihome/reader/daily-reading/daily-reading-v2-enrichment.workflow", () => ({
 dailyReadingEnrichmentWorkflow: vi.fn(),
}));

import { DELETE, POST } from "./route";

const runId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const jobId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const keyId = "11111111-1111-4111-8111-111111111111";
const createdAt = "2026-08-27T03:00:00.000Z";
const receipt = {
 taskId: "daily-reading.translation",
 provider: "gemini",
 model: "models/gemini-2.5-flash-lite",
 keyId,
 keyLabel: "Gemini miễn phí",
 resolutionSource: "assigned",
};
const reading = {
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
  paragraphs: [
   { id: "source-p1", order: 1, zh: "城市举办文化活动。" },
   { id: "source-p2", order: 2, zh: "年轻读者来到现场。" },
   { id: "source-p3", order: 3, zh: "学校也参与了活动。" },
  ],
  hanCharacterCount: 30,
  fingerprint: "1234abcd",
 },
 classification: { topic: "culture", targetLevel: "HSK5", estimatedLevel: null },
};
const queuedJob = {
 id: jobId,
 runId,
 workflowRunId: null,
 articleId: reading.id,
 articleFingerprint: reading.article.fingerprint,
 module: "translation",
 taskId: "daily-reading.translation",
 status: "queued",
 receipt,
 progress: { completed: 0, total: 1 },
 result: null,
 errorCode: null,
 createdAt,
 startedAt: null,
 completedAt: null,
};

function post(body: object) {
 return POST(
  new Request("https://app.example/api/hanzihome/reader/daily-reading/enrichment-jobs", {
   method: "POST",
   body: JSON.stringify(body),
  }),
 );
}

describe("Daily Reading enrichment jobs route", () => {
 beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: { scope: "session" }, user: { id: "user-1" } },
  });
  mocks.resolveUserAiTaskRuntime.mockResolvedValue({ ok: true, runtime: { marker: "runtime" } });
  mocks.getAiRuntimeReceipt.mockReturnValue(receipt);
  mocks.start.mockResolvedValue({ runId: "workflow-run-1" });
  mocks.attachWorkflowRunToDailyReadingJobs.mockResolvedValue(undefined);
  mocks.createDailyReadingEnrichmentJobs.mockResolvedValue([queuedJob]);
 });

 it("enqueues a durable workflow with the resolved key and model snapshot", async () => {
  mocks.listDailyReadingEnrichmentJobs
   .mockResolvedValueOnce([])
   .mockResolvedValueOnce([])
   .mockResolvedValueOnce([{ ...queuedJob, workflowRunId: "workflow-run-1" }]);

  const response = await post({
   runId,
   reading,
   modules: [{ module: "translation", targetCount: null }],
  });
  const body = await response.json();

  expect(response.status).toBe(202);
  expect(mocks.resolveUserAiTaskRuntime).toHaveBeenCalledWith({
   supabase: { scope: "session" },
   userId: "user-1",
   taskId: "daily-reading.translation",
  });
  expect(mocks.createDailyReadingEnrichmentJobs).toHaveBeenCalledWith(
   expect.objectContaining({ jobs: [expect.objectContaining({ receipt, status: "queued" })] }),
  );
  expect(mocks.start).toHaveBeenCalledWith(expect.any(Function), [
   expect.objectContaining({
    userId: "user-1",
    jobs: [expect.objectContaining({ jobId, receipt })],
   }),
  ]);
  expect(body.jobs[0]).toMatchObject({ workflowRunId: "workflow-run-1", receipt });
 });

 it("returns an existing run idempotently without resolving or starting again", async () => {
  mocks.listDailyReadingEnrichmentJobs.mockResolvedValueOnce([queuedJob]);

  const response = await post({
   runId,
   reading,
   modules: [{ module: "translation", targetCount: null }],
  });

  expect(response.status).toBe(202);
  expect(mocks.resolveUserAiTaskRuntime).not.toHaveBeenCalled();
  expect(mocks.createDailyReadingEnrichmentJobs).not.toHaveBeenCalled();
  expect(mocks.start).not.toHaveBeenCalled();
 });

 it("keeps a started workflow durable when attaching its display run id fails", async () => {
  mocks.listDailyReadingEnrichmentJobs
   .mockResolvedValueOnce([])
   .mockResolvedValueOnce([])
   .mockResolvedValueOnce([queuedJob]);
  mocks.attachWorkflowRunToDailyReadingJobs.mockRejectedValue(new Error("metadata write failed"));

  const response = await post({
   runId,
   reading,
   modules: [{ module: "translation", targetCount: null }],
  });

  expect(response.status).toBe(202);
  expect(mocks.start).toHaveBeenCalledTimes(1);
  expect(mocks.completeDailyReadingEnrichmentJob).not.toHaveBeenCalled();
 });

 it("does not treat DELETE as cancellation for an active run", async () => {
  mocks.listDailyReadingEnrichmentJobs.mockResolvedValue([queuedJob]);

  const response = await DELETE(
   new Request("https://app.example/api/hanzihome/reader/daily-reading/enrichment-jobs", {
    method: "DELETE",
    body: JSON.stringify({ runId }),
   }),
  );

  expect(response.status).toBe(409);
  expect(mocks.deleteDailyReadingEnrichmentJobs).not.toHaveBeenCalled();
 });
});
