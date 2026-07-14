"use client";

const DB_NAME = "hanzihome-local-db";
const DB_VERSION = 1;

export const HANZIHOME_LOCAL_STORES = {
 learningState: "learning_state",
 pendingMutations: "pending_mutations",
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function createStores(db: IDBDatabase) {
 if (!db.objectStoreNames.contains(HANZIHOME_LOCAL_STORES.learningState)) {
  db.createObjectStore(HANZIHOME_LOCAL_STORES.learningState, { keyPath: "id" });
 }

 if (!db.objectStoreNames.contains(HANZIHOME_LOCAL_STORES.pendingMutations)) {
  const store = db.createObjectStore(HANZIHOME_LOCAL_STORES.pendingMutations, { keyPath: "id" });
  store.createIndex("type", "type");
  store.createIndex("status", "status");
  store.createIndex("createdAt", "createdAt");
 }
}

export function openHanziHomeLocalDb(): Promise<IDBDatabase> {
 if (typeof indexedDB === "undefined") {
  return Promise.reject(new Error("IndexedDB is not available in this environment."));
 }

 if (dbPromise) return dbPromise;

 dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
   createStores(request.result);
  };

  request.onsuccess = () => {
   const db = request.result;
   db.onversionchange = () => {
    db.close();
    dbPromise = null;
   };
   resolve(db);
  };

  request.onerror = () => {
   dbPromise = null;
   reject(request.error ?? new Error("Could not open HanziHome local database."));
  };

  request.onblocked = () => {
   dbPromise = null;
   reject(new Error("HanziHome local database upgrade was blocked by another tab."));
  };
 });

 return dbPromise;
}

export async function readFromStore<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
 const db = await openHanziHomeLocalDb();

 return new Promise((resolve, reject) => {
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const request = store.get(key);

  request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
  request.onerror = () => reject(request.error);
 });
}

export async function putInStore(storeName: string, value: unknown): Promise<void> {
 const db = await openHanziHomeLocalDb();

 return new Promise((resolve, reject) => {
  const tx = db.transaction(storeName, "readwrite");
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
  tx.objectStore(storeName).put(value);
 });
}

export async function deleteFromStore(storeName: string, key: IDBValidKey): Promise<void> {
 const db = await openHanziHomeLocalDb();

 return new Promise((resolve, reject) => {
  const tx = db.transaction(storeName, "readwrite");
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
  tx.objectStore(storeName).delete(key);
 });
}

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
 const db = await openHanziHomeLocalDb();

 return new Promise((resolve, reject) => {
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const request = store.getAll();

  request.onsuccess = () => resolve(request.result as T[]);
  request.onerror = () => reject(request.error);
 });
}
