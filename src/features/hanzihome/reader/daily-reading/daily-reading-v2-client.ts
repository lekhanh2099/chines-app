"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
 dailyReadingErrorResponseSchema,
 type DailyReadingErrorCode,
 type DailyReadingGenerationKind,
} from "./daily-reading.schemas";
import {
 dailyReadingV2CaptureResponseSchema,
 type DailyReadingV2,
 type DailyReadingV2CaptureStage,
} from "./daily-reading-v2.schemas";
import { vietnamDailyReadingDateKey } from "./daily-reading.scheduler";
import {
 getDailyReadingV2ServerSnapshot,
 getDailyReadingV2SettingsServerSnapshot,
 getDailyReadingV2SettingsSnapshot,
 getDailyReadingV2Snapshot,
 markDailyReadingV2CaptureRunInterrupted,
 saveDailyReadingV2Article,
 saveDailyReadingV2CaptureRun,
 subscribeDailyReadingV2,
 subscribeDailyReadingV2Settings,
 writeDailyReadingV2Settings,
} from "./daily-reading-v2-storage.client";
import {
 DailyReadingGenerationBusyError,
 withDailyReadingGenerationLock,
} from "./daily-reading-lock.client";

export class DailyReadingV2ClientError extends Error {
 constructor(
  readonly code: DailyReadingErrorCode,
  message: string,
 ) {
  super(message);
  this.name = "DailyReadingV2ClientError";
 }
}

async function decodeFailure(response: Response) {
 try {
  const parsed = dailyReadingErrorResponseSchema.safeParse(await response.json());
  if (parsed.success) return new DailyReadingV2ClientError(parsed.data.code, parsed.data.detail);
 } catch {
  // Fall through to the bounded HTTP failure below.
 }
 return new DailyReadingV2ClientError(
  response.status === 401 ? "unauthorized" : "source-extraction-failed",
  `Daily Reading capture failed (${response.status}).`,
 );
}

function captureHistoryInput() {
 return getDailyReadingV2Snapshot().items.slice(0, 120).map((item) => ({
  topic: item.classification.topic,
  sourceUrl: item.source.url,
  capturedAt: item.capturedAt,
 }));
}

export async function captureDailyReadingNow(
 kind: DailyReadingGenerationKind,
 options: { onProgress?(stage: DailyReadingV2CaptureStage): void } = {},
): Promise<DailyReadingV2> {
 if (navigator.onLine === false) {
  throw new DailyReadingV2ClientError("offline", "Thiết bị đang offline.");
 }

 try {
  return await withDailyReadingGenerationLock(async () => {
   const now = new Date();
   const date = vietnamDailyReadingDateKey(now);
   const runId = `daily-capture:${kind}:${date}:${crypto.randomUUID()}`;
   const attemptedAt = now.toISOString();
   let stage: DailyReadingV2CaptureStage = "discovering";
   const persistRun = (
    status: "pending" | "succeeded" | "failed",
    completedAt: string,
    errorCode: string,
    errorDetail: string,
    articleId: string,
   ) =>
    saveDailyReadingV2CaptureRun({
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
   const interrupt = () => markDailyReadingV2CaptureRunInterrupted(runId);
   window.addEventListener("pagehide", interrupt, { once: true });
   const controller = new AbortController();
   const timeout = window.setTimeout(() => controller.abort(), 120_000);

   try {
    options.onProgress?.("discovering");
    const response = await fetch("/api/hanzihome/reader/daily-reading/capture", {
     method: "POST",
     headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
     },
     credentials: "include",
     cache: "no-store",
     signal: controller.signal,
     body: JSON.stringify({
      mode: kind,
      settings: getDailyReadingV2SettingsSnapshot(),
      history: captureHistoryInput(),
     }),
    });
    if (!response.ok) throw await decodeFailure(response);
    const parsed = dailyReadingV2CaptureResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
     throw new DailyReadingV2ClientError(
      "source-extraction-failed",
      "Server trả bài nguồn Daily Reading không đúng contract.",
     );
    }

    stage = "saving";
    options.onProgress?.("saving");
    const saved = saveDailyReadingV2Article(parsed.data.reading);

    stage = "completed";
    options.onProgress?.("completed");
    try {
     persistRun("succeeded", new Date().toISOString(), "", "", saved.id);
    } catch {
     // The article is already durable. Capture telemetry must never roll it back.
    }
    return saved;
   } catch (error) {
    const resolved =
     error instanceof DailyReadingV2ClientError
      ? error
      : error instanceof DOMException && error.name === "AbortError"
        ? new DailyReadingV2ClientError("timeout", "Tìm bài Daily Reading quá 120 giây và đã được hủy.")
        : new DailyReadingV2ClientError(
           "source-extraction-failed",
           error instanceof Error ? error.message : "Không thể tìm bài Daily Reading.",
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
   throw new DailyReadingV2ClientError("generation-busy", error.message);
  }
  throw error;
 }
}

export function useDailyReadingV2Library() {
 return useSyncExternalStore(
  subscribeDailyReadingV2,
  getDailyReadingV2Snapshot,
  getDailyReadingV2ServerSnapshot,
 );
}

export function useDailyReadingV2Settings() {
 const settings = useSyncExternalStore(
  subscribeDailyReadingV2Settings,
  getDailyReadingV2SettingsSnapshot,
  getDailyReadingV2SettingsServerSnapshot,
 );
 const update = useCallback(
  (patch: Partial<typeof settings>) => writeDailyReadingV2Settings({ ...settings, ...patch }),
  [settings],
 );
 return { settings, update };
}
