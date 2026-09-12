import { beforeEach, describe, expect, it, vi } from "vitest";

const localDb = vi.hoisted(() => ({
 delete: vi.fn(),
 deleteIf: vi.fn(),
 listMatching: vi.fn(),
 put: vi.fn(),
 read: vi.fn(),
 request: vi.fn(),
 transaction: vi.fn(),
}));

vi.mock("@/features/hanzihome/local/hanzihome-local-db", () => ({
 HANZIHOME_LOCAL_STORES: {
  readerAnnotations: "reader_annotations",
  pendingMutations: "pending_mutations",
 },
 deleteFromStore: localDb.delete,
 deleteFromStoreIf: localDb.deleteIf,
 getAllFromStoreMatching: localDb.listMatching,
 putInStore: localDb.put,
 readFromStore: localDb.read,
 promisifyRequest: localDb.request,
 runInLocalTransaction: localDb.transaction,
}));

import {
 acknowledgePendingAnnotationCreate,
 acknowledgePendingAnnotationUpdate,
 deleteLocalReaderAnnotation,
 enqueuePendingAnnotationMutation,
 getLocalReaderAnnotations,
 getPendingAnnotationMutations,
 removePendingAnnotationMutation,
 saveLocalReaderAnnotation,
 type PendingAnnotationMutation,
} from "./reader-annotation-local-store";
import type { ReaderAnnotationRow } from "../model/reading-annotation.schemas";

type ReaderAnnotationLocalTransactionStores = {
 pending_mutations: {
  get: (id: string) => { result: PendingAnnotationMutation | undefined };
  put: (value: PendingAnnotationMutation) => void;
  delete: (id: string) => void;
 };
 reader_annotations: {
  get: (id: string) => { result: ReaderAnnotationRow | undefined };
  put: (value: ReaderAnnotationRow) => void;
  delete: (id: string) => void;
 };
};

function createReaderAnnotationTransaction(
 pendingMutations: Map<string, PendingAnnotationMutation>,
 readerAnnotations: Map<string, ReaderAnnotationRow>,
) {
 return async <T>(
  _stores: string[],
  _mode: string,
  operation: (stores: ReaderAnnotationLocalTransactionStores) => Promise<T> | T,
 ): Promise<T> =>
  operation({
   pending_mutations: {
    get: (id: string) => ({ result: pendingMutations.get(id) }),
    put: (value: PendingAnnotationMutation) => {
     pendingMutations.set(value.id, value);
     localDb.put("pending_mutations", value);
    },
    delete: (id: string) => {
     pendingMutations.delete(id);
     localDb.delete("pending_mutations", id);
    },
   },
   reader_annotations: {
    get: (id: string) => ({ result: readerAnnotations.get(id) }),
    put: (value: ReaderAnnotationRow) => {
     readerAnnotations.set(value.id, value);
     localDb.put("reader_annotations", value);
    },
    delete: (id: string) => {
     readerAnnotations.delete(id);
     localDb.delete("reader_annotations", id);
    },
   },
  });
}

const sampleAnnotation1: ReaderAnnotationRow = {
 id: "11111111-1111-4111-8111-111111111111",
 user_id: "00000000-0000-4000-8000-000000000000",
 document_id: "doc-1",
 paragraph_id: "p-1",
 asset_id: null,
 annotation_type: "note",
 page_number: null,
 start_offset: 5,
 end_offset: 10,
 selected_text: "真丝面料",
 note_text: "Silk fabric",
 color: "yellow",
 payload: {},
 revision: 1,
 created_at: "2026-09-10T12:00:00.000Z",
 updated_at: "2026-09-10T12:00:00.000Z",
 deleted_at: null,
};

const sampleAnnotation2: ReaderAnnotationRow = {
 id: "22222222-2222-4222-8222-222222222222",
 user_id: "00000000-0000-4000-8000-000000000000",
 document_id: "doc-1",
 paragraph_id: "p-1",
 asset_id: null,
 annotation_type: "highlight",
 page_number: null,
 start_offset: 0,
 end_offset: 2,
 selected_text: "订购",
 note_text: "",
 color: "green",
 payload: {},
 revision: 1,
 created_at: "2026-09-10T12:01:00.000Z",
 updated_at: "2026-09-10T12:01:00.000Z",
 deleted_at: null,
};

const otherDocAnnotation: ReaderAnnotationRow = {
 id: "33333333-3333-4333-8333-333333333333",
 user_id: "00000000-0000-4000-8000-000000000000",
 document_id: "doc-2",
 paragraph_id: "p-2",
 asset_id: null,
 annotation_type: "note",
 page_number: null,
 start_offset: 1,
 end_offset: 3,
 selected_text: "面料",
 note_text: "",
 color: "yellow",
 payload: {},
 revision: 1,
 created_at: "2026-09-10T12:02:00.000Z",
 updated_at: "2026-09-10T12:02:00.000Z",
 deleted_at: null,
};

describe("reader-annotation-local-store", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  localDb.put.mockResolvedValue(undefined);
  localDb.delete.mockResolvedValue(undefined);
  localDb.request.mockImplementation(<T>(request: { result: T }) =>
   Promise.resolve(request.result),
  );
  localDb.transaction.mockImplementation(
   createReaderAnnotationTransaction(
    new Map<string, PendingAnnotationMutation>(),
    new Map<string, ReaderAnnotationRow>(),
   ),
  );
 });

 it("retrieves and sorts active annotations for a specific document and user", async () => {
  const userBAnnotation: ReaderAnnotationRow = {
   ...sampleAnnotation1,
   id: "44444444-4444-4444-8444-444444444444",
   user_id: "12345678-1234-4234-8234-123456789abc",
  };

  localDb.listMatching.mockResolvedValue([
   sampleAnnotation1,
   sampleAnnotation2,
   otherDocAnnotation,
   userBAnnotation,
  ]);

  const resultA = await getLocalReaderAnnotations(sampleAnnotation1.user_id, "doc-1");
  expect(resultA).toHaveLength(2);
  expect(resultA[0]?.id).toBe(sampleAnnotation2.id);
  expect(resultA[1]?.id).toBe(sampleAnnotation1.id);

  // User B only receives their own annotations
  const resultB = await getLocalReaderAnnotations(userBAnnotation.user_id, "doc-1");
  expect(resultB).toHaveLength(1);
  expect(resultB[0]?.id).toBe(userBAnnotation.id);

  // Unauthenticated user receives empty array
  const resultAnon = await getLocalReaderAnnotations(null, "doc-1");
  expect(resultAnon).toEqual([]);
 });

 it("saves a local annotation into the store", async () => {
  await saveLocalReaderAnnotation(sampleAnnotation1);
  expect(localDb.put).toHaveBeenCalledWith("reader_annotations", sampleAnnotation1);
 });

 it("deletes a local annotation from the store", async () => {
  await deleteLocalReaderAnnotation(sampleAnnotation1.id);
  expect(localDb.delete).toHaveBeenCalledWith("reader_annotations", sampleAnnotation1.id);
 });

 it("enqueues and reads pending mutations scoped to user", async () => {
  const mutation: PendingAnnotationMutation = {
   id: "reader_annotation:create:11111111-1111-4111-8111-111111111111",
   type: "reader_annotation.create",
   status: "pending",
   userId: sampleAnnotation1.user_id,
   tempId: sampleAnnotation1.id,
   documentId: sampleAnnotation1.document_id,
   annotation: sampleAnnotation1,
   createdAt: "2026-09-10T12:00:00.000Z",
   updatedAt: "2026-09-10T12:00:00.000Z",
   attemptCount: 0,
  };

  const otherUserMutation: PendingAnnotationMutation = {
   ...mutation,
   id: "reader_annotation:create:other",
   userId: "other-user-uuid",
  };

  await enqueuePendingAnnotationMutation(mutation);
  expect(localDb.put).toHaveBeenCalledWith("pending_mutations", mutation);

  localDb.listMatching.mockResolvedValue([mutation, otherUserMutation]);
  const mutations = await getPendingAnnotationMutations(sampleAnnotation1.user_id);
  expect(mutations).toEqual([mutation]);

  await removePendingAnnotationMutation(mutation.id);
  expect(localDb.delete).toHaveBeenCalledWith("pending_mutations", mutation.id);
 });

 it("remaps an offline edit to the canonical id when its queued create is acknowledged", async () => {
  const create: PendingAnnotationMutation = {
   id: "reader_annotation:create:" + sampleAnnotation1.id,
   type: "reader_annotation.create",
   status: "syncing",
   userId: sampleAnnotation1.user_id,
   tempId: sampleAnnotation1.id,
   documentId: sampleAnnotation1.document_id,
   annotation: sampleAnnotation1,
   createdAt: "2026-09-10T12:00:00.000Z",
   updatedAt: "2026-09-10T12:00:01.000Z",
   attemptCount: 1,
  };
  const edited = {
   ...sampleAnnotation1,
   note_text: "Edited before create replay completed",
   updated_at: "2026-09-10T12:00:02.000Z",
  };
  const update: PendingAnnotationMutation = {
   id: "reader_annotation:update:" + sampleAnnotation1.id,
   type: "reader_annotation.update",
   status: "pending",
   userId: sampleAnnotation1.user_id,
   annotationId: sampleAnnotation1.id,
   documentId: sampleAnnotation1.document_id,
   noteText: edited.note_text,
   expectedRevision: 1,
   annotation: edited,
   createdAt: "2026-09-10T12:00:02.000Z",
   updatedAt: "2026-09-10T12:00:02.000Z",
   attemptCount: 0,
  };
  const canonical: ReaderAnnotationRow = {
   ...sampleAnnotation1,
   id: "55555555-5555-4555-8555-555555555555",
   revision: 2,
   updated_at: "2026-09-10T12:00:03.000Z",
  };
  const pending = new Map<string, PendingAnnotationMutation>([
   [create.id, create],
   [update.id, update],
  ]);
  const annotations = new Map<string, ReaderAnnotationRow>([[sampleAnnotation1.id, edited]]);

  localDb.transaction.mockImplementationOnce(
   createReaderAnnotationTransaction(pending, annotations),
  );

  const acknowledgement = await acknowledgePendingAnnotationCreate(create, canonical);

  expect(acknowledgement).toMatchObject({
   applied: true,
   localAnnotation: { id: canonical.id, note_text: update.noteText },
  });
  expect(pending.has(create.id)).toBe(false);
  expect(pending.get("reader_annotation:update:" + canonical.id)).toMatchObject({
   annotationId: canonical.id,
   expectedRevision: canonical.revision,
   noteText: update.noteText,
  });
  expect(annotations.has(sampleAnnotation1.id)).toBe(false);
  expect(annotations.get(canonical.id)).toMatchObject({ note_text: update.noteText });
 });

 it("does not acknowledge a stale edit after a newer edit has replaced its mutation", async () => {
  const previous: PendingAnnotationMutation = {
   id: "reader_annotation:update:" + sampleAnnotation1.id,
   type: "reader_annotation.update",
   status: "syncing",
   userId: sampleAnnotation1.user_id,
   annotationId: sampleAnnotation1.id,
   documentId: sampleAnnotation1.document_id,
   noteText: "First edit",
   expectedRevision: sampleAnnotation1.revision,
   annotation: sampleAnnotation1,
   createdAt: "2026-09-10T12:00:00.000Z",
   updatedAt: "2026-09-10T12:00:01.000Z",
   attemptCount: 1,
  };
  const newest: PendingAnnotationMutation = {
   ...previous,
   status: "pending",
   noteText: "Second edit",
   annotation: { ...sampleAnnotation1, note_text: "Second edit" },
   updatedAt: "2026-09-10T12:00:02.000Z",
  };
  const pending = new Map<string, PendingAnnotationMutation>([[previous.id, newest]]);
  const annotations = new Map<string, ReaderAnnotationRow>([
   [
    sampleAnnotation1.id,
    { ...sampleAnnotation1, note_text: "Second edit", updated_at: newest.updatedAt },
   ],
  ]);

  localDb.transaction.mockImplementationOnce(
   createReaderAnnotationTransaction(pending, annotations),
  );

  const acknowledged = await acknowledgePendingAnnotationUpdate(previous, {
   ...sampleAnnotation1,
   note_text: "First edit",
   revision: 2,
  });

  expect(acknowledged).toBe(false);
  expect(pending.get(previous.id)).toMatchObject({ noteText: "Second edit" });
  expect(annotations.get(sampleAnnotation1.id)).toMatchObject({ note_text: "Second edit" });
 });
});
