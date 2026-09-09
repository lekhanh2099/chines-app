import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 getReadable: vi.fn(),
 getRun: vi.fn(),
 listDailyReadingEnrichmentJobs: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("workflow/api", () => ({ getRun: mocks.getRun }));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
}));
vi.mock("@/features/daily-reading/daily-reading-enrichment-jobs.server", () => ({
 DailyReadingEnrichmentJobStorageError: class DailyReadingEnrichmentJobStorageError extends Error {},
 listDailyReadingEnrichmentJobs: mocks.listDailyReadingEnrichmentJobs,
}));
vi.mock("@/features/daily-reading/daily-reading-enrichment.workflow", () => ({
 dailyReadingTranslationProgressStream: "translation-progress",
}));

import { GET } from "./route";

const runId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("Daily Reading translation progress stream route", () => {
 beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { user: { id: "user-1" } },
  });
  mocks.listDailyReadingEnrichmentJobs.mockResolvedValue([
   { module: "translation", workflowRunId: "workflow-run-1" },
  ]);
  mocks.getReadable.mockReturnValue(
   new ReadableStream<Uint8Array>({
    start(controller) {
     controller.enqueue(new TextEncoder().encode('{"progressCompleted":1}\n'));
     controller.close();
    },
   }),
  );
  mocks.getRun.mockReturnValue({ getReadable: mocks.getReadable });
 });

 it("verifies ownership and resumes the exact named stream index", async () => {
  const response = await GET(
   new Request(
    `https://app.example/api/hanzihome/reader/daily-reading/enrichment-jobs/stream?runId=${runId}&startIndex=2`,
   ),
  );

  expect(response.status).toBe(200);
  expect(mocks.listDailyReadingEnrichmentJobs).toHaveBeenCalledWith({
   userId: "user-1",
   runId,
  });
  expect(mocks.getRun).toHaveBeenCalledWith("workflow-run-1");
  expect(mocks.getReadable).toHaveBeenCalledWith({
   namespace: "translation-progress",
   startIndex: 2,
  });
  await expect(response.text()).resolves.toContain('"progressCompleted":1');
 });

 it("does not open a workflow stream without a user-owned translation job", async () => {
  mocks.listDailyReadingEnrichmentJobs.mockResolvedValue([]);

  const response = await GET(
   new Request(
    `https://app.example/api/hanzihome/reader/daily-reading/enrichment-jobs/stream?runId=${runId}`,
   ),
  );

  expect(response.status).toBe(404);
  expect(mocks.getRun).not.toHaveBeenCalled();
 });
});
