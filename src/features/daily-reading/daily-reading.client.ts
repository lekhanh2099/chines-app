"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
 dailyReadingErrorResponseSchema,
 type DailyReadingErrorCode,
 type DailyReadingGenerationKind,
} from "@/features/daily-reading/daily-reading.schemas";
import {
 dailyReadingCaptureResponseSchema,
 type DailyReading,
 type DailyReadingCaptureResponse,
 type DailyReadingCaptureStage,
} from "@/features/daily-reading/daily-reading.schemas";
import { vietnamDailyReadingDateKey } from "@/features/daily-reading/daily-reading.scheduler";
import {
 getDailyReadingServerSnapshot,
 getDailyReadingSettingsServerSnapshot,
 getDailyReadingSettingsSnapshot,
 getDailyReadingSnapshot,
 markDailyReadingCaptureRunInterrupted,
 saveDailyReadingArticle,
 saveDailyReadingCaptureRun,
 subscribeDailyReading,
 subscribeDailyReadingSettings,
 writeDailyReadingSettings,
} from "@/features/daily-reading/daily-reading-storage.client";
import {
 DailyReadingGenerationBusyError,
 withDailyReadingGenerationLock,
} from "@/features/daily-reading/daily-reading-lock.client";

export class DailyReadingClientError extends Error {
 constructor(
  readonly code: DailyReadingErrorCode,
  message: string,
 ) {
  super(message);
  this.name = "DailyReadingClientError";
 }
}

async function decodeFailure(response: Response) {
 try {
  const parsed = dailyReadingErrorResponseSchema.safeParse(await response.json());
  if (parsed.success) return new DailyReadingClientError(parsed.data.code, parsed.data.detail);
 } catch {
  // Fall through to the bounded HTTP failure below.
 }
 return new DailyReadingClientError(
  response.status === 401 ? "unauthorized" : "source-extraction-failed",
  `Daily Reading capture failed (${response.status}).`,
 );
}

function captureHistoryInput() {
 return getDailyReadingSnapshot()
  .items.slice(0, 120)
  .map((item) => ({
   topic: item.classification.topic,
   sourceUrl: item.source.url,
   capturedAt: item.capturedAt,
  }));
}

async function requestCapture(
 kind: DailyReadingGenerationKind,
 signal: AbortSignal,
): Promise<DailyReadingCaptureResponse> {
 const response = await fetch("/api/daily-reading/capture", {
  method: "POST",
  headers: {
   "Content-Type": "application/json",
   Accept: "application/json",
  },
  credentials: "include",
  cache: "no-store",
  signal,
  body: JSON.stringify({
   mode: kind,
   settings: getDailyReadingSettingsSnapshot(),
   history: captureHistoryInput(),
  }),
 });
 if (!response.ok) throw await decodeFailure(response);
 const parsed = dailyReadingCaptureResponseSchema.safeParse(await response.json());
 if (!parsed.success) {
  throw new DailyReadingClientError(
   "source-extraction-failed",
   "Server trả bài nguồn Daily Reading không đúng contract.",
  );
 }
 return parsed.data;
}

function normalizeCaptureClientError(error: unknown, timeoutMessage: string) {
 if (error instanceof DailyReadingClientError) return error;
 if (error instanceof DOMException && error.name === "AbortError") {
  return new DailyReadingClientError("timeout", timeoutMessage);
 }
 return new DailyReadingClientError(
  "source-extraction-failed",
  error instanceof Error ? error.message : "Không thể tìm bài Daily Reading.",
 );
}

export async function previewDailyReadingSource(): Promise<DailyReadingCaptureResponse> {
 if (navigator.onLine === false) {
  throw new DailyReadingClientError("offline", "Thiết bị đang offline.");
 }

 try {
  return await withDailyReadingGenerationLock(async () => {
   const controller = new AbortController();
   const timeout = window.setTimeout(() => controller.abort(), 120_000);
   try {
    return await requestCapture("manual", controller.signal);
   } catch (error) {
    throw normalizeCaptureClientError(
     error,
     "Kiểm tra nguồn Daily Reading quá 120 giây và đã được hủy.",
    );
   } finally {
    window.clearTimeout(timeout);
   }
  });
 } catch (error) {
  if (error instanceof DailyReadingGenerationBusyError) {
   throw new DailyReadingClientError("generation-busy", error.message);
  }
  throw error;
 }
}

export async function captureDailyReadingNow(
 kind: DailyReadingGenerationKind,
 options: { onProgress?(stage: DailyReadingCaptureStage): void } = {},
): Promise<DailyReading> {
 if (navigator.onLine === false) {
  throw new DailyReadingClientError("offline", "Thiết bị đang offline.");
 }

 try {
  return await withDailyReadingGenerationLock(async () => {
   const now = new Date();
   const date = vietnamDailyReadingDateKey(now);
   const runId = `daily-capture:${kind}:${date}:${crypto.randomUUID()}`;
   const attemptedAt = now.toISOString();
   let stage: DailyReadingCaptureStage = "discovering";
   const persistRun = (
    status: "pending" | "succeeded" | "failed",
    completedAt: string,
    errorCode: string,
    errorDetail: string,
    articleId: string,
   ) =>
    saveDailyReadingCaptureRun({
     id: runId,
     date,
     kind,
     status,
     stage,
     attemptedAt,
     completedAt,
     errorCode,
     errorDetail,
     articleId,
    });

   persistRun("pending", "", "", "", "");
   const interrupt = () => markDailyReadingCaptureRunInterrupted(runId);
   window.addEventListener("pagehide", interrupt, { once: true });
   const controller = new AbortController();
   const timeout = window.setTimeout(() => controller.abort(), 120_000);

   try {
    options.onProgress?.("discovering");
    const result = await requestCapture(kind, controller.signal);

    stage = "saving";
    options.onProgress?.("saving");
    const saved = saveDailyReadingArticle(result.reading);

    stage = "completed";
    options.onProgress?.("completed");
    try {
     persistRun("succeeded", new Date().toISOString(), "", "", saved.id);
    } catch {
     // The article is already durable. Capture telemetry must never roll it back.
    }
    return saved;
   } catch (error) {
    const resolved = normalizeCaptureClientError(
     error,
     "Tìm bài Daily Reading quá 120 giây và đã được hủy.",
    );
    try {
     persistRun(
      "failed",
      new Date().toISOString(),
      resolved.code,
      resolved.message.slice(0, 1000),
      "",
     );
    } catch {
     // Preserve the capture failure when local run telemetry cannot be written.
    }
    throw resolved;
   } finally {
    window.clearTimeout(timeout);
    window.removeEventListener("pagehide", interrupt);
   }
  });
 } catch (error) {
  if (error instanceof DailyReadingGenerationBusyError) {
   throw new DailyReadingClientError("generation-busy", error.message);
  }
  throw error;
 }
}

export function useDailyReadingLibrary() {
 return useSyncExternalStore(
  subscribeDailyReading,
  getDailyReadingSnapshot,
  getDailyReadingServerSnapshot,
 );
}

export function useDailyReadingSettings() {
 const settings = useSyncExternalStore(
  subscribeDailyReadingSettings,
  getDailyReadingSettingsSnapshot,
  getDailyReadingSettingsServerSnapshot,
 );
 const update = useCallback(
  (patch: Partial<typeof settings>) => writeDailyReadingSettings({ ...settings, ...patch }),
  [settings],
 );
 return { settings, update };
}
