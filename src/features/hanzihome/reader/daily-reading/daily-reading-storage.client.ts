"use client";

import { decodeJson, encodeJson } from "@/lib/schema/storage";

import {
 legacyDailyReadingLedgerSchema,
 legacyDailyReadingSettingsSchema,
 type LegacyDailyReadingSettings,
} from "./daily-reading-legacy.schemas";
import {
 migrateLegacyDailyReadingLedger,
 migrateDailyReadingLedger,
 migrateDailyReadingPreviousLedger,
} from "./daily-reading.migration";
import {
 dailyReadingCaptureRunSchema,
 dailyReadingEnrichmentRunSchema,
 dailyReadingLedgerSchema,
 dailyReadingLegacyLedgerSchema,
 dailyReadingPreviousLedgerSchema,
 dailyReadingLegacySettingsSchema,
 dailyReadingSchema,
 dailyReadingSettingsSchema,
 type DailyReading,
 type DailyReadingCaptureRun,
 type DailyReadingEnrichmentRun,
 type DailyReadingLedger,
 type DailyReadingSettings,
} from "./daily-reading.schemas";
import {
 defaultDailyReadingSettings,
 migrateLegacyDailyReadingSettings,
 migrateDailyReadingSettings,
} from "./daily-reading.settings";

const ledgerStorageKey = "chines-app:daily-reading";
const previousLedgerStorageKey = "chines-app:daily-reading:v2";
const legacyLedgerStorageKey = "chines-app:daily-reading:v1";
const recoveryStorageKey = "chines-app:daily-reading:recovery";
const settingsStorageKey = "chines-app:daily-reading-settings";
const previousSettingsStorageKey = "chines-app:daily-reading-settings:v3";
const legacySettingsStorageKey = "chines-app:daily-reading-settings:v2";
const originalSettingsStorageKey = "chines-app:daily-reading-settings:v1";
const changeEvent = "chines-app:daily-reading-change";
const settingsChangeEvent = "chines-app:daily-reading-settings-change";

export type DailyReadingRepositorySnapshot = {
 items: readonly DailyReading[];
 captureRuns: readonly DailyReadingCaptureRun[];
 enrichmentRuns: DailyReadingLedger["enrichmentRuns"];
 legacyRuns: DailyReadingLedger["legacyRuns"];
};

export type DailyReadingEnrichmentStateUpdate =
 | { module: "translation"; state: DailyReading["enrichment"]["translation"] }
 | { module: "vocabulary"; state: DailyReading["enrichment"]["vocabulary"] }
 | { module: "grammar"; state: DailyReading["enrichment"]["grammar"] }
 | { module: "questions"; state: DailyReading["enrichment"]["questions"] };

const emptyLedger = dailyReadingLedgerSchema.parse({
 schemaVersion: "2.2.0",
 items: [],
 captureRuns: [],
 enrichmentRuns: [],
 legacyRuns: [],
});
const serverSnapshot: DailyReadingRepositorySnapshot = {
 items: [],
 captureRuns: [],
 enrichmentRuns: [],
 legacyRuns: [],
};
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

function isQuotaError(error: Error) {
 return (
  error.name === "QuotaExceededError" ||
  error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
  /quota|storage full/iu.test(error.message)
 );
}

function preserveCorruptValue(raw: string) {
 try {
  window.localStorage.setItem(
   recoveryStorageKey,
   JSON.stringify({ capturedAt: new Date().toISOString(), raw: raw.slice(0, 250_000) }),
  );
 } catch {
  // Recovery is best-effort. The untouched legacy ledgers remain migration fallbacks.
 }
}

function decodeLedger(raw: string) {
 const current = decodeJson(raw, dailyReadingLedgerSchema);
 if (current !== null) return current;
 const previous = decodeJson(raw, dailyReadingPreviousLedgerSchema);
 if (previous !== null) return migrateDailyReadingPreviousLedger(previous);
 const legacy = decodeJson(raw, dailyReadingLegacyLedgerSchema);
 return legacy === null ? null : migrateDailyReadingLedger(legacy);
}

function compactLedger(
 ledger: DailyReadingLedger,
 itemLimit: number,
 captureRunLimit: number,
 enrichmentRunLimit: number,
 legacyRunLimit: number,
): DailyReadingLedger {
 return dailyReadingLedgerSchema.parse({
  schemaVersion: "2.2.0",
  items: [...ledger.items]
   .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt))
   .slice(0, itemLimit),
  captureRuns: [...ledger.captureRuns]
   .sort((left, right) => right.attemptedAt.localeCompare(left.attemptedAt))
   .slice(0, captureRunLimit),
  enrichmentRuns: [...ledger.enrichmentRuns]
   .sort((left, right) => right.attemptedAt.localeCompare(left.attemptedAt))
   .slice(0, enrichmentRunLimit),
  legacyRuns: [...ledger.legacyRuns]
   .sort((left, right) => right.attemptedAt.localeCompare(left.attemptedAt))
   .slice(0, legacyRunLimit),
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

function persistLedger(value: DailyReadingLedger, notify = true) {
 const parsed = dailyReadingLedgerSchema.parse(value);
 if (typeof window === "undefined") return parsed;
 const candidates = [
  parsed,
  compactLedger(parsed, 100, 300, 600, 300),
  compactLedger(parsed, 80, 220, 440, 220),
  compactLedger(parsed, 50, 140, 280, 140),
  compactLedger(parsed, 25, 80, 160, 80),
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
   if (notify) window.dispatchEvent(new Event(changeEvent));
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

function migrateLegacyLedger(): DailyReadingLedger {
 if (typeof window === "undefined") return emptyLedger;
 const raw = window.localStorage.getItem(legacyLedgerStorageKey);
 if (raw === null) return emptyLedger;
 const legacy = decodeJson(raw, legacyDailyReadingLedgerSchema);
 if (legacy === null) return emptyLedger;
 const migrated = migrateLegacyDailyReadingLedger({ items: legacy.items, runs: legacy.runs });
 try {
  return persistLedger(migrated, false);
 } catch {
  return migrated;
 }
}

function readLedger(): DailyReadingLedger {
 if (typeof window === "undefined") return emptyLedger;
 try {
  const raw = window.localStorage.getItem(ledgerStorageKey);
  const previousRaw = window.localStorage.getItem(previousLedgerStorageKey);
  const persisted = raw ?? previousRaw;
  if (persisted === null) return migrateLegacyLedger();
  const parsed = decodeLedger(persisted);
  if (parsed !== null && raw === null) {
   try {
    return persistLedger(parsed, false);
   } catch {
    return parsed;
   }
  }
  if (parsed !== null) return parsed;
  preserveCorruptValue(persisted);
  window.localStorage.removeItem(ledgerStorageKey);
  return migrateLegacyLedger();
 } catch {
  return migrateLegacyLedger();
 }
}

function applyEnrichmentState(reading: DailyReading, update: DailyReadingEnrichmentStateUpdate) {
 switch (update.module) {
  case "translation":
   return dailyReadingSchema.parse({
    ...reading,
    enrichment: { ...reading.enrichment, translation: update.state },
   });
  case "vocabulary":
   return dailyReadingSchema.parse({
    ...reading,
    enrichment: { ...reading.enrichment, vocabulary: update.state },
   });
  case "grammar":
   return dailyReadingSchema.parse({
    ...reading,
    enrichment: { ...reading.enrichment, grammar: update.state },
   });
  case "questions":
   return dailyReadingSchema.parse({
    ...reading,
    enrichment: { ...reading.enrichment, questions: update.state },
   });
 }
}

export function getDailyReadingServerSnapshot() {
 return serverSnapshot;
}

export function getDailyReadingSnapshot(): DailyReadingRepositorySnapshot {
 if (typeof window === "undefined") return serverSnapshot;
 if (cachedRevision === revision) return cachedSnapshot;
 const ledger = readLedger();
 cachedSnapshot = {
  items: [...ledger.items].sort((left, right) => right.capturedAt.localeCompare(left.capturedAt)),
  captureRuns: [...ledger.captureRuns].sort((left, right) =>
   right.attemptedAt.localeCompare(left.attemptedAt),
  ),
  enrichmentRuns: [...ledger.enrichmentRuns].sort((left, right) =>
   right.attemptedAt.localeCompare(left.attemptedAt),
  ),
  legacyRuns: [...ledger.legacyRuns].sort((left, right) =>
   right.attemptedAt.localeCompare(left.attemptedAt),
  ),
 };
 cachedRevision = revision;
 return cachedSnapshot;
}

export function subscribeDailyReading(listener: () => void) {
 if (typeof window === "undefined") return () => undefined;
 const onStorage = (event: StorageEvent) => {
  if (event.key !== ledgerStorageKey) return;
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

export function saveDailyReadingArticle(reading: DailyReading) {
 const parsed = dailyReadingSchema.parse(reading);
 const ledger = readLedger();
 const next = persistLedger({
  ...ledger,
  items: [
   parsed,
   ...ledger.items.filter(
    (item) =>
     item.id !== parsed.id &&
     item.source.url !== parsed.source.url &&
     item.article.fingerprint !== parsed.article.fingerprint,
   ),
  ].slice(0, 120),
 });
 const saved = next.items.find((item) => item.id === parsed.id);
 if (saved === undefined) {
  throw new DailyReadingStorageError(
   "storage-quota",
   "Bài Daily Reading vừa tìm được không còn chỗ để lưu sau khi thu gọn thư viện.",
  );
 }
 return saved;
}

export function removeDailyReadingArticle(articleId: string) {
 const ledger = readLedger();
 const exists = ledger.items.some((item) => item.id === articleId);
 if (!exists) return false;
 persistLedger({
  ...ledger,
  items: ledger.items.filter((item) => item.id !== articleId),
 });
 return true;
}

export function removeAllDailyReadingArticles() {
 const ledger = readLedger();
 if (ledger.items.length === 0) return 0;
 const removedCount = ledger.items.length;
 persistLedger({
  ...ledger,
  items: [],
 });
 return removedCount;
}

export function saveDailyReadingCaptureRun(run: DailyReadingCaptureRun) {
 const parsed = dailyReadingCaptureRunSchema.parse(run);
 const ledger = readLedger();
 persistLedger({
  ...ledger,
  captureRuns: [parsed, ...ledger.captureRuns.filter((item) => item.id !== parsed.id)].slice(
   0,
   400,
  ),
 });
 return parsed;
}

export function saveDailyReadingEnrichmentRun(run: DailyReadingEnrichmentRun) {
 const parsed = dailyReadingEnrichmentRunSchema.parse(run);
 const ledger = readLedger();
 persistLedger({
  ...ledger,
  enrichmentRuns: [
   parsed,
   ...ledger.enrichmentRuns.filter(
    (item) => item.runId !== parsed.runId || item.module !== parsed.module,
   ),
  ].slice(0, 800),
 });
 return parsed;
}

export function updateDailyReadingEnrichment(
 articleId: string,
 update: DailyReadingEnrichmentStateUpdate,
) {
 const ledger = readLedger();
 const target = ledger.items.find((item) => item.id === articleId);
 if (target === undefined) {
  throw new Error("Không tìm thấy bài Daily Reading để cập nhật hỗ trợ học tập.");
 }
 const updated = applyEnrichmentState(target, update);
 persistLedger({
  ...ledger,
  items: ledger.items.map((item) => (item.id === articleId ? updated : item)),
 });
 return updated;
}

export function markDailyReadingCaptureRunInterrupted(runId: string) {
 const ledger = readLedger();
 const target = ledger.captureRuns.find((run) => run.id === runId && run.status === "pending");
 if (target === undefined) return;
 const interrupted = dailyReadingCaptureRunSchema.parse({
  ...target,
  status: "failed",
  completedAt: new Date().toISOString(),
  errorCode: "interrupted",
  errorDetail: "Trình duyệt đã ngắt tác vụ đang tìm bài.",
 });
 persistLedger({
  ...ledger,
  captureRuns: ledger.captureRuns.map((run) => (run.id === runId ? interrupted : run)),
 });
}

export function hasScheduledCapturedArticleForDate(date: string) {
 return readLedger().items.some(
  (item) => item.publishedDate === date && item.releaseKind === "scheduled",
 );
}

export function scheduledCaptureRunBlocksDate(
 run: DailyReadingCaptureRun,
 date: string,
 now: Date,
) {
 if (run.date !== date || run.kind !== "scheduled") return false;
 if (run.status === "succeeded") return true;
 if (run.errorCode === "interrupted" || run.errorCode === "offline") return false;
 const elapsed = now.getTime() - new Date(run.attemptedAt).getTime();
 if (run.status === "pending") return elapsed < 15 * 60 * 1000;
 return elapsed < 30 * 60 * 1000;
}

export function hasScheduledCaptureAttemptForDate(date: string, now = new Date()) {
 const runs = readLedger().captureRuns.filter(
  (run) => run.date === date && run.kind === "scheduled",
 );
 const hardFailures = runs.filter(
  (run) =>
   run.status === "failed" && run.errorCode !== "interrupted" && run.errorCode !== "offline",
 );
 if (hardFailures.length >= 3) return true;
 return runs.some((run) => scheduledCaptureRunBlocksDate(run, date, now));
}

function readLegacySettings(): LegacyDailyReadingSettings | null {
 if (typeof window === "undefined") return null;
 const raw = window.localStorage.getItem(originalSettingsStorageKey);
 return raw === null ? null : decodeJson(raw, legacyDailyReadingSettingsSchema);
}

function writeSettings(settings: DailyReadingSettings, notify = true) {
 const parsed = dailyReadingSettingsSchema.parse(settings);
 if (typeof window === "undefined") return parsed;
 const encoded = encodeJson(parsed, dailyReadingSettingsSchema);
 if (encoded === null) {
  throw new DailyReadingStorageError("storage-corrupt", "Không thể mã hóa cài đặt Daily Reading.");
 }
 try {
  window.localStorage.setItem(settingsStorageKey, encoded);
  const persisted = window.localStorage.getItem(settingsStorageKey);
  if (
   persisted === null ||
   persisted !== encoded ||
   decodeJson(persisted, dailyReadingSettingsSchema) === null
  ) {
   throw new DailyReadingStorageError(
    "storage-corrupt",
    "Không thể xác minh cài đặt Daily Reading vừa lưu.",
   );
  }
  cachedSettings = parsed;
  settingsRevision += 1;
  cachedSettingsRevision = settingsRevision;
  if (notify) window.dispatchEvent(new Event(settingsChangeEvent));
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

export function readDailyReadingSettings(): DailyReadingSettings {
 if (typeof window === "undefined") return defaultDailyReadingSettings;
 try {
  const raw = window.localStorage.getItem(settingsStorageKey);
  if (raw !== null) {
   const parsed = decodeJson(raw, dailyReadingSettingsSchema);
   if (parsed !== null) return parsed;
  }
  const previousRaw = window.localStorage.getItem(previousSettingsStorageKey);
  if (previousRaw !== null) {
   const previous = decodeJson(previousRaw, dailyReadingSettingsSchema);
   if (previous !== null) {
    try {
     return writeSettings(previous, false);
    } catch {
     return previous;
    }
   }
  }
  const legacyRaw = window.localStorage.getItem(legacySettingsStorageKey);
  if (legacyRaw !== null) {
   const legacySettings = decodeJson(legacyRaw, dailyReadingLegacySettingsSchema);
   if (legacySettings !== null) {
    const migrated = migrateDailyReadingSettings(legacySettings);
    try {
     return writeSettings(migrated, false);
    } catch {
     return migrated;
    }
   }
  }
  const legacy = readLegacySettings();
  const migrated =
   legacy === null ? defaultDailyReadingSettings : migrateLegacyDailyReadingSettings(legacy);
  try {
   return writeSettings(migrated, false);
  } catch {
   return migrated;
  }
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
 return writeSettings(settings);
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
