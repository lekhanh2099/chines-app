interface StoragePersistenceResult {
 supported: boolean;
 persisted: boolean;
}

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
