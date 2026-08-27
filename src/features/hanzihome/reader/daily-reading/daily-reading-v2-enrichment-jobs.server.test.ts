import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSupabaseServerSecret } = vi.hoisted(() => ({
 getSupabaseServerSecret: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/server", () => ({ getSupabaseServerSecret }));

import { listDailyReadingEnrichmentJobs } from "./daily-reading-v2-enrichment-jobs.server";

const userId = "11111111-1111-4111-8111-111111111111";
const runId = "22222222-2222-4222-8222-222222222222";
const jobId = "33333333-3333-4333-8333-333333333333";
const keyId = "44444444-4444-4444-8444-444444444444";
const timestamp = "2026-08-27T10:35:54.000Z";

describe("Daily Reading enrichment job storage", () => {
 beforeEach(() => {
  getSupabaseServerSecret.mockReset();
  getSupabaseServerSecret.mockReturnValue("sb_secret_test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.unstubAllGlobals();
 });

 it("accepts the complete PostgREST row returned by the jobs table", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json([
    {
     id: jobId,
     run_id: runId,
     workflow_run_id: "workflow-run-1",
     user_id: userId,
     article_id: "daily-v2:2026-08-27:1234abcd",
     article_fingerprint: "1234abcd",
     module: "translation",
     task_id: "daily-reading.translation",
     status: "running",
     api_key_id: keyId,
     key_label: "Google Gemini",
     provider: "gemini",
     model: "models/gemini-2.5-flash-lite",
     resolution_source: "assigned",
     progress_completed: 2,
     progress_total: 12,
     result: null,
     error_code: null,
     created_at: timestamp,
     started_at: timestamp,
     completed_at: null,
     heartbeat_at: timestamp,
     expires_at: "2026-11-25T10:35:54.000Z",
    },
   ]),
  );
  vi.stubGlobal("fetch", fetchMock);

  await expect(listDailyReadingEnrichmentJobs({ userId, runId })).resolves.toEqual([
   {
    id: jobId,
    runId,
    workflowRunId: "workflow-run-1",
    articleId: "daily-v2:2026-08-27:1234abcd",
    articleFingerprint: "1234abcd",
    module: "translation",
    taskId: "daily-reading.translation",
    status: "running",
    receipt: {
     taskId: "daily-reading.translation",
     provider: "gemini",
     model: "models/gemini-2.5-flash-lite",
     keyId,
     keyLabel: "Google Gemini",
     resolutionSource: "assigned",
    },
    progress: { completed: 2, total: 12 },
    result: null,
    errorCode: null,
    createdAt: timestamp,
    startedAt: timestamp,
    completedAt: null,
   },
  ]);
  expect(String(fetchMock.mock.calls[0]?.[0])).toContain(`user_id=eq.${userId}`);
 });
});
