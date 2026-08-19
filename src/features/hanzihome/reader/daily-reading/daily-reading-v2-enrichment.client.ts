"use client";

import {
 dailyReadingV2EnrichmentResponseSchema,
 type DailyReadingV2EnrichmentArticle,
 type DailyReadingV2EnrichmentResponse,
} from "./daily-reading-v2-enrichment.schemas";
import type {
 DailyReadingV2,
 DailyReadingV2EnrichmentModule,
} from "./daily-reading-v2.schemas";
import {
 getDailyReadingV2Snapshot,
 markDailyReadingV2EnrichmentRunInterrupted,
 saveDailyReadingV2EnrichmentRun,
 updateDailyReadingV2Enrichment,
 type DailyReadingV2EnrichmentStateUpdate,
} from "./daily-reading-v2-storage.client";
import {
 DailyReadingGenerationBusyError,
 withDailyReadingGenerationLock,
} from "./daily-reading-lock.client";

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
 reason: Extract<
  DailyReadingV2["enrichment"]["translation"],
  { status: "blocked" }
 >["reason"],
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

function blockedUpdate(
 result: Extract<DailyReadingV2EnrichmentResponse, { ok: false; status: "blocked" }>,
) {
 return blockedStateUpdate(result.module, result.reason);
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

async function decodeResponse(response: Response) {
 const payload = await response.json().catch(() => null);
 const parsed = dailyReadingV2EnrichmentResponseSchema.safeParse(payload);
 if (!parsed.success) {
  throw new DailyReadingV2EnrichmentClientError(
   response.status === 401 ? "unauthorized" : "invalid-response",
   response.status === 401
    ? "Cần đăng nhập trước khi tạo hỗ trợ Daily Reading."
    : "Server trả dữ liệu hỗ trợ Daily Reading không đúng contract.",
  );
 }
 return parsed.data;
}

export async function enrichDailyReadingV2Module(
 articleId: string,
 module: DailyReadingV2EnrichmentModule,
): Promise<DailyReadingV2> {
 const source = currentArticle(articleId);
 if (source === null) {
  throw new DailyReadingV2EnrichmentClientError(
   "article-not-found",
   "Không tìm thấy bài Daily Reading cần tạo hỗ trợ học tập.",
  );
 }
 if (navigator.onLine === false) {
  const updatedAt = new Date().toISOString();
  return updateDailyReadingV2Enrichment(
   source.id,
   failedUpdate(module, "network-error", updatedAt),
  );
 }

 try {
  return await withDailyReadingGenerationLock(async () => {
   const fresh = currentArticle(articleId);
   if (fresh === null) {
    throw new DailyReadingV2EnrichmentClientError(
     "article-not-found",
     "Bài Daily Reading đã không còn trong thư viện.",
    );
   }

   const attemptedAt = new Date().toISOString();
   const runId = `daily-enrichment:${module}:${articleId}:${crypto.randomUUID()}`;
   updateDailyReadingV2Enrichment(articleId, runningUpdate(module, attemptedAt));
   try {
    saveDailyReadingV2EnrichmentRun({
     id: runId,
     articleId,
     module,
     status: "pending",
     attemptedAt,
     completedAt: "",
     errorCode: "",
     errorDetail: "",
    });
   } catch {
    // Run history is diagnostics only. The module state remains the durable task owner.
   }

   const controller = new AbortController();
   const timeout = window.setTimeout(() => controller.abort(), 170_000);
   const interrupt = () => {
    controller.abort();
    try {
     markDailyReadingV2EnrichmentRunInterrupted(runId);
    } catch {
     // Browser shutdown recovery is best-effort; the article itself remains durable.
    }
   };
   window.addEventListener("pagehide", interrupt, { once: true });

   try {
    const response = await fetch("/api/hanzihome/reader/daily-reading/enrich", {
     method: "POST",
     headers: { "Content-Type": "application/json", Accept: "application/json" },
     credentials: "include",
     cache: "no-store",
     signal: controller.signal,
     body: JSON.stringify({ module, reading: enrichmentEvidence(fresh) }),
    });
    const result = await decodeResponse(response);
    if (result.module !== module) {
     throw new DailyReadingV2EnrichmentClientError(
      "invalid-response",
      "Server trả kết quả cho sai module Daily Reading.",
     );
    }

    const completedAt = new Date().toISOString();
    if (result.ok) {
     const updated = updateDailyReadingV2Enrichment(
      articleId,
      readyUpdate(result, completedAt),
     );
     try {
      saveDailyReadingV2EnrichmentRun({
       id: runId,
       articleId,
       module,
       status: "succeeded",
       attemptedAt,
       completedAt,
       errorCode: "",
       errorDetail: "",
      });
     } catch {
      // Ready module data is already durable; telemetry cannot roll it back.
     }
     return updated;
    }

    const updated =
     result.status === "blocked"
      ? updateDailyReadingV2Enrichment(articleId, blockedUpdate(result))
      : updateDailyReadingV2Enrichment(
         articleId,
         failedUpdate(module, result.errorCode, completedAt),
        );
    try {
     saveDailyReadingV2EnrichmentRun({
      id: runId,
      articleId,
      module,
      status: result.status,
      attemptedAt,
      completedAt,
      errorCode: result.errorCode,
      errorDetail: result.errorDetail,
     });
    } catch {
     // Module state is authoritative even when history cannot be written.
    }
    return updated;
   } catch (error) {
    const completedAt = new Date().toISOString();
    const resolved =
     error instanceof DailyReadingV2EnrichmentClientError
      ? error
      : error instanceof DOMException && error.name === "AbortError"
        ? new DailyReadingV2EnrichmentClientError(
           "cancelled",
           "Tác vụ hỗ trợ Daily Reading đã bị hủy hoặc hết thời gian chờ.",
          )
        : new DailyReadingV2EnrichmentClientError(
           "network-error",
           error instanceof Error ? error.message : "Không thể gọi AI provider.",
          );
    const updated = updateDailyReadingV2Enrichment(
     articleId,
     failedUpdate(module, resolved.code, completedAt),
    );
    try {
     saveDailyReadingV2EnrichmentRun({
      id: runId,
      articleId,
      module,
      status: "failed",
      attemptedAt,
      completedAt,
      errorCode: resolved.code,
      errorDetail: resolved.message.slice(0, 600),
     });
    } catch {
     // Keep the durable module failure even if run history cannot be persisted.
    }
    return updated;
   } finally {
    window.clearTimeout(timeout);
    window.removeEventListener("pagehide", interrupt);
   }
  });
 } catch (error) {
  if (error instanceof DailyReadingGenerationBusyError) {
   throw new DailyReadingV2EnrichmentClientError("generation-busy", error.message);
  }
  throw error;
 }
}

export async function enrichDailyReadingV2LearningSupport(articleId: string) {
 let current = currentArticle(articleId);
 if (current === null) {
  throw new DailyReadingV2EnrichmentClientError(
   "article-not-found",
   "Không tìm thấy bài Daily Reading cần tạo hỗ trợ học tập.",
  );
 }
 const modules: readonly DailyReadingV2EnrichmentModule[] = [
  "translation",
  "vocabulary",
  "grammar",
  "questions",
 ];
 for (let index = 0; index < modules.length; index += 1) {
  const module = modules[index];
  if (module === undefined) continue;
  current = await enrichDailyReadingV2Module(articleId, module);
  const state = current.enrichment[module];
  if (state.status !== "blocked") continue;
  for (const remaining of modules.slice(index + 1)) {
   current = updateDailyReadingV2Enrichment(
    articleId,
    blockedStateUpdate(remaining, state.reason),
   );
  }
  break;
 }
 return current;
}
