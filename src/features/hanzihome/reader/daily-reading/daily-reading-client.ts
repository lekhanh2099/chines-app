"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
 dailyReadingErrorResponseSchema,
 dailyReadingGenerateResponseSchema,
 dailyReadingSourcePreviewResponseSchema,
 type DailyReading,
 type DailyReadingGenerationKind,
 type DailyReadingLevel,
 type DailyReadingSourcePreviewResponse,
} from "./daily-reading.schemas";
import { vietnamDailyReadingDateKey } from "./daily-reading.scheduler";
import {
 getDailyReadingServerSnapshot,
 getDailyReadingSettingsServerSnapshot,
 getDailyReadingSettingsSnapshot,
 getDailyReadingSnapshot,
 saveDailyReadingRun,
 saveGeneratedDailyReading,
 subscribeDailyReading,
 subscribeDailyReadingSettings,
 writeDailyReadingSettings,
} from "./daily-reading-storage.client";
import { withDailyReadingGenerationLock } from "./daily-reading-lock.client";

export class DailyReadingClientError extends Error {
 constructor(
  readonly code: string,
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
  // Fall through to HTTP status boundary.
 }
 return new DailyReadingClientError("request-failed", `Daily Reading request failed (${response.status}).`);
}

function generationInput() {
 const snapshot = getDailyReadingSnapshot();
 return {
  excludedUrls: snapshot.items.slice(0, 120).map((item) => item.source.url),
  recentTopics: snapshot.items.slice(0, 10).map((item) => item.topic),
 };
}

export async function testDailyReadingSource(): Promise<DailyReadingSourcePreviewResponse> {
 if (navigator.onLine === false) throw new DailyReadingClientError("offline", "Thiết bị đang offline.");
 const response = await fetch("/api/hanzihome/reader/daily-reading/source", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  cache: "no-store",
  body: JSON.stringify(generationInput()),
 });
 if (!response.ok) throw await decodeFailure(response);
 const parsed = dailyReadingSourcePreviewResponseSchema.safeParse(await response.json());
 if (!parsed.success) throw new DailyReadingClientError("invalid-response", "Kiểm tra nguồn trả dữ liệu không hợp lệ.");
 return parsed.data;
}

export async function generateDailyReadingNow(
 kind: DailyReadingGenerationKind,
 level: DailyReadingLevel,
): Promise<DailyReading> {
 return withDailyReadingGenerationLock(async () => {
  const now = new Date();
  const runId = `daily-run:${kind}:${vietnamDailyReadingDateKey(now)}:${crypto.randomUUID()}`;
  const attemptedAt = now.toISOString();
  const pending = saveDailyReadingRun({
   id: runId,
   date: vietnamDailyReadingDateKey(now),
   kind,
   status: "pending",
   stage: "discovering",
   attemptedAt,
   completedAt: "",
   errorCode: "",
   errorDetail: "",
   readingId: "",
  });
  const interrupt = () => {
   saveDailyReadingRun({
    ...pending,
    status: "failed",
    completedAt: new Date().toISOString(),
    errorCode: "interrupted",
    errorDetail: "Trình duyệt đã ngắt tác vụ đang tạo bài.",
   });
  };
  window.addEventListener("pagehide", interrupt, { once: true });
  try {
   if (navigator.onLine === false) throw new DailyReadingClientError("offline", "Thiết bị đang offline.");
   const input = generationInput();
   const response = await fetch("/api/hanzihome/reader/daily-reading/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({
     ...input,
     mode: kind,
     preferredLevel: level,
    }),
   });
   if (!response.ok) throw await decodeFailure(response);
   const parsed = dailyReadingGenerateResponseSchema.safeParse(await response.json());
   if (!parsed.success) {
    throw new DailyReadingClientError("invalid-response", "AI trả bài đọc không đúng contract.");
   }
   saveDailyReadingRun({ ...pending, stage: "saving" });
   const reading = saveGeneratedDailyReading(parsed.data.reading);
   saveDailyReadingRun({
    ...pending,
    status: "succeeded",
    stage: "completed",
    completedAt: new Date().toISOString(),
    readingId: reading.id,
   });
   return reading;
  } catch (error) {
   const resolved =
    error instanceof DailyReadingClientError
     ? error
     : new DailyReadingClientError(
        "generation-failed",
        error instanceof Error ? error.message : "Không thể tạo Daily Reading.",
       );
   saveDailyReadingRun({
    ...pending,
    status: "failed",
    completedAt: new Date().toISOString(),
    errorCode: resolved.code,
    errorDetail: resolved.message.slice(0, 1000),
   });
   throw resolved;
  } finally {
   window.removeEventListener("pagehide", interrupt);
  }
 });
}

export function useDailyReadingLibrary() {
 return useSyncExternalStore(subscribeDailyReading, getDailyReadingSnapshot, getDailyReadingServerSnapshot);
}

export function useDailyReadingSettings() {
 const settings = useSyncExternalStore(
  subscribeDailyReadingSettings,
  getDailyReadingSettingsSnapshot,
  getDailyReadingSettingsServerSnapshot,
 );
 const update = useCallback(
  (patch: Partial<Pick<typeof settings, "autoGenerateEnabled" | "preferredLevel">>) =>
   writeDailyReadingSettings({ ...settings, ...patch }),
  [settings],
 );
 return { settings, update };
}
