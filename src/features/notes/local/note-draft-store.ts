"use client";

import type { DbNote } from "@/types/database";
import { JsonObjectSchema, type JsonObject } from "@/types/json";
import { z } from "zod";
import { logger } from "@/lib/logger";

const DB_NAME = "notes-local-db";
const DB_VERSION = 1;
const DRAFTS_STORE = "note_drafts";
const draftTabIdSchema = z.uuid();

export const NoteDraftRecordSchema = z.object({
 key: z.string().min(1),
 userId: z.string().min(1),
 noteId: z.string().min(1),
 tabId: draftTabIdSchema.optional(),
 recoverySources: z
  .array(z.object({ key: z.string().min(1), updatedAt: z.number().int().nonnegative() }))
  .optional(),
 baseRevision: z.number().int().nonnegative().optional(),
 content: JsonObjectSchema.nullable(),
 readingContent: JsonObjectSchema.nullable().optional(),
 contentUpdatedAt: z.number().int().nonnegative().optional(),
 readingContentUpdatedAt: z.number().int().nonnegative().optional(),
 updatedAt: z.number().int().nonnegative(),
});

export type NoteDraftRecord = z.infer<typeof NoteDraftRecordSchema>;

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

let dbPromise: Nullable<Promise<IDBDatabase>> = null;
let tabIdPromise: Nullable<Promise<string>> = null;
// The document keeps its identity lease until it closes. A duplicated tab may
// inherit sessionStorage, but cannot acquire the original document's lease.
const tabLease = new Promise<void>(() => {});

function getDraftTabId(): Promise<string> {
 if (tabIdPromise) return tabIdPromise;
 tabIdPromise = new Promise((resolve, reject) => {
  const stored = draftTabIdSchema.safeParse(sessionStorage.getItem("notes-draft-tab-id"));
  const candidate = stored.success ? stored.data : crypto.randomUUID();
  if (typeof navigator !== "undefined" && navigator.locks) {
   void navigator.locks
    .request(`notes-draft-tab:${candidate}`, { ifAvailable: true }, (lock) => {
     if (lock) {
      sessionStorage.setItem("notes-draft-tab-id", candidate);
      resolve(candidate);
      return tabLease;
     }
     const replacement = crypto.randomUUID();
     return navigator.locks.request(`notes-draft-tab:${replacement}`, () => {
      sessionStorage.setItem("notes-draft-tab-id", replacement);
      resolve(replacement);
      return tabLease;
     });
    })
    .catch(reject);
  } else {
   // Without identity leases, use a fresh identity and offer prior drafts for
   // explicit recovery rather than risking two documents sharing one key.
   const fresh = crypto.randomUUID();
   sessionStorage.setItem("notes-draft-tab-id", fresh);
   resolve(fresh);
  }
 });
 return tabIdPromise;
}

async function createDraftKey(userId: string, noteId: string): Promise<string> {
 return `${userId}:${noteId}:${await getDraftTabId()}`;
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
  baseRevision: DbNote["revision"];
  content: JsonObject;
  readingContent?: Nullable<JsonObject>;
  contentUpdatedAt?: number;
  readingContentUpdatedAt?: number;
 },
): Promise<boolean> {
 if (!userId || !noteId) return false;

 try {
  const key = await createDraftKey(userId, noteId);
  const tabId = await getDraftTabId();
  const db = await openNotesDraftDb();
  return new Promise((resolve) => {
   const tx = db.transaction(DRAFTS_STORE, "readwrite");
   tx.oncomplete = () => resolve(true);
   tx.onabort = () => resolve(false);
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
     tabId,
     recoverySources: current?.recoverySources,
     baseRevision: current ? current.baseRevision : draft.baseRevision,
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

export async function advanceNoteDraftRevision(
 userId: string,
 noteId: string,
 expectedRevision: NoteDraftRecord["baseRevision"],
 acknowledgedRevision: DbNote["revision"],
): Promise<boolean> {
 const key = await createDraftKey(userId, noteId);
 const db = await openNotesDraftDb();
 return new Promise((resolve, reject) => {
  const tx = db.transaction(DRAFTS_STORE, "readwrite");
  const store = tx.objectStore(DRAFTS_STORE);
  const request = store.get(key);
  let advanced = false;
  request.onsuccess = () => {
   const parsed = NoteDraftRecordSchema.safeParse(request.result);
   if (!parsed.success || parsed.data.baseRevision !== expectedRevision) return;
   store.put({ ...parsed.data, baseRevision: acknowledgedRevision });
   advanced = true;
  };
  tx.oncomplete = () => resolve(advanced);
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
 });
}

function deleteAcknowledgedRecoverySources(store: IDBObjectStore, draft: NoteDraftRecord): void {
 for (const source of draft.recoverySources ?? []) {
  const request = store.get(source.key);
  request.onsuccess = () => {
   const parsed = NoteDraftRecordSchema.safeParse(request.result);
   if (
    parsed.success &&
    parsed.data.userId === draft.userId &&
    parsed.data.noteId === draft.noteId &&
    parsed.data.updatedAt === source.updatedAt
   )
    store.delete(source.key);
  };
 }
}

export async function clearNoteContentDraft(
 userId: string,
 noteId: string,
 ifUpdatedAtOrOlder: number,
 acknowledgedContent: NoteDraftRecord["content"],
): Promise<boolean> {
 if (!userId || !noteId) return false;

 try {
  const key = await createDraftKey(userId, noteId);
  const db = await openNotesDraftDb();
  return new Promise((resolve) => {
   const tx = db.transaction(DRAFTS_STORE, "readwrite");
   tx.oncomplete = () => resolve(true);
   tx.onabort = () => resolve(false);
   const store = tx.objectStore(DRAFTS_STORE);
   const request = store.get(key);

   request.onsuccess = () => {
    if (!request.result) {
     return;
    }
    const parsed = NoteDraftRecordSchema.safeParse(request.result);
    if (!parsed.success) {
     store.delete(key);
     return;
    }
    const contentUpdatedAt = parsed.data.contentUpdatedAt ?? parsed.data.updatedAt;
    if (
     contentUpdatedAt > ifUpdatedAtOrOlder ||
     JSON.stringify(parsed.data.content) !== JSON.stringify(acknowledgedContent)
    ) {
     resolve(false);
     return;
    }

    if (parsed.data.readingContent === undefined) {
     deleteAcknowledgedRecoverySources(store, parsed.data);
     store.delete(key);
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
 acknowledgedContent: NoteDraftRecord["readingContent"],
): Promise<boolean> {
 if (!userId || !noteId) return false;

 try {
  const key = await createDraftKey(userId, noteId);
  const db = await openNotesDraftDb();
  return new Promise((resolve) => {
   const tx = db.transaction(DRAFTS_STORE, "readwrite");
   tx.oncomplete = () => resolve(true);
   tx.onabort = () => resolve(false);
   const store = tx.objectStore(DRAFTS_STORE);
   const request = store.get(key);

   request.onsuccess = () => {
    if (!request.result) {
     return;
    }
    const parsed = NoteDraftRecordSchema.safeParse(request.result);
    if (!parsed.success) {
     store.delete(key);
     return;
    }
    const readingUpdatedAt = parsed.data.readingContentUpdatedAt ?? parsed.data.updatedAt;
    if (
     readingUpdatedAt > ifUpdatedAtOrOlder ||
     JSON.stringify(parsed.data.readingContent) !== JSON.stringify(acknowledgedContent)
    ) {
     resolve(false);
     return;
    }

    if (parsed.data.content === null) {
     deleteAcknowledgedRecoverySources(store, parsed.data);
     store.delete(key);
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

 try {
  const key = await createDraftKey(userId, noteId);
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

export async function getOtherNoteDrafts(
 userId: string,
 noteId: string,
): Promise<NoteDraftRecord[]> {
 const key = await createDraftKey(userId, noteId);
 const db = await openNotesDraftDb();
 return new Promise((resolve, reject) => {
  const tx = db.transaction(DRAFTS_STORE, "readonly");
  const request = tx.objectStore(DRAFTS_STORE).index("noteId").getAll(noteId);
  request.onsuccess = () => {
   const rows = z.array(NoteDraftRecordSchema).safeParse(request.result);
   if (!rows.success) {
    reject(rows.error);
    return;
   }
   resolve(
    rows.data
     .filter((draft) => draft.userId === userId && draft.noteId === noteId && draft.key !== key)
     .sort((a, b) => b.updatedAt - a.updatedAt),
   );
  };
  request.onerror = () => reject(request.error);
 });
}

export async function recoverNoteDraft(
 userId: string,
 noteId: string,
 source: NoteDraftRecord,
): Promise<boolean> {
 if (source.userId !== userId || source.noteId !== noteId) return false;
 const key = await createDraftKey(userId, noteId);
 const tabId = await getDraftTabId();
 const db = await openNotesDraftDb();
 return new Promise((resolve, reject) => {
  const tx = db.transaction(DRAFTS_STORE, "readwrite");
  const store = tx.objectStore(DRAFTS_STORE);
  let recovered = false;
  const request = store.get(source.key);
  request.onsuccess = () => {
   const current = NoteDraftRecordSchema.safeParse(request.result);
   if (
    !current.success ||
    current.data.userId !== userId ||
    current.data.noteId !== noteId ||
    current.data.updatedAt !== source.updatedAt
   )
    return;
   const destination = store.get(key);
   destination.onsuccess = () => {
    if (destination.result) return;
    store.put({
     ...current.data,
     key,
     tabId,
     recoverySources: [
      ...(current.data.recoverySources ?? []),
      { key: source.key, updatedAt: source.updatedAt },
     ],
    });
    recovered = true;
   };
  };
  tx.oncomplete = () => resolve(recovered);
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
 });
}

export async function clearNoteDraft(
 userId: string,
 noteId: string,
 ifUpdatedAtOrOlder?: number,
): Promise<boolean> {
 if (!userId || !noteId) return false;

 try {
  const key = await createDraftKey(userId, noteId);
  const db = await openNotesDraftDb();
  return new Promise((resolve) => {
   const tx = db.transaction(DRAFTS_STORE, "readwrite");
   tx.oncomplete = () => resolve(true);
   tx.onabort = () => resolve(false);
   const store = tx.objectStore(DRAFTS_STORE);
   const req = store.get(key);

   req.onsuccess = () => {
    if (!req.result) {
     return;
    }
    const parsed = NoteDraftRecordSchema.safeParse(req.result);
    if (!parsed.success) {
     store.delete(key);
     return;
    }
    // Invariant: If draft was updated after this mutation was initiated, preserve it
    if (ifUpdatedAtOrOlder !== undefined && parsed.data.updatedAt > ifUpdatedAtOrOlder) {
     resolve(false);
     return;
    }
    deleteAcknowledgedRecoverySources(store, parsed.data);
    store.delete(key);
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
