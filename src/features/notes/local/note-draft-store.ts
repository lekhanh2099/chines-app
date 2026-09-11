"use client";

import { JsonObjectSchema, type JsonObject } from "@/types/json";
import { z } from "zod";
import { logger } from "@/lib/logger";

const DB_NAME = "notes-local-db";
const DB_VERSION = 1;
const DRAFTS_STORE = "note_drafts";

export const NoteDraftRecordSchema = z.object({
 key: z.string().min(1),
 userId: z.string().min(1),
 noteId: z.string().min(1),
 content: JsonObjectSchema,
 readingContent: JsonObjectSchema.nullable().optional(),
 updatedAt: z.number().int().nonnegative(),
});

export type NoteDraftRecord = z.infer<typeof NoteDraftRecordSchema>;

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

let dbPromise: Nullable<Promise<IDBDatabase>> = null;

function createDraftKey(userId: string, noteId: string): string {
 return `${userId}:${noteId}`;
}

export function closeNotesDraftDb(): void {
 if (dbPromise) {
  dbPromise.then((db) => db.close()).catch(() => {});
  dbPromise = null;
 }
}

export function openNotesDraftDb(): Promise<IDBDatabase> {
 if (typeof indexedDB === "undefined") {
  return Promise.reject(new Error("IndexedDB is not available in this environment."));
 }

 if (dbPromise) return dbPromise;

 dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
   const db = request.result;
   if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
    const store = db.createObjectStore(DRAFTS_STORE, { keyPath: "key" });
    store.createIndex("userId", "userId");
    store.createIndex("noteId", "noteId");
    store.createIndex("updatedAt", "updatedAt");
   }
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
   reject(request.error ?? new Error("Could not open Notes local database."));
  };

  request.onblocked = () => {
   dbPromise = null;
   reject(new Error("Notes local database is blocked by another tab."));
  };
 });

 return dbPromise;
}

export async function saveNoteDraft(
 userId: string,
 noteId: string,
 draft: {
  content: JsonObject;
  readingContent?: Nullable<JsonObject>;
 },
): Promise<boolean> {
 if (!userId || !noteId) return false;

 const key = createDraftKey(userId, noteId);
 const record: NoteDraftRecord = {
  key,
  userId,
  noteId,
  content: draft.content,
  readingContent: draft.readingContent,
  updatedAt: Date.now(),
 };

 const parsed = NoteDraftRecordSchema.safeParse(record);
 if (!parsed.success) {
  logger.error("[NoteDraftStore] Invalid draft record payload:", parsed.error);
  return false;
 }

 try {
  const db = await openNotesDraftDb();
  return new Promise((resolve) => {
   const tx = db.transaction(DRAFTS_STORE, "readwrite");
   const store = tx.objectStore(DRAFTS_STORE);
   const req = store.put(parsed.data);

   req.onsuccess = () => resolve(true);
   req.onerror = () => {
    logger.error("[NoteDraftStore] Failed to save draft:", req.error);
    resolve(false);
   };
   tx.onerror = () => resolve(false);
  });
 } catch (error) {
  logger.error("[NoteDraftStore] Exception saving draft:", error);
  return false;
 }
}

export async function getNoteDraft(
 userId: string,
 noteId: string,
): Promise<Nullable<NoteDraftRecord>> {
 if (!userId || !noteId) return null;

 const key = createDraftKey(userId, noteId);
 try {
  const db = await openNotesDraftDb();
  return new Promise((resolve) => {
   const tx = db.transaction(DRAFTS_STORE, "readonly");
   const store = tx.objectStore(DRAFTS_STORE);
   const req = store.get(key);

   req.onsuccess = () => {
    if (!req.result) {
     resolve(null);
     return;
    }
    const parsed = NoteDraftRecordSchema.safeParse(req.result);
    if (!parsed.success) {
     logger.warn("[NoteDraftStore] Corrupted draft encountered, purging:", key);
     // Purge corrupted draft asynchronously
     void clearNoteDraft(userId, noteId);
     resolve(null);
     return;
    }
    resolve(parsed.data);
   };

   req.onerror = () => {
    logger.error("[NoteDraftStore] Error reading draft:", req.error);
    resolve(null);
   };
  });
 } catch (error) {
  logger.error("[NoteDraftStore] Exception reading draft:", error);
  return null;
 }
}

export async function clearNoteDraft(
 userId: string,
 noteId: string,
 ifUpdatedAtOrOlder?: number,
): Promise<boolean> {
 if (!userId || !noteId) return false;

 const key = createDraftKey(userId, noteId);
 try {
  const db = await openNotesDraftDb();
  return new Promise((resolve) => {
   const tx = db.transaction(DRAFTS_STORE, "readwrite");
   const store = tx.objectStore(DRAFTS_STORE);
   const req = store.get(key);

   req.onsuccess = () => {
    if (!req.result) {
     resolve(true);
     return;
    }
    const parsed = NoteDraftRecordSchema.safeParse(req.result);
    if (!parsed.success) {
     store.delete(key);
     resolve(true);
     return;
    }
    // Invariant: If draft was updated after this mutation was initiated, preserve it
    if (ifUpdatedAtOrOlder !== undefined && parsed.data.updatedAt > ifUpdatedAtOrOlder) {
     resolve(false);
     return;
    }
    store.delete(key);
    resolve(true);
   };

   req.onerror = () => {
    logger.error("[NoteDraftStore] Error deleting draft:", req.error);
    resolve(false);
   };
   tx.onerror = () => resolve(false);
  });
 } catch (error) {
  logger.error("[NoteDraftStore] Exception deleting draft:", error);
  return false;
 }
}
