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
import {
 buildDailyReadingV2TranslationResponse,
 createDailyReadingV2TranslationPlan,
 generateDailyReadingV2Enrichment,
 generateDailyReadingV2TranslationGroup,
 generateDailyReadingV2TranslationMetadata,
 type StructuredResult,
 type TranslationParagraph,
 type TranslationUnit,
} from "./daily-reading-v2-enrichment.server";

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

async function prepareDailyReadingTranslationJob(input: {
 userId: string;
 reading: DailyReadingV2EnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
}): Promise<TranslationUnit[][]> {
 "use step";

 const plan = createDailyReadingV2TranslationPlan(input.reading);
 const started = await markDailyReadingEnrichmentJobRunning({
  userId: input.userId,
  jobId: input.job.jobId,
  progressTotal: plan.progressTotal,
 });
 return started ? plan.groups : [];
}

prepareDailyReadingTranslationJob.maxRetries = 0;

async function generateDailyReadingTranslationMetadataStep(input: {
 userId: string;
 reading: DailyReadingV2EnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
}): Promise<Awaited<ReturnType<typeof generateDailyReadingV2TranslationMetadata>>> {
 "use step";

 const resolution = await resolveUserAiRuntimeSnapshot({
  supabase: createServiceRoleSupabaseClient(),
  userId: input.userId,
  receipt: input.job.receipt,
 });
 if (!resolution.ok) {
  return {
   ok: false,
   errorCode: "provider-unavailable",
   errorDetail: "Nguồn AI đã chọn không còn khả dụng cho job này.",
  };
 }
 const result = await generateDailyReadingV2TranslationMetadata({
  reading: input.reading,
  runtime: resolution.runtime,
 });
 if (result.ok) {
  const plan = createDailyReadingV2TranslationPlan(input.reading);
  await updateDailyReadingEnrichmentJobProgress({
   userId: input.userId,
   jobId: input.job.jobId,
   completed: 1,
   total: plan.progressTotal,
  });
 }
 return result;
}

generateDailyReadingTranslationMetadataStep.maxRetries = 0;

async function generateDailyReadingTranslationGroupStep(input: {
 userId: string;
 reading: DailyReadingV2EnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
 units: TranslationUnit[];
 chunkLabel: string;
 completed: number;
 total: number;
}): Promise<Awaited<ReturnType<typeof generateDailyReadingV2TranslationGroup>>> {
 "use step";

 const resolution = await resolveUserAiRuntimeSnapshot({
  supabase: createServiceRoleSupabaseClient(),
  userId: input.userId,
  receipt: input.job.receipt,
 });
 if (!resolution.ok) {
  return {
   ok: false,
   errorCode: "provider-unavailable",
   errorDetail: "Nguồn AI đã chọn không còn khả dụng cho job này.",
  };
 }
 const result = await generateDailyReadingV2TranslationGroup({
  reading: input.reading,
  runtime: resolution.runtime,
  units: input.units,
  chunkLabel: input.chunkLabel,
 });
 if (result.ok) {
  await updateDailyReadingEnrichmentJobProgress({
   userId: input.userId,
   jobId: input.job.jobId,
   completed: input.completed,
   total: input.total,
  });
 }
 return result;
}

generateDailyReadingTranslationGroupStep.maxRetries = 0;

async function completeDailyReadingTranslationSuccess(input: {
 userId: string;
 reading: DailyReadingV2EnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
 metadata: Extract<
  Awaited<ReturnType<typeof generateDailyReadingV2TranslationMetadata>>,
  { ok: true }
 >["data"];
 translatedParagraphs: TranslationParagraph[];
}) {
 "use step";

 const resolution = await resolveUserAiRuntimeSnapshot({
  supabase: createServiceRoleSupabaseClient(),
  userId: input.userId,
  receipt: input.job.receipt,
 });
 const response = resolution.ok
  ? buildDailyReadingV2TranslationResponse({
     reading: input.reading,
     runtime: resolution.runtime,
     metadata: input.metadata,
     translatedParagraphs: input.translatedParagraphs,
    })
  : safeRuntimeFailure("translation");
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
   status: "failure",
   errorCode: "provider-unavailable",
   resourceType: "daily-reading-article",
   resourceId: input.reading.id,
  });
 }
}

completeDailyReadingTranslationSuccess.maxRetries = 0;

async function completeDailyReadingTranslationFailure(input: {
 userId: string;
 reading: DailyReadingV2EnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
 failure: Extract<StructuredResult<never>, { ok: false }>;
}) {
 "use step";

 await completeDailyReadingEnrichmentJob({
  userId: input.userId,
  jobId: input.job.jobId,
  response: {
   ok: false,
   status: "failed",
   module: "translation",
   errorCode: input.failure.errorCode,
   errorDetail: input.failure.errorDetail,
  },
 });
 await recordUserAiRuntimeReceiptActivity({
  userId: input.userId,
  receipt: input.job.receipt,
  status: "failure",
  errorCode: input.failure.errorCode,
  resourceType: "daily-reading-article",
  resourceId: input.reading.id,
 });
}

completeDailyReadingTranslationFailure.maxRetries = 0;

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
  if (job.module === "translation") {
   try {
    const groups = await prepareDailyReadingTranslationJob({
     userId: input.userId,
     reading: input.reading,
     job,
    });
    if (groups.length === 0) continue;

    const metadata = await generateDailyReadingTranslationMetadataStep({
     userId: input.userId,
     reading: input.reading,
     job,
    });
    if (!metadata.ok) {
     await completeDailyReadingTranslationFailure({
      userId: input.userId,
      reading: input.reading,
      job,
      failure: metadata,
     });
     continue;
    }

    const translatedParagraphs: TranslationParagraph[] = [];
    const total = groups.reduce((sum, group) => sum + group.length, 1);
    let completed = 1;
    let failed = false;
    for (let index = 0; index < groups.length; index += 1) {
     const units = groups[index] ?? [];
     completed += units.length;
     const result = await generateDailyReadingTranslationGroupStep({
      userId: input.userId,
      reading: input.reading,
      job,
      units,
      chunkLabel: `${index + 1}/${groups.length}`,
      completed,
      total,
     });
     if (!result.ok) {
      await completeDailyReadingTranslationFailure({
       userId: input.userId,
       reading: input.reading,
       job,
       failure: result,
      });
      failed = true;
      break;
     }
     translatedParagraphs.push(...result.data);
    }
    if (failed) continue;

    await completeDailyReadingTranslationSuccess({
     userId: input.userId,
     reading: input.reading,
     job,
     metadata: metadata.data,
     translatedParagraphs,
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
   continue;
  }
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
