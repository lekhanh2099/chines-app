"use client";

import { z } from "zod";
import {
 deleteFromStoreIf,
 getAllFromStoreMatching,
 HANZIHOME_LOCAL_STORES,
 openHanziHomeLocalDb,
 readFromStore,
 replaceInStoreIf,
} from "@/features/hanzihome/local/hanzihome-local-db";
import {
 annotationPayloadSchema,
 fetchPdfAnnotation,
 PdfAnnotationConflictError,
 savePdfAnnotation,
 type PdfAnnotationPayloadInput,
 type PdfAnnotationQuery,
} from "./pdf-annotation-api";
import { equalPdfAnnotationPayloads, type PdfAnnotationPayload } from "./pdf-annotations";

// Previously committed outboxes have no absence flag. Keep that ambiguity until
// a safe server observation or an explicit conflict choice resolves the base.
const storedAnnotationInputSchema = annotationPayloadSchema.extend({
 expectedAbsent: z.boolean().optional(),
});

const pendingPdfSchema = z.strictObject({
 id: z.string().min(1),
 type: z.literal("pdf_annotation.save"),
 ownerUserId: z.string().min(1),
 operationId: z.uuid(),
 createdAt: z.iso.datetime({ offset: true }),
 input: storedAnnotationInputSchema,
 // Persist the request before sending it, so a lost response can be reconciled
 // even if a newer local edit has replaced the queued payload.
 submittedInput: storedAnnotationInputSchema.optional(),
});
type PendingPdfAnnotation = z.output<typeof pendingPdfSchema>;
const ownerWriteTails = new Map<string, Promise<void>>();

async function withPdfOwnerLock<T>(ownerUserId: string, operation: () => Promise<T>): Promise<T> {
 if (typeof navigator !== "undefined" && navigator.locks) {
  return navigator.locks.request(`pdf-annotations:${ownerUserId}`, operation);
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

function pendingId(ownerUserId: string, input: PdfAnnotationQuery) {
 return `pdf_annotation:${ownerUserId}:${input.assetId}:${input.pageNumber}`;
}

export function getPendingPdfAnnotation(input: PdfAnnotationQuery, ownerUserId: string) {
 return readFromStore(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  pendingId(ownerUserId, input),
  pendingPdfSchema,
 );
}

export async function enqueuePdfAnnotation(
 input: PdfAnnotationPayloadInput,
 ownerUserId: string,
): Promise<void> {
 const payload = annotationPayloadSchema.parse(input);
 const item: PendingPdfAnnotation = {
  id: pendingId(ownerUserId, payload),
  type: "pdf_annotation.save",
  ownerUserId,
  operationId: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  input: payload,
 };
 const db = await openHanziHomeLocalDb();
 await new Promise<void>((resolve, reject) => {
  const tx = db.transaction(HANZIHOME_LOCAL_STORES.pendingMutations, "readwrite");
  const store = tx.objectStore(HANZIHOME_LOCAL_STORES.pendingMutations);
  const request = store.get(item.id);
  request.onsuccess = () => {
   const previous = pendingPdfSchema.safeParse(request.result);
   store.put(
    previous.success && previous.data.ownerUserId === ownerUserId
     ? {
        ...item,
        input: {
         ...payload,
         expectedRevision: previous.data.input.expectedRevision,
         expectedAbsent: previous.data.input.expectedAbsent,
        },
        submittedInput: previous.data.submittedInput,
       }
     : item,
   );
  };
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
 });
}

export function flushPendingPdfAnnotation(input: PdfAnnotationQuery, ownerUserId: string) {
 return withPdfOwnerLock(ownerUserId, async () => {
  let acknowledged: Awaited<ReturnType<typeof fetchPdfAnnotation>> = null;
  while (typeof navigator === "undefined" || navigator.onLine) {
   const item = await getPendingPdfAnnotation(input, ownerUserId);
   if (!item) break;
   let submitted = item.submittedInput;
   let saved: Awaited<ReturnType<typeof fetchPdfAnnotation>> = null;
   if (submitted) {
    const server = await fetchPdfAnnotation(input, ownerUserId);
    if (
     server &&
     (submitted.expectedAbsent === true
      ? server.revision === 0
      : submitted.expectedAbsent === false
        ? server.revision === submitted.expectedRevision + 1
        : server.revision === submitted.expectedRevision + 1 ||
          (submitted.expectedRevision === 0 && server.revision === 0)) &&
     equalPdfAnnotationPayloads(server.payload, submitted.payload)
    ) {
     saved = server;
    } else if (
     submitted.expectedAbsent === true
      ? server !== null
      : submitted.expectedAbsent === false
        ? server === null || server.revision !== submitted.expectedRevision
        : server !== null &&
          (submitted.expectedRevision === 0 || server.revision !== submitted.expectedRevision)
    ) {
     throw new PdfAnnotationConflictError(server);
    }
   } else {
    submitted = item.input;
    const marked = await replaceInStoreIf(
     HANZIHOME_LOCAL_STORES.pendingMutations,
     item.id,
     pendingPdfSchema,
     (current) => current.operationId === item.operationId,
     (current) => ({ ...current, submittedInput: current.input }),
    );
    if (!marked) continue;
   }
   if (!saved) {
    let expectedAbsent = submitted.expectedAbsent;
    if (expectedAbsent === undefined) {
     const server = await fetchPdfAnnotation(input, ownerUserId);
     if (server === null && submitted.expectedRevision === 0) expectedAbsent = true;
     else if (
      server &&
      submitted.expectedRevision > 0 &&
      server.revision === submitted.expectedRevision
     )
      expectedAbsent = false;
     else throw new PdfAnnotationConflictError(server);
     const observedAbsent = expectedAbsent;
     const legacySubmitted = submitted;
     const marked = await replaceInStoreIf(
      HANZIHOME_LOCAL_STORES.pendingMutations,
      item.id,
      pendingPdfSchema,
      (current) =>
       current.submittedInput !== undefined &&
       current.submittedInput.expectedAbsent === undefined &&
       current.submittedInput.expectedRevision === legacySubmitted.expectedRevision &&
       equalPdfAnnotationPayloads(current.submittedInput.payload, legacySubmitted.payload),
      (current) => ({
       ...current,
       input: { ...current.input, expectedAbsent: observedAbsent },
       submittedInput: { ...legacySubmitted, expectedAbsent: observedAbsent },
      }),
     );
     if (!marked) continue;
     submitted = { ...submitted, expectedAbsent };
    }
    saved = await savePdfAnnotation({ ...submitted, expectedAbsent }, ownerUserId);
   }
   acknowledged = saved;
   const sent = submitted;
   const deleted = await deleteFromStoreIf(
    HANZIHOME_LOCAL_STORES.pendingMutations,
    item.id,
    pendingPdfSchema,
    (current) =>
     current.input.expectedRevision === sent.expectedRevision &&
     current.input.expectedAbsent === sent.expectedAbsent &&
     equalPdfAnnotationPayloads(current.input.payload, sent.payload),
   );
   if (!deleted) {
    const revision = saved.revision;
    await replaceInStoreIf(
     HANZIHOME_LOCAL_STORES.pendingMutations,
     item.id,
     pendingPdfSchema,
     (current) =>
      current.input.expectedRevision === sent.expectedRevision &&
      current.input.expectedAbsent === sent.expectedAbsent,
     (current) => ({
      ...current,
      input: { ...current.input, expectedRevision: revision, expectedAbsent: false },
      submittedInput: undefined,
     }),
    );
   }
  }
  return acknowledged;
 });
}

export function resolvePendingPdfAnnotationConflict(
 input: PdfAnnotationQuery,
 ownerUserId: string,
 visiblePayload: PdfAnnotationPayload,
 server: Awaited<ReturnType<typeof fetchPdfAnnotation>>,
 useServer: boolean,
) {
 return withPdfOwnerLock(ownerUserId, async () => {
  const pending = await getPendingPdfAnnotation(input, ownerUserId);
  if (!pending || !equalPdfAnnotationPayloads(pending.input.payload, visiblePayload))
   throw new Error("Bản PDF trên thiết bị đã đổi. Cần kiểm tra lại trước khi chọn bản lưu.");
  const matches = (current: PendingPdfAnnotation) => current.operationId === pending.operationId;
  const resolved = useServer
   ? await deleteFromStoreIf(
      HANZIHOME_LOCAL_STORES.pendingMutations,
      pending.id,
      pendingPdfSchema,
      matches,
     )
   : await replaceInStoreIf(
      HANZIHOME_LOCAL_STORES.pendingMutations,
      pending.id,
      pendingPdfSchema,
      matches,
      (current) => ({
       ...current,
       operationId: crypto.randomUUID(),
       input: {
        ...current.input,
        expectedRevision: server?.revision ?? 0,
        expectedAbsent: server === null,
       },
       submittedInput: undefined,
      }),
     );
  if (!resolved)
   throw new Error("Bản PDF trên thiết bị đã đổi. Cần kiểm tra lại trước khi chọn bản lưu.");
 });
}

export async function syncPendingPdfAnnotations(ownerUserId: string): Promise<number> {
 const pending = await getAllFromStoreMatching(
  HANZIHOME_LOCAL_STORES.pendingMutations,
  pendingPdfSchema,
 );
 let synced = 0;
 for (const item of pending.filter((row) => row.ownerUserId === ownerUserId)) {
  try {
   if (await flushPendingPdfAnnotation(item.input, ownerUserId)) synced += 1;
  } catch {
   break;
  }
 }
 return synced;
}
