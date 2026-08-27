"use client";

import {
 dailyReadingV2EnrichmentJobsQueryResponseSchema,
 dailyReadingV2EnrichmentJobsResponseSchema,
 type DailyReadingV2EnrichmentArticle,
 type DailyReadingV2EnrichmentJob,
 type DailyReadingV2EnrichmentJobModuleRequest,
 type DailyReadingV2EnrichmentResponse,
} from "./daily-reading-v2-enrichment.schemas";
import type {
 DailyReadingV2,
 DailyReadingV2EnrichmentModule,
 DailyReadingV2EnrichmentRun,
} from "./daily-reading-v2.schemas";
import {
 getDailyReadingV2Snapshot,
 getDailyReadingV2SettingsSnapshot,
 saveDailyReadingV2EnrichmentRun,
 updateDailyReadingV2Enrichment,
 type DailyReadingV2EnrichmentStateUpdate,
} from "./daily-reading-v2-storage.client";
import {
 DailyReadingGenerationBusyError,
 withDailyReadingGenerationLock,
} from "./daily-reading-lock.client";

const enrichmentJobsEndpoint = "/api/hanzihome/reader/daily-reading/enrichment-jobs";

export class DailyReadingV2EnrichmentClientError extends Error {
 constructor(
  readonly code: string,
  message: string,
 ) {
  super(message);
  this.name = "DailyReadingV2EnrichmentClientError";
 }
}

function runningUpdate(
 module: DailyReadingV2EnrichmentModule,
 startedAt: string,
): DailyReadingV2EnrichmentStateUpdate {
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
 result: Extract<DailyReadingV2EnrichmentResponse, { ok: true }>,
 updatedAt: string,
): DailyReadingV2EnrichmentStateUpdate {
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
 module: DailyReadingV2EnrichmentModule,
 reason: Extract<DailyReadingV2["enrichment"]["translation"], { status: "blocked" }>["reason"],
): DailyReadingV2EnrichmentStateUpdate {
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
 module: DailyReadingV2EnrichmentModule,
 errorCode: string,
 updatedAt: string,
): DailyReadingV2EnrichmentStateUpdate {
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
 return getDailyReadingV2Snapshot().items.find((item) => item.id === articleId) ?? null;
}

function enrichmentEvidence(reading: DailyReadingV2): DailyReadingV2EnrichmentArticle {
 return {
  id: reading.id,
  source: reading.source,
  article: reading.article,
  classification: reading.classification,
 };
}

function moduleTargetCount(module: DailyReadingV2EnrichmentModule) {
 const settings = getDailyReadingV2SettingsSnapshot();
 if (module === "translation") return null;
 if (module === "vocabulary") return settings.vocabularyCount;
 if (module === "grammar") return settings.grammarCount;
 return settings.questionsCount;
}

function moduleRequest(
 module: DailyReadingV2EnrichmentModule,
): DailyReadingV2EnrichmentJobModuleRequest {
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

function moduleEnabled(module: DailyReadingV2EnrichmentModule) {
 const settings = getDailyReadingV2SettingsSnapshot();
 if (module === "translation") return settings.translationEnabled;
 if (module === "vocabulary") return settings.vocabularyEnabled;
 if (module === "grammar") return settings.grammarEnabled;
 return settings.questionsEnabled;
}

async function enqueueRequest(input: {
 runId: string;
 reading: DailyReadingV2;
 modules: readonly DailyReadingV2EnrichmentJobModuleRequest[];
}) {
 const response = await fetch(enrichmentJobsEndpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  credentials: "include",
  cache: "no-store",
  body: JSON.stringify({
   runId: input.runId,
   reading: enrichmentEvidence(input.reading),
   modules: input.modules,
  }),
 });
 const payload = await response.json().catch(() => null);
 const parsed = dailyReadingV2EnrichmentJobsResponseSchema.safeParse(payload);
 if (!response.ok || !parsed.success) {
  throw new DailyReadingV2EnrichmentClientError(
   response.status === 401 ? "unauthorized" : "enqueue-failed",
   response.status === 401
    ? "Cần đăng nhập trước khi tạo hỗ trợ Daily Reading."
    : "Không thể đưa hỗ trợ Daily Reading vào hàng đợi.",
  );
 }
 return parsed.data;
}

function localRunFromJob(job: DailyReadingV2EnrichmentJob): DailyReadingV2EnrichmentRun {
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
  attemptedAt: job.startedAt ?? job.createdAt,
  completedAt: job.completedAt ?? "",
  errorCode: job.errorCode ?? "",
  errorDetail: "",
  workflowRunId: job.workflowRunId ?? "",
  progressCompleted: job.progress.completed,
  progressTotal: job.progress.total,
  receipt: job.receipt,
 };
}

function saveProvisionalRuns(input: {
 runId: string;
 reading: DailyReadingV2;
 modules: readonly DailyReadingV2EnrichmentJobModuleRequest[];
 attemptedAt: string;
}) {
 for (const requestedModule of input.modules) {
  saveDailyReadingV2EnrichmentRun({
   id: `${input.runId}:${requestedModule.module}`,
   runId: input.runId,
   articleId: input.reading.id,
   articleFingerprint: input.reading.article.fingerprint,
   module: requestedModule.module,
   status: "pending",
   attemptedAt: input.attemptedAt,
   completedAt: "",
   errorCode: "",
   errorDetail: "",
   workflowRunId: "",
   progressCompleted: 0,
   progressTotal: 1,
   receipt: null,
  });
 }
}

function applyJob(job: DailyReadingV2EnrichmentJob) {
 saveDailyReadingV2EnrichmentRun(localRunFromJob(job));
 const article = currentArticle(job.articleId);
 if (!article || article.article.fingerprint !== job.articleFingerprint) return;
 const updatedAt = job.completedAt ?? new Date().toISOString();
 if (job.status === "queued" || job.status === "running") {
  const state = article.enrichment[job.module];
  if (state.status !== "running") {
   updateDailyReadingV2Enrichment(
    job.articleId,
    runningUpdate(job.module, job.startedAt ?? job.createdAt),
   );
  }
  return;
 }
 if (job.status === "succeeded" && job.result?.ok && job.result.module === job.module) {
  updateDailyReadingV2Enrichment(job.articleId, readyUpdate(job.result, updatedAt));
  return;
 }
 if (job.status === "blocked") {
  if (job.errorCode === "task-disabled" || job.errorCode === "missing-ai-key") {
   updateDailyReadingV2Enrichment(job.articleId, blockedStateUpdate(job.module, job.errorCode));
   return;
  }
 }
 updateDailyReadingV2Enrichment(
  job.articleId,
  failedUpdate(job.module, job.errorCode ?? "provider-unavailable", updatedAt),
 );
}

async function enqueueModules(
 articleId: string,
 modules: readonly DailyReadingV2EnrichmentModule[],
) {
 const reading = currentArticle(articleId);
 if (!reading) {
  throw new DailyReadingV2EnrichmentClientError(
   "article-not-found",
   "Không tìm thấy bài Daily Reading cần tạo hỗ trợ học tập.",
  );
 }
 const attemptedAt = new Date().toISOString();
 const runId = crypto.randomUUID();
 const requests = modules.map(moduleRequest);
 for (const requestedModule of modules) {
  updateDailyReadingV2Enrichment(articleId, runningUpdate(requestedModule, attemptedAt));
 }
 saveProvisionalRuns({ runId, reading, modules: requests, attemptedAt });

 try {
  const response = await enqueueRequest({ runId, reading, modules: requests });
  for (const job of response.jobs) applyJob(job);
 } catch (error) {
  throw error instanceof DailyReadingV2EnrichmentClientError
   ? error
   : new DailyReadingV2EnrichmentClientError(
      "network-error",
      "Chưa xác nhận được job trên server. Ứng dụng sẽ tự kiểm tra lại.",
     );
 }
 return currentArticle(articleId) ?? reading;
}

export async function enrichDailyReadingV2Module(
 articleId: string,
 module: DailyReadingV2EnrichmentModule,
): Promise<DailyReadingV2> {
 if (navigator.onLine === false) {
  const article = currentArticle(articleId);
  if (!article) {
   throw new DailyReadingV2EnrichmentClientError("article-not-found", "Không tìm thấy bài.");
  }
  return updateDailyReadingV2Enrichment(
   articleId,
   failedUpdate(module, "network-error", new Date().toISOString()),
  );
 }
 try {
  return await withDailyReadingGenerationLock(() => enqueueModules(articleId, [module]));
 } catch (error) {
  if (error instanceof DailyReadingGenerationBusyError) {
   throw new DailyReadingV2EnrichmentClientError("generation-busy", error.message);
  }
  throw error;
 }
}

export async function enrichDailyReadingV2LearningSupport(articleId: string) {
 const article = currentArticle(articleId);
 if (!article) {
  throw new DailyReadingV2EnrichmentClientError(
   "article-not-found",
   "Không tìm thấy bài Daily Reading cần tạo hỗ trợ học tập.",
  );
 }
 const orderedModules: readonly DailyReadingV2EnrichmentModule[] = [
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
 return withDailyReadingGenerationLock(() => enqueueModules(articleId, modules));
}

export async function reconcilePendingDailyReadingV2EnrichmentJobs() {
 const snapshot = getDailyReadingV2Snapshot();
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
  const parsed = dailyReadingV2EnrichmentJobsQueryResponseSchema.safeParse(payload);
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
