import { beforeEach, describe, expect, it, vi } from "vitest";

const localDb = vi.hoisted(() => ({
 delete: vi.fn(),
 deleteIf: vi.fn(),
 listMatching: vi.fn(),
 put: vi.fn(),
 read: vi.fn(),
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
}));

import {
 deleteLocalReaderAnnotation,
 enqueuePendingAnnotationMutation,
 getLocalReaderAnnotations,
 getPendingAnnotationMutations,
 removePendingAnnotationMutation,
 saveLocalReaderAnnotation,
 type PendingAnnotationMutation,
} from "./reader-annotation-local-store";
import type { ReaderAnnotationRow } from "../model/reading-annotation.schemas";

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
});
