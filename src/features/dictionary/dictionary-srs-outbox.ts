"use client";

import { z } from "zod";
import {
 deleteFromStoreIf,
 getAllFromStoreMatching,
 HANZIHOME_LOCAL_STORES,
 openHanziHomeLocalDb,
 readFromStore,
} from "@/features/hanzihome/local/hanzihome-local-db";
import { saveDictionarySrs, saveDictionarySrsSchema } from "./dictionary-srs-api";
import { DictionarySrsQueuedError } from "@/types/error";

const pendingSrsSchema = z.strictObject({
 id: z.string().min(1),
 type: z.literal("dictionary_srs.save"),
 ownerUserId: z.string().min(1),
 operationId: z.uuid(),
 createdAt: z.iso.datetime({ offset: true }),
 payload: saveDictionarySrsSchema,
});
type PendingSrsSave = z.output<typeof pendingSrsSchema>;
const inFlightByOwner = new Map<string, Promise<number>>();
const ownerWriteTails = new Map<string, Promise<void>>();

async function withSrsOwnerLock<T>(ownerUserId: string, operation: () => Promise<T>): Promise<T> {
 if (typeof navigator !== "undefined" && navigator.locks) {
  return navigator.locks.request(`dictionary-srs:${ownerUserId}`, operation);
 }
 const previous = ownerWriteTails.get(ownerUserId) ?? Promise.resolve();
 const next = previous.then(operation, operation);
 const tail = next.then(
  () => {},
  () => {},
 );
 ownerWriteTails.set(ownerUserId, tail);
 try {
  return await next;
 } finally {
  if (ownerWriteTails.get(ownerUserId) === tail) ownerWriteTails.delete(ownerUserId);
 }
}

export async function listPendingDictionarySrs(ownerUserId: string): Promise<PendingSrsSave[]> {
 const pending = await getAllFromStoreMatching(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  pendingSrsSchema,
 );
 return pending
  .filter((item) => item.ownerUserId === ownerUserId)
  .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function acknowledge(item: PendingSrsSave) {
 return deleteFromStoreIf(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  item.id,
  pendingSrsSchema,
  (current) => current.ownerUserId === item.ownerUserId && current.operationId === item.operationId,
 );
}

export async function saveDictionarySrsDurably(
 input: Parameters<typeof saveDictionarySrs>[0],
 ownerUserId: string,
) {
 const payload = saveDictionarySrsSchema.parse(input);
 const item: PendingSrsSave = {
  id: `dictionary_srs:${ownerUserId}:${payload.hanzi}`,
  type: "dictionary_srs.save",
  ownerUserId,
  operationId: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  payload,
 };
 const db = await openHanziHomeLocalDb();
 const persisted = await new Promise<PendingSrsSave>((resolve, reject) => {
  const tx = db.transaction(HANZIHOME_LOCAL_STORES.pendingMutations, "readwrite");
  const store = tx.objectStore(HANZIHOME_LOCAL_STORES.pendingMutations);
  const request = store.get(item.id);
  let merged = item;
  request.onsuccess = () => {
   const previous = pendingSrsSchema.safeParse(request.result);
   if (previous.success && previous.data.ownerUserId === ownerUserId) {
    merged = {
     ...item,
     payload: {
      hanzi: payload.hanzi,
      contextSentence: payload.contextSentence ?? previous.data.payload.contextSentence,
      contextTranslation: payload.contextTranslation ?? previous.data.payload.contextTranslation,
      personalNote: payload.personalNote ?? previous.data.payload.personalNote,
      personalNoteMode: payload.personalNoteMode ?? previous.data.payload.personalNoteMode,
     },
    };
   }
   store.put(merged);
  };
  tx.oncomplete = () => resolve(merged);
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
 });
 if (typeof navigator !== "undefined" && !navigator.onLine) throw new DictionarySrsQueuedError();
 return withSrsOwnerLock(ownerUserId, async () => {
  const current = await readFromStore(
   HANZIHOME_LOCAL_STORES.pendingMutations,
   item.id,
   pendingSrsSchema,
  );
  if (current?.operationId !== item.operationId) throw new DictionarySrsQueuedError();
  const result = await saveDictionarySrs(persisted.payload, ownerUserId);
  await acknowledge(item);
  return result;
 });
}

export function syncPendingDictionarySrs(ownerUserId: string): Promise<number> {
 const current = inFlightByOwner.get(ownerUserId);
 if (current) return current;
 const next = withSrsOwnerLock(ownerUserId, async () => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return 0;
  let synced = 0;
  for (const item of await listPendingDictionarySrs(ownerUserId)) {
   try {
    const current = await readFromStore(
     HANZIHOME_LOCAL_STORES.pendingMutations,
     item.id,
     pendingSrsSchema,
    );
    if (current?.operationId !== item.operationId) continue;
    await saveDictionarySrs(item.payload, ownerUserId);
    if (await acknowledge(item)) synced += 1;
   } catch {
    // Auth/schema/conflict failures retain intent and stop this drain.
    break;
   }
  }
  return synced;
 }).finally(() => {
  if (inFlightByOwner.get(ownerUserId) === next) inFlightByOwner.delete(ownerUserId);
 });
 inFlightByOwner.set(ownerUserId, next);
 return next;
}
