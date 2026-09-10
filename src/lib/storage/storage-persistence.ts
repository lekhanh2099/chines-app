export interface StoragePersistenceResult {
 supported: boolean;
 persisted: boolean;
}

export interface StorageQuotaEstimate {
 supported: boolean;
 usedBytes: number;
 quotaBytes: number;
 percentUsed: number;
 usedMB: number;
 quotaMB: number;
}

const BYTES_PER_MB = 1024 * 1024;

function getStorageManager(): StorageManager | undefined {
 if (typeof window === "undefined" || typeof navigator === "undefined") {
  return undefined;
 }
 return navigator.storage;
}

export async function requestStoragePersistence(): Promise<StoragePersistenceResult> {
 const storage = getStorageManager();
 if (!storage || !storage.persist) {
  return { supported: false, persisted: false };
 }

 try {
  const isAlreadyPersisted = await storage.persisted();
  if (isAlreadyPersisted) {
   return { supported: true, persisted: true };
  }

  const granted = await storage.persist();
  return { supported: true, persisted: granted };
 } catch {
  return { supported: true, persisted: false };
 }
}

export async function checkStoragePersistence(): Promise<StoragePersistenceResult> {
 const storage = getStorageManager();
 if (!storage || !storage.persisted) {
  return { supported: false, persisted: false };
 }

 try {
  const isPersisted = await storage.persisted();
  return { supported: true, persisted: isPersisted };
 } catch {
  return { supported: true, persisted: false };
 }
}

export async function getStorageQuotaEstimate(): Promise<StorageQuotaEstimate> {
 const fallback: StorageQuotaEstimate = {
  supported: false,
  usedBytes: 0,
  quotaBytes: 0,
  percentUsed: 0,
  usedMB: 0,
  quotaMB: 0,
 };

 const storage = getStorageManager();
 if (!storage || !storage.estimate) {
  return fallback;
 }

 try {
  const estimate = await storage.estimate();
  const usedBytes = estimate.usage ?? 0;
  const quotaBytes = estimate.quota ?? 0;
  const percentUsed =
   quotaBytes > 0 ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : 0;
  const usedMB = Math.round((usedBytes / BYTES_PER_MB) * 10) / 10;
  const quotaMB = Math.round((quotaBytes / BYTES_PER_MB) * 10) / 10;

  return {
   supported: true,
   usedBytes,
   quotaBytes,
   percentUsed,
   usedMB,
   quotaMB,
  };
 } catch {
  return fallback;
 }
}
