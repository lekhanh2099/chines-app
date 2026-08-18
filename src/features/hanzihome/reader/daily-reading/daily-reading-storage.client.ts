"use client";

import { decodeJson, encodeJson } from "@/lib/schema/storage";

import {
 dailyReadingLedgerSchema,
 dailyReadingCheckpointRecordSchema,
 dailyReadingRunSchema,
 dailyReadingSchema,
 dailyReadingSettingsSchema,
 defaultDailyReadingSettings,
 type DailyReading,
 type DailyReadingCheckpointRecord,
 type DailyReadingRun,
 type DailyReadingSettings,
} from "./daily-reading.schemas";

const ledgerStorageKey = "chines-app:daily-reading:v1";
const checkpointStorageKey = "chines-app:daily-reading:checkpoint:v1";
const recoveryStorageKey = "chines-app:daily-reading:recovery:v1";
const settingsStorageKey = "chines-app:daily-reading-settings:v1";
const changeEvent = "chines-app:daily-reading-change";
const settingsChangeEvent = "chines-app:daily-reading-settings-change";

export type DailyReadingRepositorySnapshot = {
 items: readonly DailyReading[];
 runs: readonly DailyReadingRun[];
 checkpoint: DailyReadingCheckpointRecord | null;
};

const emptyLedger = dailyReadingLedgerSchema.parse({ schemaVersion: "1.0.0", items: [], runs: [] });
const serverSnapshot: DailyReadingRepositorySnapshot = { items: [], runs: [], checkpoint: null };
let revision = 0;
let cachedRevision = -1;
let cachedSnapshot: DailyReadingRepositorySnapshot = serverSnapshot;
let settingsRevision = 0;
let cachedSettingsRevision = -1;
let cachedSettings = defaultDailyReadingSettings;

export type DailyReadingStorageErrorCode =
 | "storage-unavailable"
 | "storage-quota"
 | "storage-corrupt";

export class DailyReadingStorageError extends Error {
 constructor(
  readonly code: DailyReadingStorageErrorCode,
  message: string,
 ) {
  super(message);
  this.name = "DailyReadingStorageError";
 }
}

function preserveCorruptValue(raw: string) {
 try {
  window.localStorage.setItem(
   recoveryStorageKey,
   JSON.stringify({ capturedAt: new Date().toISOString(), raw: raw.slice(0, 200_000) }),
  );
 } catch {
  // Recovery is best-effort; the canonical archive still resets safely.
 }
}

function decodeLedger(raw: string) {
 return decodeJson(raw, dailyReadingLedgerSchema);
}

function readLedger() {
 if (typeof window === "undefined") return emptyLedger;
 try {
  const raw = window.localStorage.getItem(ledgerStorageKey);
  if (raw === null) return emptyLedger;
  const parsed = decodeLedger(raw);
  if (parsed !== null) return parsed;
  preserveCorruptValue(raw);
  window.localStorage.removeItem(ledgerStorageKey);
  return emptyLedger;
 } catch {
  return emptyLedger;
 }
}

function readCheckpoint() {
 if (typeof window === "undefined") return null;
 try {
  const raw = window.localStorage.getItem(checkpointStorageKey);
  if (raw === null) return null;
  const parsed = decodeJson(raw, dailyReadingCheckpointRecordSchema);
  if (parsed !== null) return parsed;
  window.localStorage.removeItem(checkpointStorageKey);
 } catch {
  return null;
 }
 return null;
}

function isQuotaError(error: Error) {
 return (
  error.name === "QuotaExceededError" ||
  error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
  /quota|storage full/iu.test(error.message)
 );
}

function compactLedger(
 ledger: typeof emptyLedger,
 itemLimit: number,
 runLimit: number,
): typeof emptyLedger {
 return dailyReadingLedgerSchema.parse({
  schemaVersion: "1.0.0",
  items: [...ledger.items]
   .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
   .slice(0, itemLimit),
  runs: [...ledger.runs]
   .sort((left, right) => right.attemptedAt.localeCompare(left.attemptedAt))
   .slice(0, runLimit),
 });
}

function writeEncodedLedger(encoded: string) {
 window.localStorage.setItem(ledgerStorageKey, encoded);
 const persisted = window.localStorage.getItem(ledgerStorageKey);
 if (persisted === null || persisted !== encoded || decodeLedger(persisted) === null) {
  throw new DailyReadingStorageError(
   "storage-corrupt",
   "Không thể xác minh thư viện Daily Reading vừa lưu.",
  );
 }
}

function persistLedger(value: typeof emptyLedger) {
 const parsed = dailyReadingLedgerSchema.parse(value);
 if (typeof window === "undefined") return parsed;
 const candidates = [
  parsed,
  compactLedger(parsed, 100, 300),
  compactLedger(parsed, 80, 220),
  compactLedger(parsed, 50, 120),
  compactLedger(parsed, 25, 60),
 ];
 let lastQuotaError: Error | null = null;
 for (const candidate of candidates) {
  const encoded = encodeJson(candidate, dailyReadingLedgerSchema);
  if (encoded === null) {
   throw new DailyReadingStorageError(
    "storage-corrupt",
    "Không thể mã hóa thư viện Daily Reading.",
   );
  }
  try {
   writeEncodedLedger(encoded);
   revision += 1;
   window.dispatchEvent(new Event(changeEvent));
   return candidate;
  } catch (error) {
   const resolved = error instanceof Error ? error : new Error("Local storage failed.");
   if (!isQuotaError(resolved)) {
    if (resolved instanceof DailyReadingStorageError) throw resolved;
    throw new DailyReadingStorageError("storage-unavailable", resolved.message);
   }
   lastQuotaError = resolved;
  }
 }
 throw new DailyReadingStorageError(
  "storage-quota",
  lastQuotaError?.message ?? "Bộ nhớ trình duyệt dành cho Daily Reading đã đầy.",
 );
}

function readingFingerprint(reading: DailyReading) {
 const input = [
  reading.source.url,
  reading.titleZh,
  ...reading.paragraphs.map((paragraph) => paragraph.zh),
 ]
  .join("|")
  .replace(/\s+/gu, "");
 let hash = 2_166_136_261;
 for (const character of input) {
  hash ^= character.codePointAt(0) ?? 0;
  hash = Math.imul(hash, 16_777_619);
 }
 return (hash >>> 0).toString(16).padStart(8, "0");
}

export function getDailyReadingServerSnapshot() {
 return serverSnapshot;
}

export function getDailyReadingSnapshot() {
 if (typeof window === "undefined") return serverSnapshot;
 if (cachedRevision === revision) return cachedSnapshot;
 const ledger = readLedger();
 cachedSnapshot = {
  items: [...ledger.items].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  runs: [...ledger.runs].sort((left, right) => right.attemptedAt.localeCompare(left.attemptedAt)),
  checkpoint: readCheckpoint(),
 };
 cachedRevision = revision;
 return cachedSnapshot;
}

export function getDailyReadingCheckpoint() {
 return getDailyReadingSnapshot().checkpoint;
}

export function subscribeDailyReading(listener: () => void) {
 if (typeof window === "undefined") return () => undefined;
 const onStorage = (event: StorageEvent) => {
  if (event.key !== ledgerStorageKey && event.key !== checkpointStorageKey) return;
  revision += 1;
  listener();
 };
 window.addEventListener(changeEvent, listener);
 window.addEventListener("storage", onStorage);
 return () => {
  window.removeEventListener(changeEvent, listener);
  window.removeEventListener("storage", onStorage);
 };
}

export function saveGeneratedDailyReading(reading: DailyReading) {
 const parsed = dailyReadingSchema.parse(reading);
 const fingerprint = readingFingerprint(parsed);
 const ledger = readLedger();
 const next = persistLedger({
  ...ledger,
  items: [
   parsed,
   ...ledger.items.filter(
    (item) =>
     item.id !== parsed.id &&
     item.source.url !== parsed.source.url &&
     readingFingerprint(item) !== fingerprint,
   ),
  ].slice(0, 120),
 });
 const saved = next.items.find((item) => item.id === parsed.id);
 if (saved === undefined) {
  throw new DailyReadingStorageError(
   "storage-quota",
   "Bài Daily Reading vừa tạo không còn chỗ để lưu sau khi thu gọn thư viện.",
  );
 }
 return saved;
}

export function saveDailyReadingRun(run: DailyReadingRun) {
 const parsed = dailyReadingRunSchema.parse(run);
 const ledger = readLedger();
 persistLedger({
  ...ledger,
  runs: [parsed, ...ledger.runs.filter((item) => item.id !== parsed.id)].slice(0, 400),
 });
 return parsed;
}

export function saveDailyReadingCheckpoint(checkpoint: DailyReadingCheckpointRecord) {
 const parsed = dailyReadingCheckpointRecordSchema.parse(checkpoint);
 if (typeof window === "undefined") return parsed;
 const encoded = encodeJson(parsed, dailyReadingCheckpointRecordSchema);
 if (encoded === null) {
  throw new DailyReadingStorageError(
   "storage-corrupt",
   "Không thể mã hóa checkpoint Daily Reading.",
  );
 }
 try {
  window.localStorage.setItem(checkpointStorageKey, encoded);
  if (window.localStorage.getItem(checkpointStorageKey) !== encoded) {
   throw new DailyReadingStorageError(
    "storage-corrupt",
    "Không thể xác minh checkpoint Daily Reading vừa lưu.",
   );
  }
  revision += 1;
  window.dispatchEvent(new Event(changeEvent));
  return parsed;
 } catch (error) {
  if (error instanceof DailyReadingStorageError) throw error;
  const resolved = error instanceof Error ? error : new Error("Local storage failed.");
  throw new DailyReadingStorageError(
   isQuotaError(resolved) ? "storage-quota" : "storage-unavailable",
   resolved.message,
  );
 }
}

export function clearDailyReadingCheckpoint(runId: string) {
 if (typeof window === "undefined") return;
 const current = readCheckpoint();
 if (current === null || current.runId !== runId) return;
 window.localStorage.removeItem(checkpointStorageKey);
 if (window.localStorage.getItem(checkpointStorageKey) !== null) {
  throw new DailyReadingStorageError(
   "storage-corrupt",
   "Không thể xóa checkpoint Daily Reading đã hoàn tất.",
  );
 }
 revision += 1;
 window.dispatchEvent(new Event(changeEvent));
}

export function markDailyReadingRunInterrupted(runId: string) {
 const ledger = readLedger();
 const target = ledger.runs.find((run) => run.id === runId && run.status === "pending");
 if (target === undefined) return;
 const interrupted = dailyReadingRunSchema.parse({
  ...target,
  status: "failed",
  completedAt: new Date().toISOString(),
  errorCode: "interrupted",
  errorDetail: "Trình duyệt đã ngắt tác vụ đang tạo bài.",
 });
 persistLedger({
  ...ledger,
  runs: ledger.runs.map((run) => (run.id === runId ? interrupted : run)),
 });
}

export function hasScheduledReadingForDate(date: string) {
 return readLedger().items.some(
  (item) => item.publishedDate === date && item.releaseKind === "scheduled",
 );
}

export function scheduledRunBlocksDate(run: DailyReadingRun, date: string, now: Date) {
 if (run.date !== date || run.kind !== "scheduled") return false;
 if (run.status === "succeeded") return true;
 if (run.errorCode === "interrupted" || run.errorCode === "offline") return false;
 const elapsed = now.getTime() - new Date(run.attemptedAt).getTime();
 if (run.status === "pending") return elapsed < 15 * 60 * 1000;
 return elapsed < 30 * 60 * 1000;
}

export function hasScheduledAttemptForDate(date: string, now = new Date()) {
 const runs = readLedger().runs.filter((run) => run.date === date && run.kind === "scheduled");
 const hardFailures = runs.filter(
  (run) =>
   run.status === "failed" && run.errorCode !== "interrupted" && run.errorCode !== "offline",
 );
 if (hardFailures.length >= 3) return true;
 return runs.some((run) => scheduledRunBlocksDate(run, date, now));
}

export function removeGeneratedDailyReadings() {
 const ledger = readLedger();
 persistLedger({ ...ledger, items: [] });
}

export function readDailyReadingSettings(): DailyReadingSettings {
 if (typeof window === "undefined") return defaultDailyReadingSettings;
 try {
  const raw = window.localStorage.getItem(settingsStorageKey);
  if (raw === null) return defaultDailyReadingSettings;
  return decodeJson(raw, dailyReadingSettingsSchema) ?? defaultDailyReadingSettings;
 } catch {
  return defaultDailyReadingSettings;
 }
}

export function getDailyReadingSettingsServerSnapshot() {
 return defaultDailyReadingSettings;
}

export function getDailyReadingSettingsSnapshot() {
 if (typeof window === "undefined") return defaultDailyReadingSettings;
 if (cachedSettingsRevision === settingsRevision) return cachedSettings;
 cachedSettings = readDailyReadingSettings();
 cachedSettingsRevision = settingsRevision;
 return cachedSettings;
}

export function writeDailyReadingSettings(settings: DailyReadingSettings) {
 const parsed = dailyReadingSettingsSchema.parse(settings);
 if (typeof window === "undefined") return parsed;
 const encoded = encodeJson(parsed, dailyReadingSettingsSchema);
 if (encoded === null) {
  throw new DailyReadingStorageError("storage-corrupt", "Không thể mã hóa cài đặt Daily Reading.");
 }
 window.localStorage.setItem(settingsStorageKey, encoded);
 cachedSettings = parsed;
 settingsRevision += 1;
 cachedSettingsRevision = settingsRevision;
 window.dispatchEvent(new Event(settingsChangeEvent));
 return parsed;
}

export function subscribeDailyReadingSettings(listener: () => void) {
 if (typeof window === "undefined") return () => undefined;
 const onStorage = (event: StorageEvent) => {
  if (event.key !== settingsStorageKey) return;
  settingsRevision += 1;
  listener();
 };
 window.addEventListener(settingsChangeEvent, listener);
 window.addEventListener("storage", onStorage);
 return () => {
  window.removeEventListener(settingsChangeEvent, listener);
  window.removeEventListener("storage", onStorage);
 };
}
