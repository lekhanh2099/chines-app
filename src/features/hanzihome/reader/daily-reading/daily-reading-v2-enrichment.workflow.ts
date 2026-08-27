import type { AiRuntimeReceipt } from "@/lib/ai-task-contract";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";
import {
 recordUserAiRuntimeActivity,
 recordUserAiRuntimeReceiptActivity,
 resolveUserAiRuntimeSnapshot,
} from "@/services/ai-runtime.service";

import {
 completeDailyReadingEnrichmentJob,
 markDailyReadingEnrichmentJobRunning,
 updateDailyReadingEnrichmentJobProgress,
} from "./daily-reading-v2-enrichment-jobs.server";
import type {
 DailyReadingV2EnrichmentArticle,
 DailyReadingV2EnrichmentJobModuleRequest,
 DailyReadingV2EnrichmentResponse,
} from "./daily-reading-v2-enrichment.schemas";
import { generateDailyReadingV2Enrichment } from "./daily-reading-v2-enrichment.server";

type DailyReadingEnrichmentWorkflowJob = DailyReadingV2EnrichmentJobModuleRequest & {
 jobId: string;
 receipt: AiRuntimeReceipt;
};

export type DailyReadingEnrichmentWorkflowInput = {
 userId: string;
 reading: DailyReadingV2EnrichmentArticle;
 jobs: DailyReadingEnrichmentWorkflowJob[];
};

function safeRuntimeFailure(
 module: DailyReadingV2EnrichmentJobModuleRequest["module"],
): DailyReadingV2EnrichmentResponse {
 return {
  ok: false,
  status: "failed",
  module,
  errorCode: "provider-unavailable",
  errorDetail: "Nguồn AI đã chọn không còn khả dụng cho job này.",
 };
}

async function processDailyReadingEnrichmentJob(input: {
 userId: string;
 reading: DailyReadingV2EnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
}) {
 "use step";

 const started = await markDailyReadingEnrichmentJobRunning({
  userId: input.userId,
  jobId: input.job.jobId,
  progressTotal: 1,
 });
 if (!started) return;

 const resolution = await resolveUserAiRuntimeSnapshot({
  supabase: createServiceRoleSupabaseClient(),
  userId: input.userId,
  receipt: input.job.receipt,
 });
 const response = resolution.ok
  ? await generateDailyReadingV2Enrichment({
     reading: input.reading,
     runtime: resolution.runtime,
     module: input.job.module,
     targetCount: input.job.targetCount,
     onProgress: (completed, total) =>
      updateDailyReadingEnrichmentJobProgress({
       userId: input.userId,
       jobId: input.job.jobId,
       completed,
       total,
      }),
    })
  : safeRuntimeFailure(input.job.module);

 await completeDailyReadingEnrichmentJob({
  userId: input.userId,
  jobId: input.job.jobId,
  response,
 });
 if (resolution.ok) {
  await recordUserAiRuntimeActivity({
   userId: input.userId,
   runtime: resolution.runtime,
   status: response.ok ? "success" : "failure",
   ...(response.ok ? {} : { errorCode: response.errorCode }),
   resourceType: "daily-reading-article",
   resourceId: input.reading.id,
  });
 } else {
  await recordUserAiRuntimeReceiptActivity({
   userId: input.userId,
   receipt: input.job.receipt,
   status: response.ok ? "success" : "failure",
   ...(response.ok ? {} : { errorCode: response.errorCode }),
   resourceType: "daily-reading-article",
   resourceId: input.reading.id,
  });
 }
}

processDailyReadingEnrichmentJob.maxRetries = 0;

async function markDailyReadingEnrichmentJobUnexpectedFailure(input: {
 userId: string;
 jobId: string;
 module: DailyReadingV2EnrichmentJobModuleRequest["module"];
 receipt: AiRuntimeReceipt;
 articleId: string;
}) {
 "use step";

 await completeDailyReadingEnrichmentJob({
  userId: input.userId,
  jobId: input.jobId,
  response: safeRuntimeFailure(input.module),
 });
 await recordUserAiRuntimeReceiptActivity({
  userId: input.userId,
  receipt: input.receipt,
  status: "failure",
  errorCode: "provider-unavailable",
  resourceType: "daily-reading-article",
  resourceId: input.articleId,
 });
}

markDailyReadingEnrichmentJobUnexpectedFailure.maxRetries = 3;

export async function dailyReadingEnrichmentWorkflow(input: DailyReadingEnrichmentWorkflowInput) {
 "use workflow";

 for (const job of input.jobs) {
  try {
   await processDailyReadingEnrichmentJob({
    userId: input.userId,
    reading: input.reading,
    job,
   });
  } catch {
   await markDailyReadingEnrichmentJobUnexpectedFailure({
    userId: input.userId,
    jobId: job.jobId,
    module: job.module,
    receipt: job.receipt,
    articleId: input.reading.id,
   });
  }
 }
}
