"use client";

import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

const DB_NAME = "hanzihome-local-db";
const DB_VERSION = 3;

export const HANZIHOME_LOCAL_STORES = {
 learningState: "learning_state",
 pendingMutations: "pending_mutations",
 contentCache: "content_cache",
 readerAnnotations: "reader_annotations",
};

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

let dbPromise: Nullable<Promise<IDBDatabase>> = null;

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

 if (!db.objectStoreNames.contains(HANZIHOME_LOCAL_STORES.contentCache)) {
  const store = db.createObjectStore(HANZIHOME_LOCAL_STORES.contentCache, { keyPath: "key" });
  store.createIndex("ownerId", "ownerId");
  store.createIndex("resourceType", "resourceType");
  store.createIndex("lastAccessedAt", "lastAccessedAt");
 }

 if (!db.objectStoreNames.contains(HANZIHOME_LOCAL_STORES.readerAnnotations)) {
  const store = db.createObjectStore(HANZIHOME_LOCAL_STORES.readerAnnotations, { keyPath: "id" });
  store.createIndex("documentId", "document_id");
  store.createIndex("updatedAt", "updated_at");
 }
}

export function closeHanziHomeLocalDb(): void {
 if (dbPromise) {
  dbPromise.then((db) => db.close()).catch(() => {});
  dbPromise = null;
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

export async function readFromStore<T>(
 storeName: string,
 key: IDBValidKey,
 schema: z.ZodType<T>,
): Promise<Nullable<T>> {
 const db = await openHanziHomeLocalDb();

 return new Promise((resolve, reject) => {
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const request = store.get(key);

  request.onsuccess = () => {
   const parsed = schema.safeParse(request.result);
   resolve(parsed.success ? parsed.data : null);
  };
  request.onerror = () => reject(request.error);
 });
}

export async function putInStore(storeName: string, value: JsonFieldValue): Promise<void> {
 const db = await openHanziHomeLocalDb();

 return new Promise((resolve, reject) => {
  const tx = db.transaction(storeName, "readwrite");
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
  tx.objectStore(storeName).put(value);
 });
}

export async function replaceInStoreIf<T>(
 storeName: string,
 key: IDBValidKey,
 schema: z.ZodType<T>,
 matches: (value: T) => boolean,
 replace: (value: T) => T,
): Promise<T | null> {
 const db = await openHanziHomeLocalDb();

 return new Promise((resolve, reject) => {
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  const request = store.get(key);
  let replacement: T | null = null;

  request.onsuccess = () => {
   const parsed = schema.safeParse(request.result);
   if (!parsed.success || !matches(parsed.data)) return;
   replacement = replace(parsed.data);
   store.put(replacement);
  };
  request.onerror = () => reject(request.error);
  tx.oncomplete = () => resolve(replacement);
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
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

export async function deleteFromStoreIf<T>(
 storeName: string,
 key: IDBValidKey,
 schema: z.ZodType<T>,
 matches: (value: T) => boolean,
): Promise<boolean> {
 const db = await openHanziHomeLocalDb();

 return new Promise((resolve, reject) => {
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  const request = store.get(key);
  let deleted = false;

  request.onsuccess = () => {
   const parsed = schema.safeParse(request.result);
   if (!parsed.success || !matches(parsed.data)) return;
   deleted = true;
   store.delete(key);
  };
  request.onerror = () => reject(request.error);
  tx.oncomplete = () => resolve(deleted);
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
 });
}

export async function getAllFromStoreMatching<T>(
 storeName: string,
 schema: z.ZodType<T>,
): Promise<T[]> {
 const db = await openHanziHomeLocalDb();

 return new Promise((resolve, reject) => {
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const request = store.getAll();

  request.onsuccess = () => {
   const values: T[] = [];
   for (const value of request.result) {
    const parsed = schema.safeParse(value);
    if (parsed.success) values.push(parsed.data);
   }
   resolve(values);
  };
  request.onerror = () => reject(request.error);
 });
}

export function promisifyRequest<R>(request: IDBRequest<R>): Promise<R> {
 return new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
 });
}

export async function runInLocalTransaction<T>(
 storeNames: string[],
 mode: IDBTransactionMode,
 operation: (stores: Record<string, IDBObjectStore>, tx: IDBTransaction) => Promise<T> | T,
): Promise<T> {
 const db = await openHanziHomeLocalDb();

 return new Promise((resolve, reject) => {
  let result: T;
  let operationError: unknown = null;

  const tx = db.transaction(storeNames, mode);
  const stores: Record<string, IDBObjectStore> = {};
  for (const name of storeNames) {
   stores[name] = tx.objectStore(name);
  }

  tx.oncomplete = () => {
   if (operationError !== null) {
    reject(operationError);
   } else {
    resolve(result);
   }
  };

  tx.onerror = () => {
   reject(tx.error ?? operationError ?? new Error("IndexedDB transaction error"));
  };

  tx.onabort = () => {
   reject(tx.error ?? operationError ?? new Error("IndexedDB transaction aborted"));
  };

  Promise.resolve()
   .then(() => operation(stores, tx))
   .then((val) => {
    result = val;
   })
   .catch((err: unknown) => {
    operationError = err;
    try {
     tx.abort();
    } catch {
     // Transaction may have already been aborted or closed
    }
    reject(err);
   });
 });
}
