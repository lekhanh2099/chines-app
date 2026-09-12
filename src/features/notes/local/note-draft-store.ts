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
 content: JsonObjectSchema.nullable(),
 readingContent: JsonObjectSchema.nullable().optional(),
 contentUpdatedAt: z.number().int().nonnegative().optional(),
 readingContentUpdatedAt: z.number().int().nonnegative().optional(),
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
  contentUpdatedAt?: number;
  readingContentUpdatedAt?: number;
 },
): Promise<boolean> {
 if (!userId || !noteId) return false;

 const key = createDraftKey(userId, noteId);

 try {
  const db = await openNotesDraftDb();
  return new Promise((resolve) => {
   const tx = db.transaction(DRAFTS_STORE, "readwrite");
   const store = tx.objectStore(DRAFTS_STORE);
   const getRequest = store.get(key);

   getRequest.onsuccess = () => {
    const parsedCurrent = NoteDraftRecordSchema.safeParse(getRequest.result);
    const current = parsedCurrent.success ? parsedCurrent.data : null;
    const now = Date.now();
    const updatesContent =
     draft.contentUpdatedAt !== undefined || draft.readingContentUpdatedAt === undefined;
    const updatesReading =
     draft.readingContentUpdatedAt !== undefined || draft.contentUpdatedAt === undefined;
    const contentUpdatedAt = updatesContent
     ? Math.max(
        draft.contentUpdatedAt ?? now,
        (current?.contentUpdatedAt ?? current?.updatedAt ?? 0) + 1,
       )
     : current?.contentUpdatedAt;
    const readingContentUpdatedAt = updatesReading
     ? Math.max(
        draft.readingContentUpdatedAt ?? now,
        (current?.readingContentUpdatedAt ?? current?.updatedAt ?? 0) + 1,
       )
     : current?.readingContentUpdatedAt;
    const record: NoteDraftRecord = {
     key,
     userId,
     noteId,
     content: updatesContent ? draft.content : (current?.content ?? null),
     readingContent: updatesReading ? draft.readingContent : current?.readingContent,
     contentUpdatedAt,
     readingContentUpdatedAt,
     updatedAt: Math.max(
      current?.updatedAt ?? 0,
      contentUpdatedAt ?? 0,
      readingContentUpdatedAt ?? 0,
     ),
    };
    const parsed = NoteDraftRecordSchema.safeParse(record);
    if (!parsed.success) {
     logger.error("[NoteDraftStore] Invalid draft record payload:", parsed.error);
     resolve(false);
     return;
    }

    const putRequest = store.put(parsed.data);
    putRequest.onerror = () => {
     logger.error("[NoteDraftStore] Failed to save draft:", putRequest.error);
     resolve(false);
    };
    putRequest.onsuccess = () => resolve(true);
   };
   getRequest.onerror = () => {
    logger.error("[NoteDraftStore] Failed to read current draft:", getRequest.error);
    resolve(false);
   };
   tx.onerror = () => resolve(false);
  });
 } catch (error) {
  logger.error("[NoteDraftStore] Exception saving draft:", error);
  return false;
 }
}

export async function clearNoteContentDraft(
 userId: string,
 noteId: string,
 ifUpdatedAtOrOlder: number,
): Promise<boolean> {
 if (!userId || !noteId) return false;

 const key = createDraftKey(userId, noteId);
 try {
  const db = await openNotesDraftDb();
  return new Promise((resolve) => {
   const tx = db.transaction(DRAFTS_STORE, "readwrite");
   const store = tx.objectStore(DRAFTS_STORE);
   const request = store.get(key);

   request.onsuccess = () => {
    if (!request.result) {
     resolve(true);
     return;
    }
    const parsed = NoteDraftRecordSchema.safeParse(request.result);
    if (!parsed.success) {
     store.delete(key);
     resolve(true);
     return;
    }
    const contentUpdatedAt = parsed.data.contentUpdatedAt ?? parsed.data.updatedAt;
    if (contentUpdatedAt > ifUpdatedAtOrOlder) {
     resolve(false);
     return;
    }

    if (parsed.data.readingContent === undefined) {
     store.delete(key);
     resolve(true);
     return;
    }

    const readingContentUpdatedAt = parsed.data.readingContentUpdatedAt ?? parsed.data.updatedAt;
    store.put({
     ...parsed.data,
     content: null,
     contentUpdatedAt: undefined,
     readingContentUpdatedAt,
     updatedAt: readingContentUpdatedAt,
    });
    resolve(true);
   };
   request.onerror = () => {
    logger.error("[NoteDraftStore] Error acknowledging content draft:", request.error);
    resolve(false);
   };
   tx.onerror = () => resolve(false);
  });
 } catch (error) {
  logger.error("[NoteDraftStore] Exception acknowledging content draft:", error);
  return false;
 }
}

export async function clearNoteReadingContentDraft(
 userId: string,
 noteId: string,
 ifUpdatedAtOrOlder: number,
): Promise<boolean> {
 if (!userId || !noteId) return false;

 const key = createDraftKey(userId, noteId);
 try {
  const db = await openNotesDraftDb();
  return new Promise((resolve) => {
   const tx = db.transaction(DRAFTS_STORE, "readwrite");
   const store = tx.objectStore(DRAFTS_STORE);
   const request = store.get(key);

   request.onsuccess = () => {
    if (!request.result) {
     resolve(true);
     return;
    }
    const parsed = NoteDraftRecordSchema.safeParse(request.result);
    if (!parsed.success) {
     store.delete(key);
     resolve(true);
     return;
    }
    const readingUpdatedAt = parsed.data.readingContentUpdatedAt ?? parsed.data.updatedAt;
    if (readingUpdatedAt > ifUpdatedAtOrOlder) {
     resolve(false);
     return;
    }

    if (parsed.data.content === null) {
     store.delete(key);
     resolve(true);
     return;
    }

    const contentUpdatedAt = parsed.data.contentUpdatedAt ?? parsed.data.updatedAt;
    store.put({
     ...parsed.data,
     readingContent: undefined,
     readingContentUpdatedAt: undefined,
     contentUpdatedAt,
     updatedAt: contentUpdatedAt,
    });
    resolve(true);
   };
   request.onerror = () => {
    logger.error("[NoteDraftStore] Error acknowledging reading draft:", request.error);
    resolve(false);
   };
   tx.onerror = () => resolve(false);
  });
 } catch (error) {
  logger.error("[NoteDraftStore] Exception acknowledging reading draft:", error);
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
