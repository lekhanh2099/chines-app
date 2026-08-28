import { getWritable } from "workflow";

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
} from "./daily-reading-enrichment-jobs.server";
import type { DailyReadingProviderMetrics } from "./daily-reading-enrichment-provider.server";
import {
 dailyReadingTranslationProgressEventSchema,
 type DailyReadingTranslationProgressEvent,
 type DailyReadingEnrichmentArticle,
 type DailyReadingEnrichmentJobModuleRequest,
 type DailyReadingEnrichmentResponse,
} from "./daily-reading-enrichment.schemas";
import {
 buildDailyReadingTranslationResponse,
 createDailyReadingTranslationPlan,
 generateDailyReadingEnrichment,
 generateDailyReadingTranslationGroup,
 generateDailyReadingTranslationMetadata,
 type StructuredResult,
 type TranslationParagraph,
 type TranslationUnit,
} from "./daily-reading-enrichment.server";

export const dailyReadingTranslationProgressStream = "translation-progress";

type DailyReadingEnrichmentWorkflowJob = DailyReadingEnrichmentJobModuleRequest & {
 jobId: string;
 receipt: AiRuntimeReceipt;
};

export type DailyReadingEnrichmentWorkflowInput = {
 userId: string;
 runId: string;
 reading: DailyReadingEnrichmentArticle;
 jobs: DailyReadingEnrichmentWorkflowJob[];
};

function emptyProviderMetrics(): DailyReadingProviderMetrics {
 return { latencyMs: 0, inputTokens: null, outputTokens: null };
}

function addProviderMetrics(
 total: DailyReadingProviderMetrics,
 current: DailyReadingProviderMetrics,
) {
 return {
  latencyMs: total.latencyMs + current.latencyMs,
  inputTokens:
   total.inputTokens === null && current.inputTokens === null
    ? null
    : (total.inputTokens ?? 0) + (current.inputTokens ?? 0),
  outputTokens:
   total.outputTokens === null && current.outputTokens === null
    ? null
    : (total.outputTokens ?? 0) + (current.outputTokens ?? 0),
 };
}

function safeRuntimeFailure(
 module: DailyReadingEnrichmentJobModuleRequest["module"],
): DailyReadingEnrichmentResponse {
 return {
  ok: false,
  status: "failed",
  module,
  errorCode: "provider-unavailable",
  errorDetail: "Nguồn AI đã chọn không còn khả dụng cho job này.",
 };
}

function providerUnavailableStructuredFailure(): Extract<StructuredResult<never>, { ok: false }> {
 return {
  ok: false,
  errorCode: "provider-unavailable",
  errorDetail: "Nguồn AI đã chọn không còn khả dụng cho job này.",
 };
}

async function processDailyReadingEnrichmentJob(input: {
 userId: string;
 reading: DailyReadingEnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
}) {
 "use step";

 const started = await markDailyReadingEnrichmentJobRunning({
  userId: input.userId,
  jobId: input.job.jobId,
  progressTotal: 1,
 });
 if (!started) return;

 const metrics = emptyProviderMetrics();
 const resolution = await resolveUserAiRuntimeSnapshot({
  supabase: createServiceRoleSupabaseClient(),
  userId: input.userId,
  receipt: input.job.receipt,
 });
 const response = resolution.ok
  ? await generateDailyReadingEnrichment({
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
     onMetrics: (current) => {
      const aggregate = addProviderMetrics(metrics, current);
      metrics.latencyMs = aggregate.latencyMs;
      metrics.inputTokens = aggregate.inputTokens;
      metrics.outputTokens = aggregate.outputTokens;
     },
    })
  : safeRuntimeFailure(input.job.module);

 const completed = await completeDailyReadingEnrichmentJob({
  userId: input.userId,
  jobId: input.job.jobId,
  response,
 });
 if (!completed) return;
 if (resolution.ok) {
  await recordUserAiRuntimeActivity({
   userId: input.userId,
   runtime: resolution.runtime,
   status: response.ok ? "success" : "failure",
   ...(response.ok ? {} : { errorCode: response.errorCode }),
   latencyMs: metrics.latencyMs,
   ...(metrics.inputTokens === null ? {} : { inputTokens: metrics.inputTokens }),
   ...(metrics.outputTokens === null ? {} : { outputTokens: metrics.outputTokens }),
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
 reading: DailyReadingEnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
}): Promise<TranslationUnit[][]> {
 "use step";

 const plan = createDailyReadingTranslationPlan(input.reading);
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
 reading: DailyReadingEnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
}): Promise<{
 result: Awaited<ReturnType<typeof generateDailyReadingTranslationMetadata>>;
 metrics: DailyReadingProviderMetrics;
}> {
 "use step";

 let metrics = emptyProviderMetrics();
 const resolution = await resolveUserAiRuntimeSnapshot({
  supabase: createServiceRoleSupabaseClient(),
  userId: input.userId,
  receipt: input.job.receipt,
 });
 if (!resolution.ok) {
  return {
   result: providerUnavailableStructuredFailure(),
   metrics,
  };
 }
 const result = await generateDailyReadingTranslationMetadata({
  reading: input.reading,
  runtime: resolution.runtime,
  onMetrics: (current) => {
   metrics = addProviderMetrics(metrics, current);
  },
 });
 if (result.ok) {
  const plan = createDailyReadingTranslationPlan(input.reading);
  await updateDailyReadingEnrichmentJobProgress({
   userId: input.userId,
   jobId: input.job.jobId,
   completed: 1,
   total: plan.progressTotal,
  });
 }
 return { result, metrics };
}

generateDailyReadingTranslationMetadataStep.maxRetries = 0;

async function generateDailyReadingTranslationGroupStep(input: {
 userId: string;
 reading: DailyReadingEnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
 units: TranslationUnit[];
 chunkLabel: string;
 completed: number;
 total: number;
}): Promise<{
 result: Awaited<ReturnType<typeof generateDailyReadingTranslationGroup>>;
 metrics: DailyReadingProviderMetrics;
}> {
 "use step";

 let metrics = emptyProviderMetrics();
 const resolution = await resolveUserAiRuntimeSnapshot({
  supabase: createServiceRoleSupabaseClient(),
  userId: input.userId,
  receipt: input.job.receipt,
 });
 if (!resolution.ok) {
  return {
   result: providerUnavailableStructuredFailure(),
   metrics,
  };
 }
 const result = await generateDailyReadingTranslationGroup({
  reading: input.reading,
  runtime: resolution.runtime,
  units: input.units,
  chunkLabel: input.chunkLabel,
  onMetrics: (current) => {
   metrics = addProviderMetrics(metrics, current);
  },
 });
 if (result.ok) {
  await updateDailyReadingEnrichmentJobProgress({
   userId: input.userId,
   jobId: input.job.jobId,
   completed: input.completed,
   total: input.total,
  });
 }
 return { result, metrics };
}

generateDailyReadingTranslationGroupStep.maxRetries = 0;

async function emitDailyReadingTranslationProgressStep(
 event: DailyReadingTranslationProgressEvent,
) {
 "use step";

 const parsed = dailyReadingTranslationProgressEventSchema.parse(event);
 const writer = getWritable<Uint8Array>({
  namespace: dailyReadingTranslationProgressStream,
 }).getWriter();
 await writer.write(new TextEncoder().encode(`${JSON.stringify(parsed)}\n`));
 writer.releaseLock();
}

emitDailyReadingTranslationProgressStep.maxRetries = 3;

async function closeDailyReadingTranslationProgressStep() {
 "use step";

 const writer = getWritable<Uint8Array>({
  namespace: dailyReadingTranslationProgressStream,
 }).getWriter();
 await writer.close();
 writer.releaseLock();
}

closeDailyReadingTranslationProgressStep.maxRetries = 3;

async function completeDailyReadingTranslationSuccess(input: {
 userId: string;
 reading: DailyReadingEnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
 metadata: Extract<
  Awaited<ReturnType<typeof generateDailyReadingTranslationMetadata>>,
  { ok: true }
 >["data"];
 translatedParagraphs: TranslationParagraph[];
 metrics: DailyReadingProviderMetrics;
}) {
 "use step";

 const resolution = await resolveUserAiRuntimeSnapshot({
  supabase: createServiceRoleSupabaseClient(),
  userId: input.userId,
  receipt: input.job.receipt,
 });
 const response = resolution.ok
  ? buildDailyReadingTranslationResponse({
     reading: input.reading,
     runtime: resolution.runtime,
     metadata: input.metadata,
     translatedParagraphs: input.translatedParagraphs,
    })
  : safeRuntimeFailure("translation");
 const completed = await completeDailyReadingEnrichmentJob({
  userId: input.userId,
  jobId: input.job.jobId,
  response,
 });
 if (!completed) return;
 if (resolution.ok) {
  await recordUserAiRuntimeActivity({
   userId: input.userId,
   runtime: resolution.runtime,
   status: response.ok ? "success" : "failure",
   ...(response.ok ? {} : { errorCode: response.errorCode }),
   latencyMs: input.metrics.latencyMs,
   ...(input.metrics.inputTokens === null ? {} : { inputTokens: input.metrics.inputTokens }),
   ...(input.metrics.outputTokens === null ? {} : { outputTokens: input.metrics.outputTokens }),
   resourceType: "daily-reading-article",
   resourceId: input.reading.id,
  });
 } else {
  await recordUserAiRuntimeReceiptActivity({
   userId: input.userId,
   receipt: input.job.receipt,
   status: "failure",
   errorCode: "provider-unavailable",
   latencyMs: input.metrics.latencyMs,
   ...(input.metrics.inputTokens === null ? {} : { inputTokens: input.metrics.inputTokens }),
   ...(input.metrics.outputTokens === null ? {} : { outputTokens: input.metrics.outputTokens }),
   resourceType: "daily-reading-article",
   resourceId: input.reading.id,
  });
 }
}

completeDailyReadingTranslationSuccess.maxRetries = 0;

async function completeDailyReadingTranslationFailure(input: {
 userId: string;
 reading: DailyReadingEnrichmentArticle;
 job: DailyReadingEnrichmentWorkflowJob;
 failure: Extract<StructuredResult<never>, { ok: false }>;
 metrics: DailyReadingProviderMetrics;
}) {
 "use step";

 const completed = await completeDailyReadingEnrichmentJob({
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
 if (!completed) return;
 await recordUserAiRuntimeReceiptActivity({
  userId: input.userId,
  receipt: input.job.receipt,
  status: "failure",
  errorCode: input.failure.errorCode,
  latencyMs: input.metrics.latencyMs,
  ...(input.metrics.inputTokens === null ? {} : { inputTokens: input.metrics.inputTokens }),
  ...(input.metrics.outputTokens === null ? {} : { outputTokens: input.metrics.outputTokens }),
  resourceType: "daily-reading-article",
  resourceId: input.reading.id,
 });
}

completeDailyReadingTranslationFailure.maxRetries = 0;

async function markDailyReadingEnrichmentJobUnexpectedFailure(input: {
 userId: string;
 jobId: string;
 module: DailyReadingEnrichmentJobModuleRequest["module"];
 receipt: AiRuntimeReceipt;
 articleId: string;
}) {
 "use step";

 const completed = await completeDailyReadingEnrichmentJob({
  userId: input.userId,
  jobId: input.jobId,
  response: safeRuntimeFailure(input.module),
 });
 if (!completed) return;
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

function completedSourceParagraphs(input: {
 reading: DailyReadingEnrichmentArticle;
 groups: TranslationUnit[][];
 translatedParagraphs: TranslationParagraph[];
 emittedParagraphIds: string[];
}) {
 const units = input.groups.flat();
 return input.reading.article.paragraphs.flatMap((sourceParagraph) => {
  if (input.emittedParagraphIds.includes(sourceParagraph.id)) return [];
  const matchingUnits = units.filter((unit) => unit.sourceParagraphId === sourceParagraph.id);
  if (matchingUnits.length === 0) return [];
  const translatedUnits: TranslationParagraph[] = [];
  for (const unit of matchingUnits) {
   const translated = input.translatedParagraphs.find(
    (paragraph) => paragraph.paragraphId === unit.paragraphId,
   );
   if (translated === undefined) return [];
   translatedUnits.push(translated);
  }
  return [
   {
    paragraphId: sourceParagraph.id,
    vi: translatedUnits.map((paragraph) => paragraph.vi).join(" "),
    roleVi: translatedUnits.map((paragraph) => paragraph.roleVi).find(Boolean) ?? "",
   },
  ];
 });
}

export async function dailyReadingEnrichmentWorkflow(input: DailyReadingEnrichmentWorkflowInput) {
 "use workflow";

 for (const job of input.jobs) {
  if (job.module === "translation") {
   let metrics = emptyProviderMetrics();
   try {
    const groups = await prepareDailyReadingTranslationJob({
     userId: input.userId,
     reading: input.reading,
     job,
    });
    if (groups.length === 0) continue;

    const metadataStep = await generateDailyReadingTranslationMetadataStep({
     userId: input.userId,
     reading: input.reading,
     job,
    });
    metrics = addProviderMetrics(metrics, metadataStep.metrics);
    if (!metadataStep.result.ok) {
     await completeDailyReadingTranslationFailure({
      userId: input.userId,
      reading: input.reading,
      job,
      failure: metadataStep.result,
      metrics,
     });
     await closeDailyReadingTranslationProgressStep();
     continue;
    }

    const translatedParagraphs: TranslationParagraph[] = [];
    const emittedParagraphIds: string[] = [];
    const total = groups.reduce((sum, group) => sum + group.length, 1);
    let completed = 1;
    let failed = false;
    for (let index = 0; index < groups.length; index += 1) {
     const units = groups[index] ?? [];
     completed += units.length;
     const groupStep = await generateDailyReadingTranslationGroupStep({
      userId: input.userId,
      reading: input.reading,
      job,
      units,
      chunkLabel: `${index + 1}/${groups.length}`,
      completed,
      total,
     });
     metrics = addProviderMetrics(metrics, groupStep.metrics);
     if (!groupStep.result.ok) {
      await completeDailyReadingTranslationFailure({
       userId: input.userId,
       reading: input.reading,
       job,
       failure: groupStep.result,
       metrics,
      });
      await closeDailyReadingTranslationProgressStep();
      failed = true;
      break;
     }
     translatedParagraphs.push(...groupStep.result.data);
     const paragraphs = completedSourceParagraphs({
      reading: input.reading,
      groups,
      translatedParagraphs,
      emittedParagraphIds,
     });
     if (paragraphs.length > 0) {
      emittedParagraphIds.push(...paragraphs.map((paragraph) => paragraph.paragraphId));
      await emitDailyReadingTranslationProgressStep({
       jobId: job.jobId,
       runId: input.runId,
       articleId: input.reading.id,
       articleFingerprint: input.reading.article.fingerprint,
       progressCompleted: emittedParagraphIds.length,
       progressTotal: input.reading.article.paragraphs.length,
       paragraphs,
      });
     }
    }
    if (failed) continue;

    await completeDailyReadingTranslationSuccess({
     userId: input.userId,
     reading: input.reading,
     job,
     metadata: metadataStep.result.data,
     translatedParagraphs,
     metrics,
    });
    await closeDailyReadingTranslationProgressStep();
   } catch {
    await markDailyReadingEnrichmentJobUnexpectedFailure({
     userId: input.userId,
     jobId: job.jobId,
     module: job.module,
     receipt: job.receipt,
     articleId: input.reading.id,
    });
    await closeDailyReadingTranslationProgressStep();
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
