"use client";

import {
 dailyReadingEnrichmentJobsQueryResponseSchema,
 dailyReadingEnrichmentJobsResponseSchema,
 type DailyReadingEnrichmentArticle,
 type DailyReadingEnrichmentJob,
 type DailyReadingEnrichmentJobModuleRequest,
 type DailyReadingEnrichmentResponse,
} from "@/features/daily-reading/daily-reading-enrichment.schemas";
import type {
 DailyReading,
 DailyReadingEnrichmentModule,
 DailyReadingEnrichmentRun,
} from "@/features/daily-reading/daily-reading.schemas";
import {
 getDailyReadingSnapshot,
 getDailyReadingSettingsSnapshot,
 saveDailyReadingEnrichmentRun,
 updateDailyReadingEnrichment,
 type DailyReadingEnrichmentStateUpdate,
} from "@/features/daily-reading/daily-reading-storage.client";
import {
 DailyReadingGenerationBusyError,
 withDailyReadingGenerationLock,
} from "@/features/daily-reading/daily-reading-lock.client";

const enrichmentJobsEndpoint = "/api/daily-reading/enrichment-jobs";

export class DailyReadingEnrichmentClientError extends Error {
 constructor(
  readonly code: string,
  message: string,
 ) {
  super(message);
  this.name = "DailyReadingEnrichmentClientError";
 }
}

function runningUpdate(
 module: DailyReadingEnrichmentModule,
 startedAt: string,
): DailyReadingEnrichmentStateUpdate {
 switch (module) {
  case "translation":
   return { module, state: { status: "running", startedAt } };
  case "vocabulary":
   return { module, state: { status: "running", startedAt } };
  case "grammar":
   return { module, state: { status: "running", startedAt } };
  case "questions":
   return { module, state: { status: "running", startedAt } };
 }
}

function readyUpdate(
 result: Extract<DailyReadingEnrichmentResponse, { ok: true }>,
 updatedAt: string,
): DailyReadingEnrichmentStateUpdate {
 switch (result.module) {
  case "translation":
   return {
    module: result.module,
    state: { status: "ready", data: result.data, updatedAt, generatedBy: result.generatedBy },
   };
  case "vocabulary":
   return {
    module: result.module,
    state: { status: "ready", data: result.data, updatedAt, generatedBy: result.generatedBy },
   };
  case "grammar":
   return {
    module: result.module,
    state: { status: "ready", data: result.data, updatedAt, generatedBy: result.generatedBy },
   };
  case "questions":
   return {
    module: result.module,
    state: { status: "ready", data: result.data, updatedAt, generatedBy: result.generatedBy },
   };
 }
}

function blockedStateUpdate(
 module: DailyReadingEnrichmentModule,
 reason: Extract<DailyReading["enrichment"]["translation"], { status: "blocked" }>["reason"],
): DailyReadingEnrichmentStateUpdate {
 switch (module) {
  case "translation":
   return { module, state: { status: "blocked", reason } };
  case "vocabulary":
   return { module, state: { status: "blocked", reason } };
  case "grammar":
   return { module, state: { status: "blocked", reason } };
  case "questions":
   return { module, state: { status: "blocked", reason } };
 }
}

function failedUpdate(
 module: DailyReadingEnrichmentModule,
 errorCode: string,
 updatedAt: string,
): DailyReadingEnrichmentStateUpdate {
 switch (module) {
  case "translation":
   return { module, state: { status: "failed", errorCode, updatedAt } };
  case "vocabulary":
   return { module, state: { status: "failed", errorCode, updatedAt } };
  case "grammar":
   return { module, state: { status: "failed", errorCode, updatedAt } };
  case "questions":
   return { module, state: { status: "failed", errorCode, updatedAt } };
 }
}

function currentArticle(articleId: string) {
 return getDailyReadingSnapshot().items.find((item) => item.id === articleId) ?? null;
}

function enrichmentEvidence(reading: DailyReading): DailyReadingEnrichmentArticle {
 return {
  id: reading.id,
  source: reading.source,
  article: reading.article,
  classification: reading.classification,
 };
}

function moduleTargetCount(module: DailyReadingEnrichmentModule) {
 const settings = getDailyReadingSettingsSnapshot();
 if (module === "translation") return null;
 if (module === "vocabulary") return settings.vocabularyCount;
 if (module === "grammar") return settings.grammarCount;
 return settings.questionsCount;
}

function moduleRequest(
 module: DailyReadingEnrichmentModule,
): DailyReadingEnrichmentJobModuleRequest {
 switch (module) {
  case "translation":
   return { module, targetCount: null };
  case "vocabulary":
   return { module, targetCount: moduleTargetCount(module) ?? 12 };
  case "grammar":
   return { module, targetCount: moduleTargetCount(module) ?? 4 };
  case "questions":
   return { module, targetCount: moduleTargetCount(module) ?? 6 };
 }
}

function moduleEnabled(module: DailyReadingEnrichmentModule) {
 const settings = getDailyReadingSettingsSnapshot();
 if (module === "translation") return settings.translationEnabled;
 if (module === "vocabulary") return settings.vocabularyEnabled;
 if (module === "grammar") return settings.grammarEnabled;
 return settings.questionsEnabled;
}

async function enqueueRequest(input: {
 runId: string;
 reading: DailyReading;
 modules: readonly DailyReadingEnrichmentJobModuleRequest[];
 regenerate: boolean;
}) {
 const response = await fetch(enrichmentJobsEndpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  credentials: "include",
  cache: "no-store",
  body: JSON.stringify({
   runId: input.runId,
   regenerate: input.regenerate,
   reading: enrichmentEvidence(input.reading),
   modules: input.modules,
  }),
 });
 const payload = await response.json().catch(() => null);
 const parsed = dailyReadingEnrichmentJobsResponseSchema.safeParse(payload);
 if (!response.ok || !parsed.success) {
  throw new DailyReadingEnrichmentClientError(
   response.status === 401 ? "unauthorized" : "enqueue-failed",
   response.status === 401
    ? "Cần đăng nhập trước khi tạo hỗ trợ Daily Reading."
    : "Không thể đưa hỗ trợ Daily Reading vào hàng đợi.",
  );
 }
 return parsed.data;
}

function localRunFromJob(job: DailyReadingEnrichmentJob): DailyReadingEnrichmentRun {
 return {
  id: job.id,
  runId: job.runId,
  articleId: job.articleId,
  articleFingerprint: job.articleFingerprint,
  module: job.module,
  status:
   job.status === "queued" || job.status === "running"
    ? "pending"
    : job.status === "succeeded"
      ? "succeeded"
      : job.status,
  attemptedAt: job.createdAt,
  startedAt: job.startedAt ?? "",
  completedAt: job.completedAt ?? "",
  errorCode: job.errorCode ?? "",
  errorDetail: "",
  workflowRunId: job.workflowRunId ?? "",
  progressCompleted: job.progress.completed,
  progressTotal: job.progress.total,
  receipt: job.receipt,
  reused: job.reused,
 };
}

function saveProvisionalRuns(input: {
 runId: string;
 reading: DailyReading;
 modules: readonly DailyReadingEnrichmentJobModuleRequest[];
 attemptedAt: string;
}) {
 for (const requestedModule of input.modules) {
  saveDailyReadingEnrichmentRun({
   id: `${input.runId}:${requestedModule.module}`,
   runId: input.runId,
   articleId: input.reading.id,
   articleFingerprint: input.reading.article.fingerprint,
   module: requestedModule.module,
   status: "pending",
   attemptedAt: input.attemptedAt,
   startedAt: "",
   completedAt: "",
   errorCode: "",
   errorDetail: "",
   workflowRunId: "",
   progressCompleted: 0,
   progressTotal: 1,
   receipt: null,
   reused: false,
  });
 }
}

function applyJob(job: DailyReadingEnrichmentJob) {
 saveDailyReadingEnrichmentRun(localRunFromJob(job));
 const article = currentArticle(job.articleId);
 if (!article || article.article.fingerprint !== job.articleFingerprint) return;
 const updatedAt = job.completedAt ?? new Date().toISOString();
 if (job.status === "queued" || job.status === "running") {
  const state = article.enrichment[job.module];
  if (state.status !== "running") {
   updateDailyReadingEnrichment(
    job.articleId,
    runningUpdate(job.module, job.startedAt ?? job.createdAt),
   );
  }
  return;
 }
 if (job.status === "succeeded" && job.result?.ok && job.result.module === job.module) {
  updateDailyReadingEnrichment(job.articleId, readyUpdate(job.result, updatedAt));
  return;
 }
 if (job.status === "blocked") {
  if (job.errorCode === "task-disabled" || job.errorCode === "missing-ai-key") {
   updateDailyReadingEnrichment(job.articleId, blockedStateUpdate(job.module, job.errorCode));
   return;
  }
 }
 updateDailyReadingEnrichment(
  job.articleId,
  failedUpdate(job.module, job.errorCode ?? "provider-unavailable", updatedAt),
 );
}

async function enqueueModules(
 articleId: string,
 modules: readonly DailyReadingEnrichmentModule[],
 regenerate: boolean,
) {
 const reading = currentArticle(articleId);
 if (!reading) {
  throw new DailyReadingEnrichmentClientError(
   "article-not-found",
   "Không tìm thấy bài Daily Reading cần tạo hỗ trợ học tập.",
  );
 }
 const attemptedAt = new Date().toISOString();
 const runId = crypto.randomUUID();
 const requests = modules.map(moduleRequest);
 for (const requestedModule of modules) {
  updateDailyReadingEnrichment(articleId, runningUpdate(requestedModule, attemptedAt));
 }
 saveProvisionalRuns({ runId, reading, modules: requests, attemptedAt });

 try {
  const response = await enqueueRequest({ runId, reading, modules: requests, regenerate });
  for (const job of response.jobs) applyJob(job);
 } catch (error) {
  throw error instanceof DailyReadingEnrichmentClientError
   ? error
   : new DailyReadingEnrichmentClientError(
      "network-error",
      "Chưa xác nhận được job trên server. Ứng dụng sẽ tự kiểm tra lại.",
     );
 }
 return currentArticle(articleId) ?? reading;
}

export async function enrichDailyReadingModule(
 articleId: string,
 module: DailyReadingEnrichmentModule,
): Promise<DailyReading> {
 if (navigator.onLine === false) {
  const article = currentArticle(articleId);
  if (!article) {
   throw new DailyReadingEnrichmentClientError("article-not-found", "Không tìm thấy bài.");
  }
  return updateDailyReadingEnrichment(
   articleId,
   failedUpdate(module, "network-error", new Date().toISOString()),
  );
 }
 try {
  return await withDailyReadingGenerationLock(() => enqueueModules(articleId, [module], true));
 } catch (error) {
  if (error instanceof DailyReadingGenerationBusyError) {
   throw new DailyReadingEnrichmentClientError("generation-busy", error.message);
  }
  throw error;
 }
}

export async function enrichDailyReadingLearningSupport(articleId: string) {
 const article = currentArticle(articleId);
 if (!article) {
  throw new DailyReadingEnrichmentClientError(
   "article-not-found",
   "Không tìm thấy bài Daily Reading cần tạo hỗ trợ học tập.",
  );
 }
 const orderedModules: readonly DailyReadingEnrichmentModule[] = [
  "translation",
  "vocabulary",
  "grammar",
  "questions",
 ];
 const modules = orderedModules.filter((module) => {
  const state = article.enrichment[module];
  return moduleEnabled(module) && state.status !== "ready" && state.status !== "running";
 });
 if (modules.length === 0) return article;
 return withDailyReadingGenerationLock(() => enqueueModules(articleId, modules, false));
}

export async function reconcilePendingDailyReadingEnrichmentJobs() {
 const snapshot = getDailyReadingSnapshot();
 const runIds = [
  ...new Set(
   snapshot.enrichmentRuns.filter((run) => run.status === "pending").map((run) => run.runId),
  ),
 ];

 for (const runId of runIds) {
  const response = await fetch(`${enrichmentJobsEndpoint}?runId=${encodeURIComponent(runId)}`, {
   method: "GET",
   headers: { Accept: "application/json" },
   credentials: "include",
   cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  const parsed = dailyReadingEnrichmentJobsQueryResponseSchema.safeParse(payload);
  if (!response.ok || !parsed.success) continue;

  if (parsed.data.jobs.length === 0) {
   const pendingRuns = snapshot.enrichmentRuns.filter(
    (run) => run.runId === runId && run.status === "pending",
   );
   const first = pendingRuns[0];
   const article = first ? currentArticle(first.articleId) : null;
   if (!first || !article || article.article.fingerprint !== first.articleFingerprint) continue;
   try {
    const retry = await enqueueRequest({
     runId,
     reading: article,
     modules: pendingRuns.map((run) => moduleRequest(run.module)),
     regenerate: false,
    });
    for (const job of retry.jobs) applyJob(job);
   } catch {
    // The scheduler will retry the same idempotent run on the next visible tick.
   }
   continue;
  }
  for (const job of parsed.data.jobs) applyJob(job);
 }
}
