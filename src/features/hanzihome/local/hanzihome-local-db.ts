"use client";

import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

const DB_NAME = "hanzihome-local-db";
const DB_VERSION = 1;

export const HANZIHOME_LOCAL_STORES = {
 learningState: "learning_state",
 pendingMutations: "pending_mutations",
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

export async function getAllFromStore<T>(storeName: string, schema: z.ZodType<T>): Promise<T[]> {
 const db = await openHanziHomeLocalDb();

 return new Promise((resolve, reject) => {
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const request = store.getAll();

  request.onsuccess = () => {
   const parsed = schema.array().safeParse(request.result);
   resolve(parsed.success ? parsed.data : []);
  };
  request.onerror = () => reject(request.error);
 });
}
