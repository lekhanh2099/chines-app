"use client";

import {
 dailyReadingLedgerSchema,
 dailyReadingRunSchema,
 dailyReadingSchema,
 dailyReadingSettingsSchema,
 defaultDailyReadingSettings,
 type DailyReading,
 type DailyReadingRun,
 type DailyReadingSettings,
} from "./daily-reading.schemas";

const ledgerStorageKey = "chines-app:daily-reading:v1";
const settingsStorageKey = "chines-app:daily-reading-settings:v1";
const changeEvent = "chines-app:daily-reading-change";
const settingsChangeEvent = "chines-app:daily-reading-settings-change";

const emptyLedger = dailyReadingLedgerSchema.parse({ schemaVersion: "1.0.0", items: [], runs: [] });
const serverSnapshot = { items: [] as readonly DailyReading[], runs: [] as readonly DailyReadingRun[] };
let revision = 0;
let cachedRevision = -1;
let cachedSnapshot = serverSnapshot;
let settingsRevision = 0;
let cachedSettingsRevision = -1;
let cachedSettings = defaultDailyReadingSettings;

function parseJson(raw: string): unknown {
 try {
  return JSON.parse(raw) as unknown;
 } catch {
  return null;
 }
}

function readLedger() {
 if (typeof window === "undefined") return emptyLedger;
 try {
  const raw = window.localStorage.getItem(ledgerStorageKey);
  if (raw === null) return emptyLedger;
  const parsed = dailyReadingLedgerSchema.safeParse(parseJson(raw));
  return parsed.success ? parsed.data : emptyLedger;
 } catch {
  return emptyLedger;
 }
}

function persistLedger(value: typeof emptyLedger) {
 const parsed = dailyReadingLedgerSchema.parse(value);
 window.localStorage.setItem(ledgerStorageKey, JSON.stringify(parsed));
 revision += 1;
 window.dispatchEvent(new Event(changeEvent));
 return parsed;
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

export function saveGeneratedDailyReading(reading: DailyReading) {
 const parsed = dailyReadingSchema.parse(reading);
 const ledger = readLedger();
 const items = [
  parsed,
  ...ledger.items.filter(
   (item) => item.id !== parsed.id && item.source.url !== parsed.source.url,
  ),
 ].slice(0, 100);
 persistLedger({ ...ledger, items });
 return parsed;
}

export function saveDailyReadingRun(run: DailyReadingRun) {
 const parsed = dailyReadingRunSchema.parse(run);
 const ledger = readLedger();
 persistLedger({
  ...ledger,
  runs: [parsed, ...ledger.runs.filter((item) => item.id !== parsed.id)].slice(0, 300),
 });
 return parsed;
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

function runBlocksDate(run: DailyReadingRun, date: string, now: Date) {
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
  (run) => run.status === "failed" && run.errorCode !== "interrupted" && run.errorCode !== "offline",
 );
 if (hardFailures.length >= 3) return true;
 return runs.some((run) => runBlocksDate(run, date, now));
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
  const parsed = dailyReadingSettingsSchema.safeParse(parseJson(raw));
  return parsed.success ? parsed.data : defaultDailyReadingSettings;
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
 window.localStorage.setItem(settingsStorageKey, JSON.stringify(parsed));
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
