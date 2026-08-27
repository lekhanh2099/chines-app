import "server-only";

import { z } from "zod";

import { getSupabaseServerSecret } from "@/lib/env/server";
import { ApiKeyProviderSchema } from "@/lib/api-key-providers";
import {
 aiRuntimeReceiptSchema,
 aiTaskIdSchema,
 aiTaskResolutionSourceSchema,
 type AiRuntimeReceipt,
} from "@/lib/ai-task-contract";

import {
 dailyReadingV2EnrichmentJobSchema,
 dailyReadingV2EnrichmentJobStatusSchema,
 dailyReadingV2EnrichmentResponseSchema,
 type DailyReadingV2EnrichmentJob,
 type DailyReadingV2EnrichmentResponse,
} from "./daily-reading-v2-enrichment.schemas";
import { dailyReadingV2EnrichmentModuleSchema } from "./daily-reading-v2.schemas";

const jobRowSchema = z.strictObject({
 id: z.uuid(),
 run_id: z.uuid(),
 workflow_run_id: z.string().nullable(),
 article_id: z.string(),
 article_fingerprint: z.string(),
 module: dailyReadingV2EnrichmentModuleSchema,
 task_id: aiTaskIdSchema,
 status: dailyReadingV2EnrichmentJobStatusSchema,
 api_key_id: z.uuid().nullable(),
 key_label: z.string().nullable(),
 provider: ApiKeyProviderSchema.nullable(),
 model: z.string().nullable(),
 resolution_source: aiTaskResolutionSourceSchema.nullable(),
 progress_completed: z.number().int().nonnegative(),
 progress_total: z.number().int().positive(),
 result: z.json().nullable(),
 error_code: z.string().nullable(),
 created_at: z.string(),
 started_at: z.string().nullable(),
 completed_at: z.string().nullable(),
});

const jobRowsSchema = z.array(jobRowSchema);
const postgrestErrorSchema = z.object({ code: z.string().nullable().optional() });
const createDailyReadingEnrichmentJobSchema = z.strictObject({
 module: dailyReadingV2EnrichmentModuleSchema,
 taskId: aiTaskIdSchema,
 receipt: aiRuntimeReceiptSchema.nullable(),
 status: z.enum(["queued", "blocked"]),
 errorCode: z.string().nullable(),
});

export type CreateDailyReadingEnrichmentJob = z.output<
 typeof createDailyReadingEnrichmentJobSchema
>;

export class DailyReadingEnrichmentJobStorageError extends Error {
 constructor(message: string) {
  super(message);
  this.name = "DailyReadingEnrichmentJobStorageError";
 }
}

function buildJobsUrl() {
 return new URL(
  "/rest/v1/user_daily_reading_enrichment_jobs",
  z.url().parse(process.env.NEXT_PUBLIC_SUPABASE_URL),
 );
}

function serviceHeaders(hasBody: boolean, prefer?: string) {
 const secret = getSupabaseServerSecret();
 return {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  ...(hasBody ? { "Content-Type": "application/json" } : {}),
  ...(prefer ? { Prefer: prefer } : {}),
 };
}

async function requestJobStorage<T>(input: {
 url: URL;
 schema: z.ZodType<T>;
 method?: "GET" | "POST" | "PATCH" | "DELETE";
 body?: object | object[];
 prefer?: string;
}): Promise<T> {
 const response = await fetch(input.url, {
  method: input.method ?? "GET",
  headers: serviceHeaders(Boolean(input.body), input.prefer),
  ...(input.body ? { body: JSON.stringify(input.body) } : {}),
  cache: "no-store",
 });
 const payload = await response.json().catch(() => null);
 if (!response.ok) {
  const parsedError = postgrestErrorSchema.safeParse(payload);
  const code = parsedError.success ? parsedError.data.code : null;
  throw new DailyReadingEnrichmentJobStorageError(
   code ? `Daily Reading job storage failed (${code})` : "Daily Reading job storage failed",
  );
 }
 return input.schema.parse(payload);
}

function receiptFromRow(row: z.output<typeof jobRowSchema>): AiRuntimeReceipt | null {
 if (!row.api_key_id || !row.key_label || !row.provider || !row.model || !row.resolution_source) {
  return null;
 }
 return aiRuntimeReceiptSchema.parse({
  taskId: row.task_id,
  provider: row.provider,
  model: row.model,
  keyId: row.api_key_id,
  keyLabel: row.key_label,
  resolutionSource: row.resolution_source,
 });
}

function jobFromRow(row: z.output<typeof jobRowSchema>): DailyReadingV2EnrichmentJob {
 return dailyReadingV2EnrichmentJobSchema.parse({
  id: row.id,
  runId: row.run_id,
  workflowRunId: row.workflow_run_id,
  articleId: row.article_id,
  articleFingerprint: row.article_fingerprint,
  module: row.module,
  taskId: row.task_id,
  status: row.status,
  receipt: receiptFromRow(row),
  progress: {
   completed: row.progress_completed,
   total: row.progress_total,
  },
  result: row.result ? dailyReadingV2EnrichmentResponseSchema.parse(row.result) : null,
  errorCode: row.error_code,
  createdAt: row.created_at,
  startedAt: row.started_at,
  completedAt: row.completed_at,
 });
}

export async function listDailyReadingEnrichmentJobs(input: {
 userId: string;
 runId?: string;
 articleFingerprint?: string;
 activeOnly?: boolean;
 keyId?: string;
}) {
 const url = buildJobsUrl();
 url.searchParams.set("select", "*");
 url.searchParams.set("user_id", `eq.${input.userId}`);
 url.searchParams.set("order", "created_at.asc,id.asc");
 if (input.runId) url.searchParams.set("run_id", `eq.${input.runId}`);
 if (input.articleFingerprint) {
  url.searchParams.set("article_fingerprint", `eq.${input.articleFingerprint}`);
 }
 if (input.activeOnly) url.searchParams.set("status", "in.(queued,running)");
 if (input.keyId) url.searchParams.set("api_key_id", `eq.${input.keyId}`);
 const rows = await requestJobStorage({ url, schema: jobRowsSchema });
 return rows.map(jobFromRow);
}

export async function createDailyReadingEnrichmentJobs(input: {
 userId: string;
 runId: string;
 articleId: string;
 articleFingerprint: string;
 jobs: readonly CreateDailyReadingEnrichmentJob[];
}) {
 const url = buildJobsUrl();
 const now = new Date().toISOString();
 const rows = await requestJobStorage({
  url,
  schema: jobRowsSchema,
  method: "POST",
  prefer: "return=representation",
  body: input.jobs.map((job) => ({
   run_id: input.runId,
   user_id: input.userId,
   article_id: input.articleId,
   article_fingerprint: input.articleFingerprint,
   module: job.module,
   task_id: job.taskId,
   status: job.status,
   api_key_id: job.receipt?.keyId ?? null,
   key_label: job.receipt?.keyLabel ?? null,
   provider: job.receipt?.provider ?? null,
   model: job.receipt?.model ?? null,
   resolution_source: job.receipt?.resolutionSource ?? null,
   error_code: job.errorCode,
   completed_at: job.status === "blocked" ? now : null,
  })),
 });
 return rows.map(jobFromRow);
}

export async function attachWorkflowRunToDailyReadingJobs(
 userId: string,
 runId: string,
 workflowRunId: string,
) {
 const url = buildJobsUrl();
 url.searchParams.set("user_id", `eq.${userId}`);
 url.searchParams.set("run_id", `eq.${runId}`);
 url.searchParams.set("status", "eq.queued");
 await requestJobStorage({
  url,
  schema: jobRowsSchema,
  method: "PATCH",
  prefer: "return=representation",
  body: { workflow_run_id: workflowRunId },
 });
}

export async function markDailyReadingEnrichmentJobRunning(input: {
 userId: string;
 jobId: string;
 progressTotal: number;
}) {
 const url = buildJobsUrl();
 url.searchParams.set("user_id", `eq.${input.userId}`);
 url.searchParams.set("id", `eq.${input.jobId}`);
 url.searchParams.set("status", "eq.queued");
 const now = new Date().toISOString();
 const rows = await requestJobStorage({
  url,
  schema: jobRowsSchema,
  method: "PATCH",
  prefer: "return=representation",
  body: {
   status: "running",
   started_at: now,
   heartbeat_at: now,
   progress_total: input.progressTotal,
  },
 });
 return rows.length === 1;
}

export async function updateDailyReadingEnrichmentJobProgress(input: {
 userId: string;
 jobId: string;
 completed: number;
 total: number;
}) {
 const url = buildJobsUrl();
 url.searchParams.set("user_id", `eq.${input.userId}`);
 url.searchParams.set("id", `eq.${input.jobId}`);
 url.searchParams.set("status", "eq.running");
 await requestJobStorage({
  url,
  schema: jobRowsSchema,
  method: "PATCH",
  prefer: "return=representation",
  body: {
   progress_completed: input.completed,
   progress_total: input.total,
   heartbeat_at: new Date().toISOString(),
  },
 });
}

export async function completeDailyReadingEnrichmentJob(input: {
 userId: string;
 jobId: string;
 response: DailyReadingV2EnrichmentResponse;
}) {
 const url = buildJobsUrl();
 url.searchParams.set("user_id", `eq.${input.userId}`);
 url.searchParams.set("id", `eq.${input.jobId}`);
 url.searchParams.set("status", "in.(queued,running)");
 const now = new Date().toISOString();
 const succeeded = input.response.ok;
 await requestJobStorage({
  url,
  schema: jobRowsSchema,
  method: "PATCH",
  prefer: "return=representation",
  body: {
   status: succeeded ? "succeeded" : "failed",
   progress_completed: succeeded ? 1 : 0,
   progress_total: 1,
   result: succeeded ? input.response : null,
   error_code: succeeded ? null : input.response.errorCode,
   completed_at: now,
   heartbeat_at: now,
  },
 });
}

export async function deleteDailyReadingEnrichmentJobs(userId: string, runId: string) {
 const url = buildJobsUrl();
 url.searchParams.set("user_id", `eq.${userId}`);
 url.searchParams.set("run_id", `eq.${runId}`);
 url.searchParams.set("status", "in.(succeeded,failed,blocked)");
 await requestJobStorage({
  url,
  schema: z.null(),
  method: "DELETE",
  prefer: "return=minimal",
 });
}

export async function listActiveDailyReadingJobsForKey(userId: string, keyId: string) {
 return listDailyReadingEnrichmentJobs({ userId, keyId, activeOnly: true });
}
