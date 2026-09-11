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
 getLocalReaderAnnotations,
 getPendingAnnotationMutations,
 type PendingAnnotationMutation,
} from "./reader-annotation-local-store";
import {
 fetchReaderAnnotations,
 createReaderAnnotation,
 syncPendingReaderAnnotations,
} from "../services/reading-annotation-api";
import type { ReaderAnnotationRow } from "../model/reading-annotation.schemas";

const userAId = "11111111-aaaa-4111-8111-111111111111";
const userBId = "22222222-bbbb-4222-8222-222222222222";

const userAAnnotation: ReaderAnnotationRow = {
 id: "aaaaaaaa-1111-4111-8111-111111111111",
 user_id: userAId,
 document_id: "doc-shared",
 paragraph_id: "p-1",
 asset_id: null,
 annotation_type: "highlight",
 page_number: null,
 start_offset: 0,
 end_offset: 4,
 selected_text: "商务汉语",
 note_text: "",
 color: "green",
 payload: {},
 revision: 1,
 created_at: "2026-09-11T10:00:00.000Z",
 updated_at: "2026-09-11T10:00:00.000Z",
 deleted_at: null,
};

const userBAnnotation: ReaderAnnotationRow = {
 id: "bbbbbbbb-2222-4222-8222-222222222222",
 user_id: userBId,
 document_id: "doc-shared",
 paragraph_id: "p-1",
 asset_id: null,
 annotation_type: "note",
 page_number: null,
 start_offset: 5,
 end_offset: 10,
 selected_text: "真丝面料",
 note_text: "User B private note",
 color: "yellow",
 payload: {},
 revision: 1,
 created_at: "2026-09-11T10:05:00.000Z",
 updated_at: "2026-09-11T10:05:00.000Z",
 deleted_at: null,
};

describe("A1 — Multi-tenant Reader Account & Cache Isolation", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("window", {});
  localDb.put.mockResolvedValue(undefined);
  localDb.delete.mockResolvedValue(undefined);
 });

 it("Invariant 1: User A creates annotation offline -> switch to User B -> User B must not see or sync User A data", async () => {
  vi.stubGlobal("navigator", { onLine: false });

  // 1a. User A creates an annotation offline
  const createdA = await createReaderAnnotation(
   {
    documentId: "doc-shared",
    paragraphId: "p-1",
    assetId: null,
    annotationType: "highlight",
    pageNumber: null,
    startOffset: 0,
    endOffset: 4,
    selectedText: "商务汉语",
    noteText: "",
    color: "green",
    payload: {},
   },
   userAId,
  );

  expect(createdA.user_id).toBe(userAId);

  // Stored in local DB with userAId
  expect(localDb.put).toHaveBeenCalledWith(
   "pending_mutations",
   expect.objectContaining({
    userId: userAId,
    type: "reader_annotation.create",
   }),
  );

  // 1b. Mock both records existing in IndexedDB
  localDb.listMatching.mockImplementation((store: string) => {
   if (store === "reader_annotations") {
    return Promise.resolve([userAAnnotation, userBAnnotation]);
   }
   if (store === "pending_mutations") {
    const mutA: PendingAnnotationMutation = {
     id: `reader_annotation:create:${createdA.id}`,
     type: "reader_annotation.create",
     status: "pending",
     userId: userAId,
     tempId: createdA.id,
     documentId: "doc-shared",
     annotation: createdA,
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString(),
     attemptCount: 0,
    };
    return Promise.resolve([mutA]);
   }
   return Promise.resolve([]);
  });

  // User B queries offline annotations: must NOT see User A's data
  const annotationsForB = await getLocalReaderAnnotations(userBId, "doc-shared");
  expect(annotationsForB).toHaveLength(1);
  expect(annotationsForB[0]?.id).toBe(userBAnnotation.id);
  expect(annotationsForB.some((ann) => ann.user_id === userAId)).toBe(false);

  // User B reconnects and drains outbox: must NOT sync User A's pending mutation
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  const syncResultForB = await syncPendingReaderAnnotations(userBId);
  expect(syncResultForB.syncedCount).toBe(0);
  expect(globalThis.fetch).not.toHaveBeenCalled();
 });

 it("Invariant 2: Unresolved session (null userId) does not hydrate private snapshot", async () => {
  localDb.listMatching.mockResolvedValue([userAAnnotation, userBAnnotation]);

  const anonResult = await getLocalReaderAnnotations(null, "doc-shared");
  expect(anonResult).toEqual([]);

  const undefinedResult = await getLocalReaderAnnotations(undefined, "doc-shared");
  expect(undefinedResult).toEqual([]);

  const fetchAnon = await fetchReaderAnnotations(null, "doc-shared");
  expect(fetchAnon).toEqual([]);
 });

 it("Invariant 3: Server returns 401/403/412 -> does not silently fallback to private data", async () => {
  vi.stubGlobal("navigator", { onLine: true });
  localDb.listMatching.mockResolvedValue([userAAnnotation]);

  // 401 Unauthorized
  globalThis.fetch = vi.fn().mockResolvedValue(
   new Response(JSON.stringify({ error: "Session expired" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
   }),
  );
  const result401 = await fetchReaderAnnotations(userAId, "doc-shared");
  expect(result401).toEqual([]);

  // 403 Forbidden
  globalThis.fetch = vi.fn().mockResolvedValue(
   new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
   }),
  );
  const result403 = await fetchReaderAnnotations(userAId, "doc-shared");
  expect(result403).toEqual([]);

  // 412 Precondition Failed (Tenant Mismatch)
  globalThis.fetch = vi.fn().mockResolvedValue(
   new Response(JSON.stringify({ error: "Precondition Failed" }), {
    status: 412,
    headers: { "Content-Type": "application/json" },
   }),
  );
  const result412 = await fetchReaderAnnotations(userAId, "doc-shared");
  expect(result412).toEqual([]);
 });

 it("Invariant 4 & 5: Legacy mutations without matching userId are isolated and never drained", async () => {
  const legacyMutation: PendingAnnotationMutation = {
   id: "legacy-mut-1",
   type: "reader_annotation.delete",
   status: "pending",
   userId: "unknown-legacy-owner",
   annotationId: "some-old-id",
   documentId: "doc-shared",
   expectedRevision: 1,
   createdAt: "2026-09-01T00:00:00.000Z",
   updatedAt: "2026-09-01T00:00:00.000Z",
   attemptCount: 0,
  };

  localDb.listMatching.mockResolvedValue([legacyMutation]);

  // Querying mutations for User A ignores the legacy unknown mutation
  const userAMutations = await getPendingAnnotationMutations(userAId);
  expect(userAMutations).toEqual([]);

  // Drain for User A does nothing and does not delete or touch the legacy mutation
  const syncResult = await syncPendingReaderAnnotations(userAId);
  expect(syncResult.syncedCount).toBe(0);
  expect(localDb.delete).not.toHaveBeenCalled();
 });
});
