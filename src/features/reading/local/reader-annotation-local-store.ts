"use client";

import { z } from "zod";

import {
 deleteFromStore,
 deleteFromStoreIf,
 getAllFromStoreMatching,
 HANZIHOME_LOCAL_STORES,
 promisifyRequest,
 putInStore,
 readFromStore,
 replaceInStoreIf,
 runInLocalTransaction,
} from "@/features/hanzihome/local/hanzihome-local-db";
import {
 readerAnnotationRowSchema,
 type ReaderAnnotationRow,
} from "@/features/reading/model/reading-annotation.schemas";

export const pendingAnnotationMutationSchema = z.discriminatedUnion("type", [
 z.object({
  id: z.string().min(1),
  type: z.literal("reader_annotation.create"),
  status: z.enum(["pending", "syncing", "failed"]),
  userId: z.string().min(1),
  tempId: z.string().min(1),
  documentId: z.string().min(1),
  annotation: readerAnnotationRowSchema,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  attemptCount: z.number().int().nonnegative(),
  lastError: z.string().optional(),
 }),
 z.object({
  id: z.string().min(1),
  type: z.literal("reader_annotation.update"),
  status: z.enum(["pending", "syncing", "failed"]),
  userId: z.string().min(1),
  annotationId: z.string().min(1),
  documentId: z.string().min(1),
  noteText: z.string(),
  expectedRevision: z.number().int().nonnegative(),
  annotation: readerAnnotationRowSchema.optional(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  attemptCount: z.number().int().nonnegative(),
  lastError: z.string().optional(),
 }),
 z.object({
  id: z.string().min(1),
  type: z.literal("reader_annotation.delete"),
  status: z.enum(["pending", "syncing", "failed"]),
  userId: z.string().min(1),
  annotationId: z.string().min(1),
  documentId: z.string().min(1),
  expectedRevision: z.number().int().nonnegative(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  attemptCount: z.number().int().nonnegative(),
  lastError: z.string().optional(),
 }),
]);

export type PendingAnnotationMutation = z.output<typeof pendingAnnotationMutationSchema>;

type PendingAnnotationCreateMutation = Extract<
 PendingAnnotationMutation,
 { type: "reader_annotation.create" }
>;
type PendingAnnotationUpdateMutation = Extract<
 PendingAnnotationMutation,
 { type: "reader_annotation.update" }
>;
type PendingAnnotationDeleteMutation = Extract<
 PendingAnnotationMutation,
 { type: "reader_annotation.delete" }
>;

export type ReaderAnnotationCreateAcknowledgement = {
 applied: boolean;
 localAnnotation: ReaderAnnotationRow | null;
};

function annotationMutationId(type: string, annotationId: string): string {
 return `reader_annotation:${type}:${annotationId}`;
}

function isSameMutationGeneration(
 current: PendingAnnotationMutation,
 expected: PendingAnnotationMutation,
): boolean {
 return (
  current.id === expected.id &&
  current.type === expected.type &&
  current.userId === expected.userId &&
  current.updatedAt === expected.updatedAt
 );
}

function nextMutationUpdatedAt(previousUpdatedAt?: string): string {
 const now = Date.now();
 const previous = previousUpdatedAt ? new Date(previousUpdatedAt).getTime() : 0;
 return new Date(Math.max(now, Number.isFinite(previous) ? previous + 1 : now)).toISOString();
}

export async function getLocalReaderAnnotations(
 userId: string | null | undefined,
 documentId: string,
): Promise<ReaderAnnotationRow[]> {
 if (!userId || !documentId) return [];
 try {
  const all = await getAllFromStoreMatching(
   HANZIHOME_LOCAL_STORES.readerAnnotations,
   readerAnnotationRowSchema,
  );
  return all
   .filter(
    (item) =>
     item.user_id === userId &&
     item.document_id === documentId &&
     item.deleted_at === null &&
     item.start_offset !== null &&
     item.end_offset !== null,
   )
   .sort((a, b) => (a.start_offset ?? 0) - (b.start_offset ?? 0));
 } catch {
  return [];
 }
}

export async function getLocalReaderAnnotationById(
 annotationId: string,
 userId?: string,
): Promise<ReaderAnnotationRow | null> {
 try {
  const record = await readFromStore(
   HANZIHOME_LOCAL_STORES.readerAnnotations,
   annotationId,
   readerAnnotationRowSchema,
  );
  if (!record) return null;
  if (userId && record.user_id !== userId) return null;
  return record;
 } catch {
  return null;
 }
}

export async function saveLocalReaderAnnotation(annotation: ReaderAnnotationRow): Promise<void> {
 try {
  await putInStore(HANZIHOME_LOCAL_STORES.readerAnnotations, annotation);
 } catch {
  // Non-fatal if IndexedDB is unavailable
 }
}

export async function saveLocalReaderAnnotations(
 annotations: readonly ReaderAnnotationRow[],
): Promise<void> {
 try {
  for (const annotation of annotations) {
   await putInStore(HANZIHOME_LOCAL_STORES.readerAnnotations, annotation);
  }
 } catch {
  // Non-fatal
 }
}

export async function deleteLocalReaderAnnotation(annotationId: string): Promise<void> {
 try {
  await deleteFromStore(HANZIHOME_LOCAL_STORES.readerAnnotations, annotationId);
 } catch {
  // Non-fatal
 }
}

export async function enqueuePendingAnnotationMutation(
 mutation: PendingAnnotationMutation,
): Promise<void> {
 try {
  await runInLocalTransaction(
   [HANZIHOME_LOCAL_STORES.pendingMutations],
   "readwrite",
   async (stores) => {
    const mutationStore = stores[HANZIHOME_LOCAL_STORES.pendingMutations];
    const rawExisting = await promisifyRequest(mutationStore.get(mutation.id));
    const parsedExisting = pendingAnnotationMutationSchema.safeParse(rawExisting);
    const existing =
     parsedExisting.success && parsedExisting.data.userId === mutation.userId
      ? parsedExisting.data
      : null;
    const persisted: PendingAnnotationMutation = {
     ...mutation,
     status: "pending",
     createdAt: existing?.createdAt ?? mutation.createdAt,
     updatedAt: existing ? nextMutationUpdatedAt(existing.updatedAt) : mutation.updatedAt,
     attemptCount: existing?.attemptCount ?? mutation.attemptCount,
     lastError: undefined,
    };
    mutationStore.put(persisted);
   },
  );
 } catch {
  // Non-fatal
 }
}

export async function getPendingAnnotationMutations(
 userId?: string,
): Promise<PendingAnnotationMutation[]> {
 try {
  const all = await getAllFromStoreMatching(
   HANZIHOME_LOCAL_STORES.pendingMutations,
   pendingAnnotationMutationSchema,
  );
  const filtered = userId ? all.filter((item) => item.userId === userId) : all;
  return filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
 } catch {
  return [];
 }
}

export async function removePendingAnnotationMutation(id: string): Promise<void> {
 try {
  await deleteFromStore(HANZIHOME_LOCAL_STORES.pendingMutations, id);
 } catch {
  // Non-fatal
 }
}

export async function markPendingAnnotationMutationSyncing(
 mutation: PendingAnnotationMutation,
): Promise<PendingAnnotationMutation | null> {
 try {
  return await replaceInStoreIf(
   HANZIHOME_LOCAL_STORES.pendingMutations,
   mutation.id,
   pendingAnnotationMutationSchema,
   (current) => isSameMutationGeneration(current, mutation),
   (current): PendingAnnotationMutation => ({
    ...current,
    status: "syncing",
    attemptCount: current.attemptCount + 1,
    updatedAt: nextMutationUpdatedAt(current.updatedAt),
    lastError: undefined,
   }),
  );
 } catch {
  return null;
 }
}

export async function markPendingAnnotationMutationFailed(
 mutation: PendingAnnotationMutation,
 error: string,
): Promise<PendingAnnotationMutation | null> {
 try {
  return await replaceInStoreIf(
   HANZIHOME_LOCAL_STORES.pendingMutations,
   mutation.id,
   pendingAnnotationMutationSchema,
   (current) => isSameMutationGeneration(current, mutation),
   (current): PendingAnnotationMutation => ({
    ...current,
    status: "failed",
    updatedAt: nextMutationUpdatedAt(current.updatedAt),
    lastError: error,
   }),
  );
 } catch {
  return null;
 }
}

async function reconcileCreateAcknowledgement(params: {
 mutation?: PendingAnnotationCreateMutation;
 tempId: string;
 ownerUserId: string;
 expectedLocalUpdatedAt?: string;
 canonical: ReaderAnnotationRow;
}): Promise<ReaderAnnotationCreateAcknowledgement> {
 const { mutation, tempId, ownerUserId, expectedLocalUpdatedAt, canonical } = params;

 try {
  return await runInLocalTransaction(
   [HANZIHOME_LOCAL_STORES.pendingMutations, HANZIHOME_LOCAL_STORES.readerAnnotations],
   "readwrite",
   async (stores) => {
    const mutationStore = stores[HANZIHOME_LOCAL_STORES.pendingMutations];
    const annotationStore = stores[HANZIHOME_LOCAL_STORES.readerAnnotations];

    if (mutation) {
     const rawCurrent = await promisifyRequest(mutationStore.get(mutation.id));
     const parsedCurrent = pendingAnnotationMutationSchema.safeParse(rawCurrent);
     if (
      !parsedCurrent.success ||
      parsedCurrent.data.type !== "reader_annotation.create" ||
      !isSameMutationGeneration(parsedCurrent.data, mutation)
     ) {
      return { applied: false, localAnnotation: null };
     }
     mutationStore.delete(mutation.id);
    } else {
     const rawLocal = await promisifyRequest(annotationStore.get(tempId));
     const parsedLocal = readerAnnotationRowSchema.safeParse(rawLocal);
     if (
      !parsedLocal.success ||
      parsedLocal.data.user_id !== ownerUserId ||
      parsedLocal.data.updated_at !== expectedLocalUpdatedAt
     ) {
      return { applied: false, localAnnotation: null };
     }
    }

    const deleteId = annotationMutationId("delete", tempId);
    const rawDelete = await promisifyRequest(mutationStore.get(deleteId));
    const parsedDelete = pendingAnnotationMutationSchema.safeParse(rawDelete);
    if (
     parsedDelete.success &&
     parsedDelete.data.type === "reader_annotation.delete" &&
     parsedDelete.data.userId === ownerUserId &&
     parsedDelete.data.annotationId === tempId
    ) {
     const pendingDelete: PendingAnnotationDeleteMutation = parsedDelete.data;
     const remappedDelete: PendingAnnotationDeleteMutation = {
      ...pendingDelete,
      id: annotationMutationId("delete", canonical.id),
      annotationId: canonical.id,
      expectedRevision: canonical.revision,
      status: "pending",
      updatedAt: nextMutationUpdatedAt(pendingDelete.updatedAt),
      lastError: undefined,
     };
     mutationStore.delete(deleteId);
     mutationStore.put(remappedDelete);
     annotationStore.delete(tempId);
     return { applied: true, localAnnotation: null };
    }

    const updateId = annotationMutationId("update", tempId);
    const rawUpdate = await promisifyRequest(mutationStore.get(updateId));
    const parsedUpdate = pendingAnnotationMutationSchema.safeParse(rawUpdate);
    if (
     parsedUpdate.success &&
     parsedUpdate.data.type === "reader_annotation.update" &&
     parsedUpdate.data.userId === ownerUserId &&
     parsedUpdate.data.annotationId === tempId
    ) {
     const pendingUpdate: PendingAnnotationUpdateMutation = parsedUpdate.data;
     const optimisticUpdate: ReaderAnnotationRow = {
      ...canonical,
      note_text: pendingUpdate.noteText,
      updated_at: nextMutationUpdatedAt(canonical.updated_at),
     };
     const remappedUpdate: PendingAnnotationUpdateMutation = {
      ...pendingUpdate,
      id: annotationMutationId("update", canonical.id),
      annotationId: canonical.id,
      expectedRevision: canonical.revision,
      annotation: optimisticUpdate,
      status: "pending",
      updatedAt: nextMutationUpdatedAt(pendingUpdate.updatedAt),
      lastError: undefined,
     };
     mutationStore.delete(updateId);
     mutationStore.put(remappedUpdate);
     annotationStore.delete(tempId);
     annotationStore.put(optimisticUpdate);
     return { applied: true, localAnnotation: optimisticUpdate };
    }

    annotationStore.delete(tempId);
    annotationStore.put(canonical);
    return { applied: true, localAnnotation: canonical };
   },
  );
 } catch {
  return { applied: false, localAnnotation: null };
 }
}

export function acknowledgePendingAnnotationCreate(
 mutation: PendingAnnotationCreateMutation,
 canonical: ReaderAnnotationRow,
): Promise<ReaderAnnotationCreateAcknowledgement> {
 return reconcileCreateAcknowledgement({
  mutation,
  tempId: mutation.tempId,
  ownerUserId: mutation.userId,
  canonical,
 });
}

export function acknowledgeLocalReaderAnnotationCreate(params: {
 tempId: string;
 ownerUserId: string;
 expectedLocalUpdatedAt: string;
 canonical: ReaderAnnotationRow;
}): Promise<ReaderAnnotationCreateAcknowledgement> {
 return reconcileCreateAcknowledgement(params);
}

export async function acknowledgePendingAnnotationUpdate(
 mutation: PendingAnnotationUpdateMutation,
 canonical: ReaderAnnotationRow,
): Promise<boolean> {
 try {
  return await runInLocalTransaction(
   [HANZIHOME_LOCAL_STORES.pendingMutations, HANZIHOME_LOCAL_STORES.readerAnnotations],
   "readwrite",
   async (stores) => {
    const mutationStore = stores[HANZIHOME_LOCAL_STORES.pendingMutations];
    const annotationStore = stores[HANZIHOME_LOCAL_STORES.readerAnnotations];
    const rawCurrent = await promisifyRequest(mutationStore.get(mutation.id));
    const parsedCurrent = pendingAnnotationMutationSchema.safeParse(rawCurrent);
    if (
     !parsedCurrent.success ||
     parsedCurrent.data.type !== "reader_annotation.update" ||
     !isSameMutationGeneration(parsedCurrent.data, mutation)
    ) {
     return false;
    }
    mutationStore.delete(mutation.id);
    annotationStore.put(canonical);
    return true;
   },
  );
 } catch {
  return false;
 }
}

export async function acknowledgePendingAnnotationDelete(
 mutation: PendingAnnotationDeleteMutation,
): Promise<boolean> {
 try {
  return await deleteFromStoreIf(
   HANZIHOME_LOCAL_STORES.pendingMutations,
   mutation.id,
   pendingAnnotationMutationSchema,
   (current) => isSameMutationGeneration(current, mutation),
  );
 } catch {
  return false;
 }
}

export async function saveLocalReaderAnnotationIfCurrent(
 annotation: ReaderAnnotationRow,
 expectedUpdatedAt: string,
): Promise<boolean> {
 try {
  const saved = await replaceInStoreIf(
   HANZIHOME_LOCAL_STORES.readerAnnotations,
   annotation.id,
   readerAnnotationRowSchema,
   (current) => current.user_id === annotation.user_id && current.updated_at === expectedUpdatedAt,
   () => annotation,
  );
  return saved !== null;
 } catch {
  return false;
 }
}

export async function cancelPendingMutationsForAnnotation(
 annotationId: string,
 userId?: string,
): Promise<{ hadPendingCreate: boolean; pendingCreateIsSyncing: boolean }> {
 let hadPendingCreate = false;
 let pendingCreateIsSyncing = false;
 try {
  const createId = annotationMutationId("create", annotationId);
  const updateId = annotationMutationId("update", annotationId);
  const createItem = await readFromStore(
   HANZIHOME_LOCAL_STORES.pendingMutations,
   createId,
   pendingAnnotationMutationSchema,
  );
  if (createItem && (!userId || createItem.userId === userId)) {
   hadPendingCreate = true;
   pendingCreateIsSyncing = createItem.status === "syncing";
   if (!pendingCreateIsSyncing) {
    await deleteFromStore(HANZIHOME_LOCAL_STORES.pendingMutations, createId);
   }
  }
  await deleteFromStoreIf(
   HANZIHOME_LOCAL_STORES.pendingMutations,
   updateId,
   pendingAnnotationMutationSchema,
   (record) => !userId || record.userId === userId,
  );
 } catch {
  // Non-fatal
 }
 return { hadPendingCreate, pendingCreateIsSyncing };
}
