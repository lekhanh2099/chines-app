"use client";

import { z } from "zod";

import {
 deleteFromStore,
 deleteFromStoreIf,
 getAllFromStoreMatching,
 HANZIHOME_LOCAL_STORES,
 putInStore,
 readFromStore,
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
  annotationId: z.string().min(1),
  documentId: z.string().min(1),
  noteText: z.string(),
  expectedRevision: z.number().int().nonnegative(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  attemptCount: z.number().int().nonnegative(),
  lastError: z.string().optional(),
 }),
 z.object({
  id: z.string().min(1),
  type: z.literal("reader_annotation.delete"),
  status: z.enum(["pending", "syncing", "failed"]),
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

export async function getLocalReaderAnnotations(
 documentId: string,
): Promise<ReaderAnnotationRow[]> {
 try {
  const all = await getAllFromStoreMatching(
   HANZIHOME_LOCAL_STORES.readerAnnotations,
   readerAnnotationRowSchema,
  );
  return all
   .filter(
    (item) =>
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
): Promise<ReaderAnnotationRow | null> {
 try {
  return await readFromStore(
   HANZIHOME_LOCAL_STORES.readerAnnotations,
   annotationId,
   readerAnnotationRowSchema,
  );
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
  await putInStore(HANZIHOME_LOCAL_STORES.pendingMutations, mutation);
 } catch {
  // Non-fatal
 }
}

export async function getPendingAnnotationMutations(): Promise<PendingAnnotationMutation[]> {
 try {
  const all = await getAllFromStoreMatching(
   HANZIHOME_LOCAL_STORES.pendingMutations,
   pendingAnnotationMutationSchema,
  );
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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

export async function cancelPendingMutationsForAnnotation(annotationId: string): Promise<void> {
 try {
  await deleteFromStoreIf(
   HANZIHOME_LOCAL_STORES.pendingMutations,
   `reader_annotation:create:${annotationId}`,
   pendingAnnotationMutationSchema,
   () => true,
  );
 } catch {
  // Non-fatal
 }
}
