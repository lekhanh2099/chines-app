"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
 dailyReadingErrorResponseSchema,
 dailyReadingGenerateResponseSchema,
 dailyReadingGenerateStreamEventSchema,
 dailyReadingSourcePreviewResponseSchema,
 type DailyReading,
 type DailyReadingErrorCode,
 type DailyReadingGenerationKind,
 type DailyReadingGenerationStage,
 type DailyReadingLevel,
 type DailyReadingSourcePreviewResponse,
} from "./daily-reading.schemas";
import { vietnamDailyReadingDateKey } from "./daily-reading.scheduler";
import {
 getDailyReadingServerSnapshot,
 getDailyReadingSettingsServerSnapshot,
 getDailyReadingSettingsSnapshot,
 getDailyReadingSnapshot,
 markDailyReadingRunInterrupted,
 saveDailyReadingRun,
 saveGeneratedDailyReading,
 subscribeDailyReading,
 subscribeDailyReadingSettings,
 writeDailyReadingSettings,
} from "./daily-reading-storage.client";
import {
 DailyReadingGenerationBusyError,
 withDailyReadingGenerationLock,
} from "./daily-reading-lock.client";

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
  response.status === 401 ? "unauthorized" : "provider-rejected",
  `Daily Reading request failed (${response.status}).`,
 );
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
 const controller = new AbortController();
 const timeout = window.setTimeout(() => controller.abort(), 90_000);
 try {
  const response = await fetch("/api/hanzihome/reader/daily-reading/source", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   credentials: "include",
   cache: "no-store",
   body: JSON.stringify(generationInput()),
   signal: controller.signal,
  });
  if (!response.ok) throw await decodeFailure(response);
  const parsed = dailyReadingSourcePreviewResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
   throw new DailyReadingClientError("invalid-provider-response", "Kiểm tra nguồn trả dữ liệu không hợp lệ.");
  }
  return parsed.data;
 } catch (error) {
  if (error instanceof DOMException && error.name === "AbortError") {
   throw new DailyReadingClientError("timeout", "Kiểm tra nguồn quá 90 giây và đã được hủy.");
  }
  throw error;
 } finally {
  window.clearTimeout(timeout);
 }
}

async function parseStreamEvent(line: string) {
 try {
  const parsed = dailyReadingGenerateStreamEventSchema.safeParse(JSON.parse(line));
  return parsed.success ? parsed.data : null;
 } catch {
  return null;
 }
}

async function readGenerationStream(
 response: Response,
 onProgress: (stage: DailyReadingGenerationStage) => void,
): Promise<DailyReading> {
 if (response.body === null) {
  throw new DailyReadingClientError(
   "invalid-provider-response",
   "Server không trả luồng tạo Daily Reading.",
  );
 }
 const reader = response.body.getReader();
 const decoder = new TextDecoder();
 let buffer = "";
 let reading: DailyReading | null = null;
 let lastProgress: DailyReadingGenerationStage | null = null;
 const emitProgress = (stage: DailyReadingGenerationStage) => {
  if (stage === lastProgress) return;
  lastProgress = stage;
  onProgress(stage);
 };
 const consumeLine = async (line: string) => {
  if (!line.trim()) return;
  const event = await parseStreamEvent(line);
  if (event === null) {
   throw new DailyReadingClientError(
    "invalid-provider-response",
    "Server trả progress event Daily Reading không đọc được.",
   );
  }
  if (event.type === "progress") emitProgress(event.stage);
  if (event.type === "error") {
   throw new DailyReadingClientError(event.payload.code, event.payload.detail);
  }
  if (event.type === "result") reading = dailyReadingGenerateResponseSchema.parse(event.payload).reading;
 };

 while (true) {
  const chunk = await reader.read();
  buffer += decoder.decode(chunk.value, { stream: !chunk.done });
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";
  for (const line of lines) await consumeLine(line);
  if (chunk.done) break;
 }
 if (buffer.trim()) await consumeLine(buffer);
 if (reading === null) {
  throw new DailyReadingClientError(
   "invalid-provider-response",
   "Luồng Daily Reading kết thúc trước khi trả bài đã kiểm tra.",
  );
 }
 return reading;
}

export async function generateDailyReadingNow(
 kind: DailyReadingGenerationKind,
 level: DailyReadingLevel,
 options: { onProgress?(stage: DailyReadingGenerationStage): void } = {},
): Promise<DailyReading> {
 if (navigator.onLine === false) {
  throw new DailyReadingClientError("offline", "Thiết bị đang offline.");
 }
 try {
  return await withDailyReadingGenerationLock(async () => {
   const now = new Date();
   const date = vietnamDailyReadingDateKey(now);
   const runId = `daily-run:${kind}:${date}:${crypto.randomUUID()}`;
   const attemptedAt = now.toISOString();
   let stage: DailyReadingGenerationStage = "discovering";
   const persistRun = (
    status: "pending" | "succeeded" | "failed",
    completedAt: string,
    errorCode: string,
    errorDetail: string,
    readingId: string,
   ) =>
    saveDailyReadingRun({
     id: runId,
     date,
     kind,
     status,
     stage,
     attemptedAt,
     completedAt,
     errorCode,
     errorDetail,
     readingId,
    });

   persistRun("pending", "", "", "", "");
   const interrupt = () => markDailyReadingRunInterrupted(runId);
   window.addEventListener("pagehide", interrupt, { once: true });
   const controller = new AbortController();
   const timeout = window.setTimeout(() => controller.abort(), 540_000);

   const progress = (nextStage: DailyReadingGenerationStage) => {
    stage = nextStage;
    options.onProgress?.(nextStage);
    try {
     persistRun("pending", "", "", "", "");
    } catch {
     // Progress telemetry must not cancel an otherwise valid generation request.
    }
   };

   try {
    const input = generationInput();
    const response = await fetch("/api/hanzihome/reader/daily-reading/generate", {
     method: "POST",
     headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson, application/json",
     },
     credentials: "include",
     cache: "no-store",
     body: JSON.stringify({
      ...input,
      mode: kind,
      preferredLevel: level,
     }),
     signal: controller.signal,
    });
    if (!response.ok) throw await decodeFailure(response);
    const contentType = response.headers.get("content-type") ?? "";
    const reading = contentType.includes("application/x-ndjson")
     ? await readGenerationStream(response, progress)
     : dailyReadingGenerateResponseSchema.parse(await response.json()).reading;
    progress("saving");
    const saved = saveGeneratedDailyReading(reading);
    stage = "completed";
    persistRun("succeeded", new Date().toISOString(), "", "", saved.id);
    return saved;
   } catch (error) {
    const resolved =
     error instanceof DailyReadingClientError
      ? error
      : error instanceof DOMException && error.name === "AbortError"
        ? new DailyReadingClientError("timeout", "Tạo Daily Reading quá 9 phút và đã được hủy.")
        : new DailyReadingClientError(
           "provider-rejected",
           error instanceof Error ? error.message : "Không thể tạo Daily Reading.",
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
     // Preserve the original generation failure if local telemetry cannot be written.
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
