"use client";

import { z } from "zod";

const lockName = "chines-app:daily-reading-generation";
const databaseName = "chines-app-coordination";
const databaseVersion = 1;
const storeName = "locks";
const storageKey = `${lockName}:v1`;
const leaseMilliseconds = 12 * 60 * 1000;
const heartbeatMilliseconds = 30 * 1000;
const lockRecordSchema = z.strictObject({
 name: z.string().min(1),
 ownerId: z.string().min(1),
 expiresAt: z.number().int().nonnegative(),
});

export type DailyReadingLockRecord = z.output<typeof lockRecordSchema>;

export class DailyReadingGenerationBusyError extends Error {
 constructor() {
  super("Một tab khác đang tạo Daily Reading.");
  this.name = "DailyReadingGenerationBusyError";
 }
}

class DailyReadingLockBackendError extends Error {
 constructor(message: string) {
  super(message);
  this.name = "DailyReadingLockBackendError";
 }
}

export function canAcquireDailyReadingLease(
 current: DailyReadingLockRecord | null,
 ownerId: string,
 now: number,
) {
 return current === null || current.ownerId === ownerId || current.expiresAt <= now;
}

function openCoordinationDatabase(): Promise<IDBDatabase> {
 return new Promise((resolve, reject) => {
  const request = window.indexedDB.open(databaseName, databaseVersion);
  request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed."));
  request.onupgradeneeded = () => {
   const database = request.result;
   if (!database.objectStoreNames.contains(storeName)) {
    database.createObjectStore(storeName, { keyPath: "name" });
   }
  };
  request.onsuccess = () => resolve(request.result);
 });
}

function acquireIndexedDbLease(database: IDBDatabase, ownerId: string): Promise<boolean> {
 return new Promise((resolve, reject) => {
  const transaction = database.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  const getRequest = store.get(lockName);
  let acquired = false;

  getRequest.onerror = () => reject(getRequest.error ?? new Error("Lock read failed."));
  getRequest.onsuccess = () => {
   const parsed = lockRecordSchema.safeParse(getRequest.result);
   const current = parsed.success ? parsed.data : null;
   const now = Date.now();
   if (!canAcquireDailyReadingLease(current, ownerId, now)) return;
   const record: DailyReadingLockRecord = {
    name: lockName,
    ownerId,
    expiresAt: now + leaseMilliseconds,
   };
   acquired = true;
   store.put(record);
  };
  transaction.onabort = () => reject(transaction.error ?? new Error("Lock transaction aborted."));
  transaction.onerror = () => reject(transaction.error ?? new Error("Lock transaction failed."));
  transaction.oncomplete = () => resolve(acquired);
 });
}

function updateIndexedDbLease(
 database: IDBDatabase,
 ownerId: string,
 release: boolean,
): Promise<void> {
 return new Promise((resolve, reject) => {
  const transaction = database.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  const getRequest = store.get(lockName);
  getRequest.onerror = () => reject(getRequest.error ?? new Error("Lock refresh failed."));
  getRequest.onsuccess = () => {
   const parsed = lockRecordSchema.safeParse(getRequest.result);
   if (!parsed.success || parsed.data.ownerId !== ownerId) return;
   if (release) {
    store.delete(lockName);
    return;
   }
   const record: DailyReadingLockRecord = {
    ...parsed.data,
    expiresAt: Date.now() + leaseMilliseconds,
   };
   store.put(record);
  };
  transaction.onabort = () => reject(transaction.error ?? new Error("Lock update aborted."));
  transaction.onerror = () => reject(transaction.error ?? new Error("Lock update failed."));
  transaction.oncomplete = () => resolve();
 });
}

async function withIndexedDbLease<Result>(task: () => Promise<Result>): Promise<Result> {
 let database: IDBDatabase;
 const ownerId = crypto.randomUUID();
 try {
  database = await openCoordinationDatabase();
  const acquired = await acquireIndexedDbLease(database, ownerId);
  if (!acquired) {
   database.close();
   throw new DailyReadingGenerationBusyError();
  }
 } catch (error) {
  if (error instanceof DailyReadingGenerationBusyError) throw error;
  throw new DailyReadingLockBackendError(
   error instanceof Error ? error.message : "IndexedDB lock unavailable.",
  );
 }

 const heartbeat = window.setInterval(() => {
  void updateIndexedDbLease(database, ownerId, false).catch(() => undefined);
 }, heartbeatMilliseconds);
 try {
  return await task();
 } finally {
  window.clearInterval(heartbeat);
  await updateIndexedDbLease(database, ownerId, true).catch(() => undefined);
  database.close();
 }
}

function readLocalStorageLease(): DailyReadingLockRecord | null {
 try {
  const raw = window.localStorage.getItem(storageKey);
  if (raw === null) return null;
  const parsed = lockRecordSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
 } catch {
  return null;
 }
}

async function withLocalStorageLease<Result>(task: () => Promise<Result>): Promise<Result> {
 const ownerId = crypto.randomUUID();
 const claim = () => {
  const now = Date.now();
  if (!canAcquireDailyReadingLease(readLocalStorageLease(), ownerId, now)) return false;
  const record: DailyReadingLockRecord = {
   name: lockName,
   ownerId,
   expiresAt: now + leaseMilliseconds,
  };
  window.localStorage.setItem(storageKey, JSON.stringify(record));
  return readLocalStorageLease()?.ownerId === ownerId;
 };
 if (!claim()) throw new DailyReadingGenerationBusyError();
 const heartbeat = window.setInterval(() => {
  if (readLocalStorageLease()?.ownerId === ownerId) claim();
 }, heartbeatMilliseconds);
 try {
  return await task();
 } finally {
  window.clearInterval(heartbeat);
  if (readLocalStorageLease()?.ownerId === ownerId) window.localStorage.removeItem(storageKey);
 }
}

async function withNavigatorLock<Result>(task: () => Promise<Result>): Promise<Result> {
 let taskStarted = false;
 try {
  return await navigator.locks.request(
   lockName,
   { ifAvailable: true, mode: "exclusive" },
   async (lock) => {
    if (lock === null) throw new DailyReadingGenerationBusyError();
    taskStarted = true;
    return task();
   },
  );
 } catch (error) {
  if (error instanceof DailyReadingGenerationBusyError || taskStarted) throw error;
  throw new DailyReadingLockBackendError(
   error instanceof Error ? error.message : "Navigator lock unavailable.",
  );
 }
}

export async function withDailyReadingGenerationLock<Result>(task: () => Promise<Result>) {
 if (typeof navigator !== "undefined" && navigator.locks !== undefined) {
  try {
   return await withNavigatorLock(task);
  } catch (error) {
   if (!(error instanceof DailyReadingLockBackendError)) throw error;
  }
 }
 if (typeof window !== "undefined" && window.indexedDB !== undefined) {
  try {
   return await withIndexedDbLease(task);
  } catch (error) {
   if (!(error instanceof DailyReadingLockBackendError)) throw error;
  }
 }
 if (typeof window !== "undefined") return withLocalStorageLease(task);
 return task();
}
