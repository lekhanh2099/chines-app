import { JsonObjectSchema } from "@/types/json";
import { z } from "zod";

import {
 readerAnnotationRowSchema,
 type ReaderAnnotationRow,
} from "@/features/reading/model/reading-annotation.schemas";
import {
 cancelPendingMutationsForAnnotation,
 deleteLocalReaderAnnotation,
 enqueuePendingAnnotationMutation,
 getLocalReaderAnnotations,
 getPendingAnnotationMutations,
 removePendingAnnotationMutation,
 saveLocalReaderAnnotation,
 saveLocalReaderAnnotations,
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

export type ReaderAnnotationInput = z.output<typeof annotationFieldsSchema>;

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
   { cache: "no-store" },
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
   headers: { "Content-Type": "application/json" },
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
   if (canonical.id !== optimisticId) {
    await deleteLocalReaderAnnotation(optimisticId);
   }
   await saveLocalReaderAnnotation(canonical);
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
 let hadPendingCreate = false;
 if (typeof window !== "undefined") {
  await deleteLocalReaderAnnotation(annotationId);
  const cancelResult = await cancelPendingMutationsForAnnotation(annotationId, userId);
  hadPendingCreate = cancelResult?.hadPendingCreate ?? false;
 }

 // If the annotation only existed locally as an un-synced create mutation,
 // do not enqueue a delete mutation since it never reached the server.
 if (hadPendingCreate) {
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
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ expectedRevision }),
  });
  if (!response.ok && response.status !== 404 && typeof window !== "undefined" && userId) {
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
 }
}

export async function updateReaderAnnotation(
 annotation: ReaderAnnotationRow,
 noteText: string,
 userId?: string,
): Promise<ReaderAnnotationRow> {
 const now = new Date().toISOString();
 const effectiveUserId = userId ?? annotation.user_id;
 const updated: ReaderAnnotationRow = {
  ...annotation,
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
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    paragraphId: annotation.paragraph_id,
    assetId: annotation.asset_id,
    color: annotation.color,
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
   await saveLocalReaderAnnotation(serverAnnotation);
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

export async function syncPendingReaderAnnotations(userId: string): Promise<{
 syncedCount: number;
 errorCount: number;
}> {
 if (typeof window === "undefined" || !userId) return { syncedCount: 0, errorCount: 0 };
 const pending = await getPendingAnnotationMutations(userId);
 if (pending.length === 0) return { syncedCount: 0, errorCount: 0 };

 let syncedCount = 0;
 let errorCount = 0;

 for (const mutation of pending) {
  try {
   if (mutation.type === "reader_annotation.create") {
    const response = await fetch("/api/reading/annotations", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
      documentId: mutation.documentId,
      paragraphId: mutation.annotation.paragraph_id,
      assetId: mutation.annotation.asset_id,
      annotationType: mutation.annotation.annotation_type,
      pageNumber: mutation.annotation.page_number,
      startOffset: mutation.annotation.start_offset,
      endOffset: mutation.annotation.end_offset,
      selectedText: mutation.annotation.selected_text,
      noteText: mutation.annotation.note_text,
      color: mutation.annotation.color,
      payload: mutation.annotation.payload,
     }),
    });
    if (response.ok) {
     const value = await response.json().catch(() => null);
     const parsed = createAnnotationResponseSchema.safeParse(value);
     if (parsed.success) {
      await deleteLocalReaderAnnotation(mutation.tempId);
      await saveLocalReaderAnnotation(parsed.data.annotation);
     }
     await removePendingAnnotationMutation(mutation.id);
     syncedCount += 1;
    } else {
     errorCount += 1;
    }
   } else if (mutation.type === "reader_annotation.update") {
    const response = await fetch(
     `/api/reading/annotations/${encodeURIComponent(mutation.annotationId)}`,
     {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
       paragraphId: mutation.annotation?.paragraph_id ?? null,
       assetId: mutation.annotation?.asset_id ?? null,
       color: mutation.annotation?.color ?? "yellow",
       pageNumber: mutation.annotation?.page_number ?? null,
       startOffset: mutation.annotation?.start_offset ?? null,
       endOffset: mutation.annotation?.end_offset ?? null,
       selectedText: mutation.annotation?.selected_text ?? "",
       noteText: mutation.noteText,
       payload: mutation.annotation?.payload ?? {},
       expectedRevision: mutation.expectedRevision,
      }),
     },
    );
    if (response.ok) {
     const value = await response.json().catch(() => null);
     const parsed = createAnnotationResponseSchema.safeParse(value);
     if (parsed.success) {
      await saveLocalReaderAnnotation(parsed.data.annotation);
     }
     await removePendingAnnotationMutation(mutation.id);
     syncedCount += 1;
    } else {
     errorCount += 1;
    }
   } else if (mutation.type === "reader_annotation.delete") {
    const response = await fetch(
     `/api/reading/annotations/${encodeURIComponent(mutation.annotationId)}`,
     {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedRevision: mutation.expectedRevision }),
     },
    );
    if (response.ok || response.status === 404) {
     await removePendingAnnotationMutation(mutation.id);
     syncedCount += 1;
    } else {
     errorCount += 1;
    }
   }
  } catch {
   errorCount += 1;
  }
 }

 return { syncedCount, errorCount };
}
