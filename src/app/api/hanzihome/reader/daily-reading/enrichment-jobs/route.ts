import type { JsonFieldValue } from "@/types/json";

import { createHash } from "node:crypto";
import { z } from "zod";
import { start } from "workflow/api";

import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import {
 getAiRuntimeReceipt,
 recordUserAiRuntimeReceiptActivity,
 recordUserAiTaskBlockedActivity,
 resolveUserAiTaskRuntime,
} from "@/services/ai-runtime.service";
import {
 attachWorkflowRunToDailyReadingJobs,
 completeDailyReadingEnrichmentJob,
 type CreateDailyReadingEnrichmentJob,
 createDailyReadingEnrichmentJobs,
 DailyReadingEnrichmentJobStorageError,
 deleteDailyReadingEnrichmentJobs,
 findReusableDailyReadingEnrichmentJob,
 listDailyReadingEnrichmentJobs,
} from "@/features/hanzihome/reader/daily-reading/daily-reading-enrichment-jobs.server";
import {
 dailyReadingEnrichmentJobRequestSchema,
 dailyReadingEnrichmentJobsResponseSchema,
 dailyReadingEnrichmentJobsQueryResponseSchema,
 type DailyReadingEnrichmentJobModuleRequest,
} from "@/features/hanzihome/reader/daily-reading/daily-reading-enrichment.schemas";
import type { DailyReadingEnrichmentModule } from "@/features/hanzihome/reader/daily-reading/daily-reading.schemas";
import {
 dailyReadingEnrichmentWorkflow,
 type DailyReadingEnrichmentWorkflowInput,
} from "@/features/hanzihome/reader/daily-reading/daily-reading-enrichment.workflow";
import type { AiTaskId } from "@/lib/ai-task-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DAILY_READING_ENRICHMENT_CONTRACT_VERSION = "daily-reading-2026-08-28";

const querySchema = z
 .strictObject({
  runId: z.uuid().optional(),
  articleFingerprint: z
   .string()
   .regex(/^[0-9a-f]{8}$/u)
   .optional(),
 })
 .refine((query) => Boolean(query.runId || query.articleFingerprint));

const deleteSchema = z.strictObject({ runId: z.uuid() });

function taskIdForModule(module: DailyReadingEnrichmentModule): AiTaskId {
 switch (module) {
  case "translation":
   return "daily-reading.translation";
  case "vocabulary":
   return "daily-reading.vocabulary";
  case "grammar":
   return "daily-reading.grammar";
  case "questions":
   return "daily-reading.questions";
 }
}

function blockedErrorCode(
 resolution: Exclude<Awaited<ReturnType<typeof resolveUserAiTaskRuntime>>, { ok: true }>,
) {
 if (resolution.status === "task-disabled") return "task-disabled";
 if (resolution.status === "storage-unavailable") return "storage-unavailable";
 return "missing-ai-key";
}

function moduleRequestFor(
 modules: readonly DailyReadingEnrichmentJobModuleRequest[],
 module: DailyReadingEnrichmentModule,
) {
 return modules.find((candidate) => candidate.module === module);
}

function requestSignature(input: {
 articleFingerprint: string;
 moduleRequest: DailyReadingEnrichmentJobModuleRequest;
 taskId: AiTaskId;
 receipt: ReturnType<typeof getAiRuntimeReceipt>;
}) {
 return createHash("sha256")
  .update(
   JSON.stringify([
    input.articleFingerprint,
    input.moduleRequest.module,
    input.moduleRequest.targetCount,
    DAILY_READING_ENRICHMENT_CONTRACT_VERSION,
    input.taskId,
    input.receipt.keyId,
    input.receipt.provider,
    input.receipt.model,
   ]),
  )
  .digest("hex");
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const payload: JsonFieldValue = await request.json().catch(() => null);
 const parsed = dailyReadingEnrichmentJobRequestSchema.safeParse(payload);
 if (!parsed.success) {
  return privateNoStoreJson(
   { error: "Invalid Daily Reading enrichment job request", issues: z.flattenError(parsed.error) },
   { status: 400 },
  );
 }

 try {
  const existing = await listDailyReadingEnrichmentJobs({
   userId: auth.context.user.id,
   runId: parsed.data.runId,
  });
  if (existing.length > 0) {
   return privateNoStoreJson(
    dailyReadingEnrichmentJobsResponseSchema.parse({
     runId: parsed.data.runId,
     jobs: existing,
    }),
    {
     status: existing.some((job) => job.status === "queued" || job.status === "running")
      ? 202
      : 200,
    },
   );
  }

  const active = await listDailyReadingEnrichmentJobs({
   userId: auth.context.user.id,
   articleFingerprint: parsed.data.reading.article.fingerprint,
   activeOnly: true,
  });
  const conflicting = active.find((job) =>
   parsed.data.modules.some((module) => module.module === job.module),
  );
  if (conflicting) {
   return privateNoStoreJson(
    {
     error: "Daily Reading enrichment is already running for this article module",
     code: "DAILY_READING_JOB_ACTIVE",
     runId: conflicting.runId,
     module: conflicting.module,
    },
    { status: 409 },
   );
  }

  const jobDrafts = await Promise.all(
   parsed.data.modules.map(async (moduleRequest): Promise<CreateDailyReadingEnrichmentJob> => {
    const taskId = taskIdForModule(moduleRequest.module);
    const resolution = await resolveUserAiTaskRuntime({
     supabase: auth.context.supabase,
     userId: auth.context.user.id,
     taskId,
    });
    if (!resolution.ok) {
     return {
      module: moduleRequest.module,
      taskId,
      receipt: null,
      status: "blocked",
      errorCode: blockedErrorCode(resolution),
      requestSignature: null,
      reusedFromJobId: null,
      result: null,
     };
    }

    const receipt = getAiRuntimeReceipt(resolution.runtime);
    const signature = requestSignature({
     articleFingerprint: parsed.data.reading.article.fingerprint,
     moduleRequest,
     taskId,
     receipt,
    });
    const reusable = parsed.data.regenerate
     ? null
     : await findReusableDailyReadingEnrichmentJob({
        userId: auth.context.user.id,
        requestSignature: signature,
       });
    const reusableResult =
     reusable?.module === moduleRequest.module && reusable.result?.ok ? reusable.result : null;
    const result = reusableResult
     ? {
        ...reusableResult,
        generatedBy: { ...reusableResult.generatedBy, receipt },
       }
     : null;
    const reusedFromJobId = result && reusable ? reusable.id : null;
    return {
     module: moduleRequest.module,
     taskId,
     receipt,
     status: result ? "succeeded" : "queued",
     errorCode: null,
     requestSignature: signature,
     reusedFromJobId,
     result,
    };
   }),
  );

  const created = await createDailyReadingEnrichmentJobs({
   userId: auth.context.user.id,
   runId: parsed.data.runId,
   articleId: parsed.data.reading.id,
   articleFingerprint: parsed.data.reading.article.fingerprint,
   jobs: jobDrafts,
  });

  for (const job of created) {
   if (job.status === "blocked" && job.errorCode) {
    await recordUserAiTaskBlockedActivity({
     userId: auth.context.user.id,
     taskId: job.taskId,
     errorCode: job.errorCode,
     resourceType: "daily-reading-article",
     resourceId: parsed.data.reading.id,
    });
   }
  }

  const workflowJobs: DailyReadingEnrichmentWorkflowInput["jobs"] = [];
  for (const job of created) {
   const moduleRequest = moduleRequestFor(parsed.data.modules, job.module);
   if (job.status === "queued" && job.receipt && moduleRequest) {
    workflowJobs.push({ ...moduleRequest, jobId: job.id, receipt: job.receipt });
   }
  }

  if (workflowJobs.length > 0) {
   let workflowRunId: string;
   try {
    const workflowRun = await start(dailyReadingEnrichmentWorkflow, [
     {
      userId: auth.context.user.id,
      runId: parsed.data.runId,
      reading: parsed.data.reading,
      jobs: workflowJobs,
     },
    ]);
    workflowRunId = workflowRun.runId;
   } catch {
    for (const job of created) {
     if (job.status === "queued") {
      const completed = await completeDailyReadingEnrichmentJob({
       userId: auth.context.user.id,
       jobId: job.id,
       response: {
        ok: false,
        status: "failed",
        module: job.module,
        errorCode: "provider-unavailable",
        errorDetail: "Không thể khởi động job AI bền vững lúc này.",
       },
      });
      if (completed && job.receipt) {
       await recordUserAiRuntimeReceiptActivity({
        userId: auth.context.user.id,
        receipt: job.receipt,
        status: "failure",
        errorCode: "provider-unavailable",
        resourceType: "daily-reading-article",
        resourceId: parsed.data.reading.id,
       });
      }
     }
    }
    return apiError(
     "Unable to start Daily Reading enrichment workflow",
     503,
     "WORKFLOW_UNAVAILABLE",
    );
   }
   try {
    await attachWorkflowRunToDailyReadingJobs(
     auth.context.user.id,
     parsed.data.runId,
     workflowRunId,
    );
   } catch {
    // The durable workflow is already running. A missing display-only run ID must not stop it.
   }
  }

  const jobs = await listDailyReadingEnrichmentJobs({
   userId: auth.context.user.id,
   runId: parsed.data.runId,
  });
  return privateNoStoreJson(
   dailyReadingEnrichmentJobsResponseSchema.parse({ runId: parsed.data.runId, jobs }),
   { status: jobs.some((job) => job.status === "queued" || job.status === "running") ? 202 : 200 },
  );
 } catch (error) {
  if (error instanceof DailyReadingEnrichmentJobStorageError) {
   return apiError(
    "Daily Reading enrichment job storage is not ready",
    503,
    "AI_JOB_SCHEMA_UNAVAILABLE",
   );
  }
  return apiError("Unable to enqueue Daily Reading enrichment jobs", 500, "AI_JOB_ENQUEUE_FAILED");
 }
}

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const url = new URL(request.url);
 const parsed = querySchema.safeParse({
  runId: url.searchParams.get("runId") ?? undefined,
  articleFingerprint: url.searchParams.get("articleFingerprint") ?? undefined,
 });
 if (!parsed.success)
  return apiError("runId or articleFingerprint is required", 400, "INVALID_QUERY");

 try {
  let jobs = await listDailyReadingEnrichmentJobs({
   userId: auth.context.user.id,
   ...(parsed.data.runId ? { runId: parsed.data.runId } : {}),
   ...(parsed.data.articleFingerprint
    ? { articleFingerprint: parsed.data.articleFingerprint }
    : {}),
  });
  const newest = jobs[jobs.length - 1];
  const runId = parsed.data.runId ?? newest?.runId;
  if (!runId) {
   return privateNoStoreJson(
    dailyReadingEnrichmentJobsQueryResponseSchema.parse({ runId: null, jobs: [] }),
   );
  }
  if (!parsed.data.runId) jobs = jobs.filter((job) => job.runId === runId);
  return privateNoStoreJson(dailyReadingEnrichmentJobsQueryResponseSchema.parse({ runId, jobs }));
 } catch (error) {
  if (error instanceof DailyReadingEnrichmentJobStorageError) {
   return apiError(
    "Daily Reading enrichment job storage is not ready",
    503,
    "AI_JOB_SCHEMA_UNAVAILABLE",
   );
  }
  return apiError("Unable to load Daily Reading enrichment jobs", 500, "AI_JOB_LOAD_FAILED");
 }
}

export async function DELETE(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const payload: JsonFieldValue = await request.json().catch(() => null);
 const parsed = deleteSchema.safeParse(payload);
 if (!parsed.success) return apiError("Valid runId is required", 400, "INVALID_REQUEST");

 try {
  const jobs = await listDailyReadingEnrichmentJobs({
   userId: auth.context.user.id,
   runId: parsed.data.runId,
  });
  if (jobs.some((job) => job.status === "queued" || job.status === "running")) {
   return apiError("Active Daily Reading jobs cannot be deleted", 409, "AI_JOB_ACTIVE");
  }
  await deleteDailyReadingEnrichmentJobs(auth.context.user.id, parsed.data.runId);
  return new Response(null, { status: 204 });
 } catch (error) {
  if (error instanceof DailyReadingEnrichmentJobStorageError) {
   return apiError(
    "Daily Reading enrichment job storage is not ready",
    503,
    "AI_JOB_SCHEMA_UNAVAILABLE",
   );
  }
  return apiError("Unable to delete Daily Reading enrichment jobs", 500, "AI_JOB_DELETE_FAILED");
 }
}
