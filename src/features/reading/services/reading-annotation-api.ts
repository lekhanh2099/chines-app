import { JsonObjectSchema } from "@/types/json";
import { z } from "zod";

import {
 readerAnnotationRowSchema,
 type ReaderAnnotationRow,
} from "@/features/reading/model/reading-annotation.schemas";
import {
 acknowledgeLocalReaderAnnotationCreate,
 acknowledgePendingAnnotationCreate,
 acknowledgePendingAnnotationDelete,
 acknowledgePendingAnnotationUpdate,
 cancelPendingMutationsForAnnotation,
 deleteLocalReaderAnnotation,
 enqueuePendingAnnotationMutation,
 getLocalReaderAnnotations,
 getPendingAnnotationMutations,
 markPendingAnnotationMutationFailed,
 markPendingAnnotationMutationSyncing,
 saveLocalReaderAnnotation,
 saveLocalReaderAnnotations,
 saveLocalReaderAnnotationIfCurrent,
} from "@/features/reading/local/reader-annotation-local-store";

const annotationFieldsSchema = z
 .strictObject({
  documentId: z.string().min(1),
  paragraphId: z.string().min(1).nullable(),
  assetId: z.string().min(1).nullable(),
  annotationType: z.enum(["highlight", "underline", "note", "ink"]),
  pageNumber: z.number().int().positive().nullable(),
  startOffset: z.number().int().nonnegative().nullable(),
  endOffset: z.number().int().positive().nullable(),
  selectedText: z.string(),
  noteText: z.string(),
  color: z.enum(["yellow", "green", "blue", "pink"]),
  payload: JsonObjectSchema,
 })
 .superRefine((value, context) => {
  if ((value.paragraphId === null) === (value.assetId === null)) {
   context.addIssue({
    code: "custom",
    path: ["paragraphId"],
    message: "Exactly one Reader annotation target is required.",
   });
  }
  if ((value.startOffset === null) !== (value.endOffset === null)) {
   context.addIssue({
    code: "custom",
    path: ["startOffset"],
    message: "Annotation range must be complete.",
   });
  }
 });

const createAnnotationResponseSchema = z.strictObject({ annotation: readerAnnotationRowSchema });
const listAnnotationResponseSchema = z.strictObject({
 annotations: z.array(readerAnnotationRowSchema),
});
const expectedAuthenticatedOwnerHeader = "X-HanziHome-Owner-Id";
const readerAnnotationSyncInFlightByOwner = new Map<string, Promise<ReaderAnnotationSyncResult>>();

export type ReaderAnnotationInput = z.output<typeof annotationFieldsSchema>;

export type ReaderAnnotationSyncResult = {
 syncedCount: number;
 errorCount: number;
 isOwnerMismatch?: boolean;
};

function ownerHeaders(ownerUserId: string) {
 return { [expectedAuthenticatedOwnerHeader]: ownerUserId };
}

function isBrowserOnline(): boolean {
 return typeof navigator === "undefined" || navigator.onLine;
}

function generateClientUuid(): string {
 if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
  return crypto.randomUUID();
 }
 return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
  const r = (Math.random() * 16) | 0;
  const v = c === "x" ? r : (r & 0x3) | 0x8;
  return v.toString(16);
 });
}

export async function fetchReaderAnnotations(
 userId: string | null | undefined,
 documentId: string,
): Promise<ReaderAnnotationRow[]> {
 if (!userId || !documentId) return [];

 const localAnnotations =
  typeof window !== "undefined" ? await getLocalReaderAnnotations(userId, documentId) : [];

 if (typeof navigator !== "undefined" && !navigator.onLine) {
  return localAnnotations;
 }

 try {
  const response = await fetch(
   `/api/reading/annotations?documentId=${encodeURIComponent(documentId)}`,
   { cache: "no-store", headers: ownerHeaders(userId) },
  );
  if (response.status === 401 || response.status === 403 || response.status === 412) {
   // A1 Security Invariant: Do NOT silently fallback to private data on auth errors
   return [];
  }
  if (!response.ok) return localAnnotations;

  const payload = await response.json().catch(() => null);
  const parsed = listAnnotationResponseSchema.safeParse(payload);
  if (!parsed.success) return localAnnotations;

  const serverAnnotations = parsed.data.annotations;

  if (typeof window !== "undefined") {
   const pending = await getPendingAnnotationMutations(userId);
   const pendingCreates: ReaderAnnotationRow[] = [];
   const pendingDeletes = new Set<string>();

   for (const mutation of pending) {
    if (mutation.type === "reader_annotation.create" && mutation.documentId === documentId) {
     pendingCreates.push(mutation.annotation);
    } else if (mutation.type === "reader_annotation.delete") {
     pendingDeletes.add(mutation.annotationId);
    }
   }

   const filteredServer = serverAnnotations.filter((item) => !pendingDeletes.has(item.id));
   const result = [...filteredServer, ...pendingCreates].sort(
    (a, b) => (a.start_offset ?? 0) - (b.start_offset ?? 0),
   );
   await saveLocalReaderAnnotations(result);
   return result;
  }

  return serverAnnotations;
 } catch {
  return localAnnotations;
 }
}

export async function createReaderAnnotation(
 input: ReaderAnnotationInput,
 userId: string,
): Promise<ReaderAnnotationRow> {
 if (!userId) {
  throw new Error("User ID is required to create a reader annotation");
 }
 const payload = annotationFieldsSchema.parse(input);
 const now = new Date().toISOString();
 const optimisticId = generateClientUuid();
 const optimistic: ReaderAnnotationRow = {
  id: optimisticId,
  user_id: userId,
  document_id: payload.documentId,
  paragraph_id: payload.paragraphId,
  asset_id: payload.assetId,
  annotation_type: payload.annotationType,
  page_number: payload.pageNumber,
  start_offset: payload.startOffset,
  end_offset: payload.endOffset,
  selected_text: payload.selectedText,
  note_text: payload.noteText,
  color: payload.color,
  payload: payload.payload,
  revision: 1,
  created_at: now,
  updated_at: now,
  deleted_at: null,
 };

 if (typeof window !== "undefined") {
  await saveLocalReaderAnnotation(optimistic);
 }

 if (typeof navigator !== "undefined" && !navigator.onLine) {
  if (typeof window !== "undefined") {
   await enqueuePendingAnnotationMutation({
    id: `reader_annotation:create:${optimisticId}`,
    type: "reader_annotation.create",
    status: "pending",
    userId,
    tempId: optimisticId,
    documentId: payload.documentId,
    annotation: optimistic,
    createdAt: now,
    updatedAt: now,
    attemptCount: 0,
   });
  }
  return optimistic;
 }

 try {
  const response = await fetch("/api/reading/annotations", {
   method: "POST",
   headers: { "Content-Type": "application/json", ...ownerHeaders(userId) },
   body: JSON.stringify(payload),
  });
  const value = await response.json().catch(() => null);
  if (!response.ok) {
   if (typeof window !== "undefined") {
    await enqueuePendingAnnotationMutation({
     id: `reader_annotation:create:${optimisticId}`,
     type: "reader_annotation.create",
     status: "pending",
     userId,
     tempId: optimisticId,
     documentId: payload.documentId,
     annotation: optimistic,
     createdAt: now,
     updatedAt: now,
     attemptCount: 0,
    });
   }
   return optimistic;
  }

  const parsed = createAnnotationResponseSchema.safeParse(value);
  if (!parsed.success) return optimistic;

  const canonical = parsed.data.annotation;
  if (typeof window !== "undefined") {
   const acknowledgement = await acknowledgeLocalReaderAnnotationCreate({
    tempId: optimisticId,
    ownerUserId: userId,
    expectedLocalUpdatedAt: optimistic.updated_at,
    canonical,
   });
   return acknowledgement.localAnnotation ?? optimistic;
  }
  return canonical;
 } catch {
  if (typeof window !== "undefined") {
   await enqueuePendingAnnotationMutation({
    id: `reader_annotation:create:${optimisticId}`,
    type: "reader_annotation.create",
    status: "pending",
    userId,
    tempId: optimisticId,
    documentId: payload.documentId,
    annotation: optimistic,
    createdAt: now,
    updatedAt: now,
    attemptCount: 0,
   });
  }
  return optimistic;
 }
}

export async function deleteReaderAnnotation(
 annotationId: string,
 expectedRevision: number,
 documentId = "",
 userId?: string,
): Promise<void> {
 if (!userId) {
  throw new Error("User ID is required to delete a reader annotation");
 }

 let hadPendingCreate = false;
 let pendingCreateIsSyncing = false;
 if (typeof window !== "undefined") {
  await deleteLocalReaderAnnotation(annotationId);
  const cancelResult = await cancelPendingMutationsForAnnotation(annotationId, userId);
  hadPendingCreate = cancelResult?.hadPendingCreate ?? false;
  pendingCreateIsSyncing = cancelResult?.pendingCreateIsSyncing ?? false;
 }

 // If the annotation only existed locally as an un-synced create mutation,
 // do not enqueue a delete mutation since it never reached the server.
 if (hadPendingCreate && !pendingCreateIsSyncing) {
  return;
 }

 if (pendingCreateIsSyncing && typeof window !== "undefined") {
  await enqueuePendingAnnotationMutation({
   id: `reader_annotation:delete:${annotationId}`,
   type: "reader_annotation.delete",
   status: "pending",
   userId,
   annotationId,
   documentId,
   expectedRevision,
   createdAt: new Date().toISOString(),
   updatedAt: new Date().toISOString(),
   attemptCount: 0,
  });
  return;
 }

 if (typeof navigator !== "undefined" && !navigator.onLine) {
  if (typeof window !== "undefined" && userId) {
   await enqueuePendingAnnotationMutation({
    id: `reader_annotation:delete:${annotationId}`,
    type: "reader_annotation.delete",
    status: "pending",
    userId,
    annotationId,
    documentId,
    expectedRevision,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attemptCount: 0,
   });
  }
  return;
 }

 try {
  const response = await fetch(`/api/reading/annotations/${encodeURIComponent(annotationId)}`, {
   method: "DELETE",
   headers: { "Content-Type": "application/json", ...ownerHeaders(userId) },
   body: JSON.stringify({ expectedRevision }),
  });
  if (!response.ok && response.status !== 404 && typeof window !== "undefined") {
   await enqueuePendingAnnotationMutation({
    id: `reader_annotation:delete:${annotationId}`,
    type: "reader_annotation.delete",
    status: "pending",
    userId,
    annotationId,
    documentId,
    expectedRevision,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attemptCount: 0,
   });
  }
 } catch {
  if (typeof window !== "undefined") {
   await enqueuePendingAnnotationMutation({
    id: `reader_annotation:delete:${annotationId}`,
    type: "reader_annotation.delete",
    status: "pending",
    userId,
    annotationId,
    documentId,
    expectedRevision,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attemptCount: 0,
   });
  }
 }
}

export async function updateReaderAnnotation(
 annotation: ReaderAnnotationRow,
 noteText: string,
 userId?: string,
 color?: ReaderAnnotationRow["color"],
): Promise<ReaderAnnotationRow> {
 const now = new Date().toISOString();
 const effectiveUserId = userId ?? annotation.user_id;
 const resolvedColor = color ?? annotation.color;
 const updated: ReaderAnnotationRow = {
  ...annotation,
  color: resolvedColor,
  note_text: noteText,
  updated_at: now,
 };

 if (typeof window !== "undefined") {
  await saveLocalReaderAnnotation(updated);
 }

 if (typeof navigator !== "undefined" && !navigator.onLine) {
  if (typeof window !== "undefined") {
   await enqueuePendingAnnotationMutation({
    id: `reader_annotation:update:${annotation.id}`,
    type: "reader_annotation.update",
    status: "pending",
    userId: effectiveUserId,
    annotationId: annotation.id,
    documentId: annotation.document_id,
    noteText,
    expectedRevision: annotation.revision,
    annotation: updated,
    createdAt: now,
    updatedAt: now,
    attemptCount: 0,
   });
  }
  return updated;
 }

 try {
  const response = await fetch(`/api/reading/annotations/${encodeURIComponent(annotation.id)}`, {
   method: "PATCH",
   headers: { "Content-Type": "application/json", ...ownerHeaders(effectiveUserId) },
   body: JSON.stringify({
    paragraphId: annotation.paragraph_id,
    assetId: annotation.asset_id,
    color: resolvedColor,
    pageNumber: annotation.page_number,
    startOffset: annotation.start_offset,
    endOffset: annotation.end_offset,
    selectedText: annotation.selected_text,
    noteText,
    payload: annotation.payload,
    expectedRevision: annotation.revision,
   }),
  });
  if (!response.ok && typeof window !== "undefined") {
   await enqueuePendingAnnotationMutation({
    id: `reader_annotation:update:${annotation.id}`,
    type: "reader_annotation.update",
    status: "pending",
    userId: effectiveUserId,
    annotationId: annotation.id,
    documentId: annotation.document_id,
    noteText,
    expectedRevision: annotation.revision,
    annotation: updated,
    createdAt: now,
    updatedAt: now,
    attemptCount: 0,
   });
   return updated;
  }
  const value = await response.json().catch(() => null);
  const parsed = createAnnotationResponseSchema.safeParse(value);
  if (!parsed.success) return updated;

  const serverAnnotation = parsed.data.annotation;
  if (typeof window !== "undefined") {
   const saved = await saveLocalReaderAnnotationIfCurrent(serverAnnotation, updated.updated_at);
   return saved ? serverAnnotation : updated;
  }
  return serverAnnotation;
 } catch {
  if (typeof window !== "undefined") {
   await enqueuePendingAnnotationMutation({
    id: `reader_annotation:update:${annotation.id}`,
    type: "reader_annotation.update",
    status: "pending",
    userId: effectiveUserId,
    annotationId: annotation.id,
    documentId: annotation.document_id,
    noteText,
    expectedRevision: annotation.revision,
    annotation: updated,
    createdAt: now,
    updatedAt: now,
    attemptCount: 0,
   });
  }
  return updated;
 }
}

async function drainPendingReaderAnnotations(userId: string): Promise<ReaderAnnotationSyncResult> {
 if (typeof window === "undefined" || !userId || !isBrowserOnline()) {
  return { syncedCount: 0, errorCount: 0 };
 }
 const pending = await getPendingAnnotationMutations(userId);
 if (pending.length === 0) return { syncedCount: 0, errorCount: 0 };

 let syncedCount = 0;
 let errorCount = 0;

 for (const mutation of pending) {
  const active = await markPendingAnnotationMutationSyncing(mutation);
  if (!active) continue;

  try {
   if (active.type === "reader_annotation.create") {
    const response = await fetch("/api/reading/annotations", {
     method: "POST",
     headers: { "Content-Type": "application/json", ...ownerHeaders(userId) },
     body: JSON.stringify({
      documentId: active.documentId,
      paragraphId: active.annotation.paragraph_id,
      assetId: active.annotation.asset_id,
      annotationType: active.annotation.annotation_type,
      pageNumber: active.annotation.page_number,
      startOffset: active.annotation.start_offset,
      endOffset: active.annotation.end_offset,
      selectedText: active.annotation.selected_text,
      noteText: active.annotation.note_text,
      color: active.annotation.color,
      payload: active.annotation.payload,
     }),
    });
    if (response.status === 412) {
     await markPendingAnnotationMutationFailed(active, "Reader annotation owner changed.");
     return { syncedCount, errorCount: errorCount + 1, isOwnerMismatch: true };
    }
    if (response.ok) {
     const value = await response.json().catch(() => null);
     const parsed = createAnnotationResponseSchema.safeParse(value);
     if (parsed.success) {
      const acknowledgement = await acknowledgePendingAnnotationCreate(
       active,
       parsed.data.annotation,
      );
      if (acknowledgement.applied) syncedCount += 1;
     } else {
      await markPendingAnnotationMutationFailed(active, "Invalid Reader annotation response.");
      errorCount += 1;
     }
    } else {
     await markPendingAnnotationMutationFailed(active, "Could not save Reader annotation.");
     errorCount += 1;
    }
   } else if (active.type === "reader_annotation.update") {
    const response = await fetch(
     `/api/reading/annotations/${encodeURIComponent(active.annotationId)}`,
     {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...ownerHeaders(userId) },
      body: JSON.stringify({
       paragraphId: active.annotation?.paragraph_id ?? null,
       assetId: active.annotation?.asset_id ?? null,
       color: active.annotation?.color ?? "yellow",
       pageNumber: active.annotation?.page_number ?? null,
       startOffset: active.annotation?.start_offset ?? null,
       endOffset: active.annotation?.end_offset ?? null,
       selectedText: active.annotation?.selected_text ?? "",
       noteText: active.noteText,
       payload: active.annotation?.payload ?? {},
       expectedRevision: active.expectedRevision,
      }),
     },
    );
    if (response.status === 412) {
     await markPendingAnnotationMutationFailed(active, "Reader annotation owner changed.");
     return { syncedCount, errorCount: errorCount + 1, isOwnerMismatch: true };
    }
    if (response.ok) {
     const value = await response.json().catch(() => null);
     const parsed = createAnnotationResponseSchema.safeParse(value);
     if (parsed.success) {
      if (await acknowledgePendingAnnotationUpdate(active, parsed.data.annotation)) {
       syncedCount += 1;
      }
     } else {
      await markPendingAnnotationMutationFailed(active, "Invalid Reader annotation response.");
      errorCount += 1;
     }
    } else {
     await markPendingAnnotationMutationFailed(active, "Could not update Reader annotation.");
     errorCount += 1;
    }
   } else if (active.type === "reader_annotation.delete") {
    const response = await fetch(
     `/api/reading/annotations/${encodeURIComponent(active.annotationId)}`,
     {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...ownerHeaders(userId) },
      body: JSON.stringify({ expectedRevision: active.expectedRevision }),
     },
    );
    if (response.status === 412) {
     await markPendingAnnotationMutationFailed(active, "Reader annotation owner changed.");
     return { syncedCount, errorCount: errorCount + 1, isOwnerMismatch: true };
    }
    if (response.ok || response.status === 404) {
     if (await acknowledgePendingAnnotationDelete(active)) syncedCount += 1;
    } else {
     await markPendingAnnotationMutationFailed(active, "Could not delete Reader annotation.");
     errorCount += 1;
    }
   }
  } catch (error) {
   const message = error instanceof Error ? error.message : "Could not sync Reader annotations.";
   await markPendingAnnotationMutationFailed(active, message);
   errorCount += 1;
  }
 }

 return { syncedCount, errorCount };
}

export function syncPendingReaderAnnotations(userId: string): Promise<ReaderAnnotationSyncResult> {
 const current = readerAnnotationSyncInFlightByOwner.get(userId);
 if (current) return current;
 const next = drainPendingReaderAnnotations(userId).finally(() => {
  if (readerAnnotationSyncInFlightByOwner.get(userId) === next) {
   readerAnnotationSyncInFlightByOwner.delete(userId);
  }
 });
 readerAnnotationSyncInFlightByOwner.set(userId, next);
 return next;
}
