"use client";

import { z } from "zod";

const lockName = "chines-app:daily-reading-generation";
const storageKey = `${lockName}:v1`;
const leaseMilliseconds = 12 * 60 * 1000;
const heartbeatMilliseconds = 30 * 1000;
const lockRecordSchema = z.strictObject({
 ownerId: z.string().min(1),
 expiresAt: z.number().int().nonnegative(),
});

export class DailyReadingGenerationBusyError extends Error {
 constructor() {
  super("Một tab khác đang tạo Daily Reading.");
  this.name = "DailyReadingGenerationBusyError";
 }
}

function readLease() {
 try {
  const raw = window.localStorage.getItem(storageKey);
  if (raw === null) return null;
  const parsed = lockRecordSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
 } catch {
  return null;
 }
}

async function withLocalStorageLease<Result>(task: () => Promise<Result>) {
 const ownerId = crypto.randomUUID();
 const claim = () => {
  const current = readLease();
  const now = Date.now();
  if (current !== null && current.ownerId !== ownerId && current.expiresAt > now) return false;
  window.localStorage.setItem(storageKey, JSON.stringify({ ownerId, expiresAt: now + leaseMilliseconds }));
  return readLease()?.ownerId === ownerId;
 };
 if (!claim()) throw new DailyReadingGenerationBusyError();
 const heartbeat = window.setInterval(() => {
  if (readLease()?.ownerId === ownerId) claim();
 }, heartbeatMilliseconds);
 try {
  return await task();
 } finally {
  window.clearInterval(heartbeat);
  if (readLease()?.ownerId === ownerId) window.localStorage.removeItem(storageKey);
 }
}

export async function withDailyReadingGenerationLock<Result>(task: () => Promise<Result>) {
 if (typeof navigator !== "undefined" && navigator.locks !== undefined) {
  const result = await navigator.locks.request(
   lockName,
   { ifAvailable: true, mode: "exclusive" },
   async (lock) => {
    if (lock === null) throw new DailyReadingGenerationBusyError();
    return task();
   },
  );
  return result;
 }
 return withLocalStorageLease(task);
}
