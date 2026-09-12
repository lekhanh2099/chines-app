import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localStore = vi.hoisted(() => ({
 getLocalReaderAnnotations: vi.fn(),
 saveLocalReaderAnnotation: vi.fn(),
 saveLocalReaderAnnotations: vi.fn(),
 deleteLocalReaderAnnotation: vi.fn(),
 enqueuePendingAnnotationMutation: vi.fn(),
 getPendingAnnotationMutations: vi.fn(),
 removePendingAnnotationMutation: vi.fn(),
 cancelPendingMutationsForAnnotation: vi.fn(),
 markPendingAnnotationMutationSyncing: vi.fn(),
 markPendingAnnotationMutationFailed: vi.fn(),
 acknowledgePendingAnnotationCreate: vi.fn(),
 acknowledgePendingAnnotationUpdate: vi.fn(),
 acknowledgePendingAnnotationDelete: vi.fn(),
 acknowledgeLocalReaderAnnotationCreate: vi.fn(),
 saveLocalReaderAnnotationIfCurrent: vi.fn(),
}));

vi.mock("../local/reader-annotation-local-store", () => ({
 getLocalReaderAnnotations: localStore.getLocalReaderAnnotations,
 saveLocalReaderAnnotation: localStore.saveLocalReaderAnnotation,
 saveLocalReaderAnnotations: localStore.saveLocalReaderAnnotations,
 deleteLocalReaderAnnotation: localStore.deleteLocalReaderAnnotation,
 enqueuePendingAnnotationMutation: localStore.enqueuePendingAnnotationMutation,
 getPendingAnnotationMutations: localStore.getPendingAnnotationMutations,
 removePendingAnnotationMutation: localStore.removePendingAnnotationMutation,
 cancelPendingMutationsForAnnotation: localStore.cancelPendingMutationsForAnnotation,
 markPendingAnnotationMutationSyncing: localStore.markPendingAnnotationMutationSyncing,
 markPendingAnnotationMutationFailed: localStore.markPendingAnnotationMutationFailed,
 acknowledgePendingAnnotationCreate: localStore.acknowledgePendingAnnotationCreate,
 acknowledgePendingAnnotationUpdate: localStore.acknowledgePendingAnnotationUpdate,
 acknowledgePendingAnnotationDelete: localStore.acknowledgePendingAnnotationDelete,
 acknowledgeLocalReaderAnnotationCreate: localStore.acknowledgeLocalReaderAnnotationCreate,
 saveLocalReaderAnnotationIfCurrent: localStore.saveLocalReaderAnnotationIfCurrent,
}));

import {
 createReaderAnnotation,
 deleteReaderAnnotation,
 fetchReaderAnnotations,
 syncPendingReaderAnnotations,
 updateReaderAnnotation,
} from "./reading-annotation-api";
import type { ReaderAnnotationRow } from "../model/reading-annotation.schemas";
import type { PendingAnnotationMutation } from "../local/reader-annotation-local-store";

const mockAnnotation: ReaderAnnotationRow = {
 id: "ann-1",
 user_id: "user-1",
 document_id: "doc-1",
 paragraph_id: "p-1",
 asset_id: null,
 annotation_type: "note",
 page_number: null,
 start_offset: 0,
 end_offset: 2,
 selected_text: "你好",
 note_text: "Hello note",
 color: "yellow",
 payload: {},
 created_at: "2026-09-10T00:00:00.000Z",
 updated_at: "2026-09-10T00:00:00.000Z",
 deleted_at: null,
 revision: 1,
};

describe("reading-annotation-api offline resiliency", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.stubGlobal("window", {});
  vi.stubGlobal("navigator", { onLine: false });
  localStore.getLocalReaderAnnotations.mockResolvedValue([]);
  localStore.saveLocalReaderAnnotation.mockResolvedValue(undefined);
  localStore.saveLocalReaderAnnotations.mockResolvedValue(undefined);
  localStore.deleteLocalReaderAnnotation.mockResolvedValue(undefined);
  localStore.enqueuePendingAnnotationMutation.mockResolvedValue(undefined);
  localStore.getPendingAnnotationMutations.mockResolvedValue([]);
  localStore.removePendingAnnotationMutation.mockResolvedValue(undefined);
  localStore.cancelPendingMutationsForAnnotation.mockResolvedValue(undefined);
  localStore.markPendingAnnotationMutationSyncing.mockImplementation(async (mutation) => mutation);
  localStore.markPendingAnnotationMutationFailed.mockResolvedValue(null);
  localStore.acknowledgePendingAnnotationCreate.mockResolvedValue({
   applied: true,
   localAnnotation: mockAnnotation,
  });
  localStore.acknowledgePendingAnnotationUpdate.mockResolvedValue(true);
  localStore.acknowledgePendingAnnotationDelete.mockResolvedValue(true);
  localStore.acknowledgeLocalReaderAnnotationCreate.mockResolvedValue({
   applied: true,
   localAnnotation: mockAnnotation,
  });
  localStore.saveLocalReaderAnnotationIfCurrent.mockResolvedValue(true);
 });

 afterEach(() => {
  vi.unstubAllGlobals();
 });

 it("returns cached local annotations when network fails during fetchReaderAnnotations", async () => {
  localStore.getLocalReaderAnnotations.mockResolvedValue([mockAnnotation]);
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

  const result = await fetchReaderAnnotations("user-1", "doc-1");
  expect(result).toHaveLength(1);
  expect(result[0]?.id).toBe("ann-1");
  expect(result[0]?.selected_text).toBe("你好");
  expect(localStore.getLocalReaderAnnotations).toHaveBeenCalledWith("user-1", "doc-1");
 });

 it("does not fallback to private local annotations when server returns 401 or 403 (A1 Invariant)", async () => {
  vi.stubGlobal("navigator", { onLine: true });
  localStore.getLocalReaderAnnotations.mockResolvedValue([mockAnnotation]);
  globalThis.fetch = vi.fn().mockResolvedValue(
   new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
   }),
  );

  const result = await fetchReaderAnnotations("user-1", "doc-1");
  expect(result).toEqual([]);
 });

 it("persists locally and enqueues outbox mutation with userId when creating annotation offline", async () => {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

  const created = await createReaderAnnotation(
   {
    documentId: "doc-1",
    paragraphId: "p-1",
    assetId: null,
    annotationType: "note",
    pageNumber: null,
    startOffset: 0,
    endOffset: 2,
    selectedText: "你好",
    noteText: "Local offline note",
    color: "yellow",
    payload: {},
   },
   "user-1",
  );

  expect(created.document_id).toBe("doc-1");
  expect(created.user_id).toBe("user-1");
  expect(created.selected_text).toBe("你好");
  expect(created.note_text).toBe("Local offline note");

  expect(localStore.saveLocalReaderAnnotation).toHaveBeenCalledWith(
   expect.objectContaining({
    document_id: "doc-1",
    user_id: "user-1",
    selected_text: "你好",
    note_text: "Local offline note",
   }),
  );
  expect(localStore.enqueuePendingAnnotationMutation).toHaveBeenCalledWith(
   expect.objectContaining({
    type: "reader_annotation.create",
    userId: "user-1",
    documentId: "doc-1",
   }),
  );
 });

 it("updates locally and enqueues update mutation when updating annotation offline", async () => {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

  const updated = await updateReaderAnnotation(mockAnnotation, "Updated note text", "user-1");
  expect(updated.note_text).toBe("Updated note text");
  expect(updated.revision).toBe(mockAnnotation.revision);

  expect(localStore.saveLocalReaderAnnotation).toHaveBeenCalledWith(
   expect.objectContaining({
    id: "ann-1",
    note_text: "Updated note text",
   }),
  );
  expect(localStore.enqueuePendingAnnotationMutation).toHaveBeenCalledWith(
   expect.objectContaining({
    type: "reader_annotation.update",
    userId: "user-1",
    annotationId: "ann-1",
    noteText: "Updated note text",
   }),
  );
 });

 it("deletes locally and enqueues delete mutation when deleting annotation offline", async () => {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

  await deleteReaderAnnotation("ann-1", 1, "doc-1", "user-1");

  expect(localStore.deleteLocalReaderAnnotation).toHaveBeenCalledWith("ann-1");
  expect(localStore.cancelPendingMutationsForAnnotation).toHaveBeenCalledWith("ann-1", "user-1");
  expect(localStore.enqueuePendingAnnotationMutation).toHaveBeenCalledWith(
   expect.objectContaining({
    type: "reader_annotation.delete",
    userId: "user-1",
    annotationId: "ann-1",
    expectedRevision: 1,
   }),
  );
 });

 it("replays the latest of two offline edits against the last server revision", async () => {
  const pending: PendingAnnotationMutation[] = [];
  localStore.enqueuePendingAnnotationMutation.mockImplementation(
   async (mutation: PendingAnnotationMutation) => {
    pending.splice(0, pending.length, mutation);
   },
  );
  const original: ReaderAnnotationRow = {
   ...mockAnnotation,
   id: "33333333-3333-4333-8333-333333333333",
   user_id: "11111111-1111-4111-8111-111111111111",
  };
  const first = await updateReaderAnnotation(original, "first edit", original.user_id);
  const second = await updateReaderAnnotation(first, "second edit", original.user_id);
  expect(second.revision).toBe(original.revision);
  expect(pending).toEqual([
   expect.objectContaining({ expectedRevision: original.revision, noteText: "second edit" }),
  ]);

  localStore.getPendingAnnotationMutations.mockResolvedValue(pending);
  const canonical: ReaderAnnotationRow = { ...second, revision: original.revision + 1 };
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ annotation: canonical }));
  vi.stubGlobal("navigator", { onLine: true });
  vi.stubGlobal("fetch", fetchMock);
  expect(await syncPendingReaderAnnotations(original.user_id)).toEqual({
   syncedCount: 1,
   errorCount: 0,
  });
  expect(localStore.acknowledgePendingAnnotationUpdate).toHaveBeenLastCalledWith(
   expect.objectContaining({ id: pending[0]?.id }),
   canonical,
  );
  expect(fetchMock).toHaveBeenCalledWith(
   `/api/reading/annotations/${original.id}`,
   expect.objectContaining({
    body: JSON.stringify({
     paragraphId: original.paragraph_id,
     assetId: original.asset_id,
     color: original.color,
     pageNumber: original.page_number,
     startOffset: original.start_offset,
     endOffset: original.end_offset,
     selectedText: original.selected_text,
     noteText: "second edit",
     payload: original.payload,
     expectedRevision: original.revision,
    }),
   }),
  );
 });

 it("replays outbox mutations during syncPendingReaderAnnotations for specified user upon reconnect", async () => {
  vi.stubGlobal("navigator", { onLine: true });
  localStore.getPendingAnnotationMutations.mockResolvedValue([
   {
    id: "mut-1",
    type: "reader_annotation.delete",
    status: "pending",
    userId: "user-1",
    annotationId: "ann-1",
    expectedRevision: 1,
    createdAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-09-10T00:00:00.000Z",
    attemptCount: 0,
   },
  ]);

  globalThis.fetch = vi.fn().mockResolvedValue(
   new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
   }),
  );

  const syncResult = await syncPendingReaderAnnotations("user-1");
  expect(syncResult.syncedCount).toBe(1);
  expect(syncResult.errorCount).toBe(0);
  expect(localStore.getPendingAnnotationMutations).toHaveBeenCalledWith("user-1");
  expect(localStore.acknowledgePendingAnnotationDelete).toHaveBeenCalledWith(
   expect.objectContaining({ id: "mut-1" }),
  );
 });

 it("replays reader_annotation.update sending complete schema-compliant PATCH payload (A3 Invariant)", async () => {
  vi.stubGlobal("navigator", { onLine: true });
  localStore.getPendingAnnotationMutations.mockResolvedValue([
   {
    id: "mut-update-1",
    type: "reader_annotation.update",
    status: "pending",
    userId: "user-1",
    annotationId: "ann-1",
    documentId: "doc-1",
    noteText: "Updated note text",
    expectedRevision: 1,
    annotation: mockAnnotation,
    createdAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-09-10T00:00:00.000Z",
    attemptCount: 0,
   },
  ]);

  const fetchMock = vi.fn().mockResolvedValue(
   new Response(
    JSON.stringify({
     annotation: {
      ...mockAnnotation,
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "22222222-2222-4222-8222-222222222222",
      note_text: "Updated note text",
      revision: 2,
     },
    }),
    {
     status: 200,
     headers: { "Content-Type": "application/json" },
    },
   ),
  );
  globalThis.fetch = fetchMock;

  const syncResult = await syncPendingReaderAnnotations("user-1");
  expect(syncResult.syncedCount).toBe(1);
  expect(syncResult.errorCount).toBe(0);
  expect(localStore.acknowledgePendingAnnotationUpdate).toHaveBeenCalledWith(
   expect.objectContaining({ id: "mut-update-1" }),
   expect.objectContaining({ revision: 2 }),
  );

  expect(fetchMock).toHaveBeenCalledWith(
   "/api/reading/annotations/ann-1",
   expect.objectContaining({
    method: "PATCH",
    headers: {
     "Content-Type": "application/json",
     "X-HanziHome-Owner-Id": "user-1",
    },
    body: JSON.stringify({
     paragraphId: "p-1",
     assetId: null,
     color: "yellow",
     pageNumber: null,
     startOffset: 0,
     endOffset: 2,
     selectedText: "你好",
     noteText: "Updated note text",
     payload: {},
     expectedRevision: 1,
    }),
   }),
  );
 });

 it("does not enqueue delete mutation if annotation was created offline and never synced (A3 Invariant)", async () => {
  localStore.cancelPendingMutationsForAnnotation.mockResolvedValue({
   hadPendingCreate: true,
  });

  await deleteReaderAnnotation("temp-ann-1", 1, "doc-1", "user-1");

  expect(localStore.deleteLocalReaderAnnotation).toHaveBeenCalledWith("temp-ann-1");
  expect(localStore.cancelPendingMutationsForAnnotation).toHaveBeenCalledWith(
   "temp-ann-1",
   "user-1",
  );
  expect(localStore.enqueuePendingAnnotationMutation).not.toHaveBeenCalled();
 });

 it("handles 404 on delete replay as idempotent success (A3 Invariant)", async () => {
  vi.stubGlobal("navigator", { onLine: true });
  localStore.getPendingAnnotationMutations.mockResolvedValue([
   {
    id: "mut-del-1",
    type: "reader_annotation.delete",
    status: "pending",
    userId: "user-1",
    annotationId: "already-deleted-ann",
    expectedRevision: 1,
    createdAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-09-10T00:00:00.000Z",
    attemptCount: 0,
   },
  ]);

  globalThis.fetch = vi.fn().mockResolvedValue(
   new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
   }),
  );

  const syncResult = await syncPendingReaderAnnotations("user-1");
  expect(syncResult.syncedCount).toBe(1);
  expect(syncResult.errorCount).toBe(0);
  expect(localStore.acknowledgePendingAnnotationDelete).toHaveBeenCalledWith(
   expect.objectContaining({ id: "mut-del-1" }),
  );
 });

 it("stops an owner A drain when the authenticated session has become owner B", async () => {
  const mutation: PendingAnnotationMutation = {
   id: "mut-owner-a",
   type: "reader_annotation.create",
   status: "pending",
   userId: "user-a",
   tempId: "11111111-1111-4111-8111-111111111111",
   documentId: "doc-1",
   annotation: {
    ...mockAnnotation,
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "user-a",
   },
   createdAt: "2026-09-10T00:00:00.000Z",
   updatedAt: "2026-09-10T00:00:00.000Z",
   attemptCount: 0,
  };
  const active = {
   ...mutation,
   status: "syncing",
   updatedAt: "2026-09-10T00:00:01.000Z",
   attemptCount: 1,
  };

  vi.stubGlobal("navigator", { onLine: true });
  localStore.getPendingAnnotationMutations.mockResolvedValue([mutation]);
  localStore.markPendingAnnotationMutationSyncing.mockResolvedValue(active);
  const fetchMock = vi
   .fn()
   .mockResolvedValue(
    new Response(JSON.stringify({ code: "AUTH_OWNER_MISMATCH" }), { status: 412 }),
   );
  vi.stubGlobal("fetch", fetchMock);

  await expect(syncPendingReaderAnnotations("user-a")).resolves.toEqual({
   syncedCount: 0,
   errorCount: 1,
   isOwnerMismatch: true,
  });
  expect(fetchMock).toHaveBeenCalledWith(
   "/api/reading/annotations",
   expect.objectContaining({
    headers: {
     "Content-Type": "application/json",
     "X-HanziHome-Owner-Id": "user-a",
    },
   }),
  );
  expect(localStore.markPendingAnnotationMutationFailed).toHaveBeenCalledWith(
   active,
   "Reader annotation owner changed.",
  );
  expect(localStore.acknowledgePendingAnnotationCreate).not.toHaveBeenCalled();
 });

 it("does not apply an old edit acknowledgement after a newer local edit replaces it", async () => {
  const mutation: PendingAnnotationMutation = {
   id: "mut-stale-edit",
   type: "reader_annotation.update",
   status: "pending",
   userId: "user-1",
   annotationId: "11111111-1111-4111-8111-111111111111",
   documentId: "doc-1",
   noteText: "First edit",
   expectedRevision: 1,
   annotation: {
    ...mockAnnotation,
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "22222222-2222-4222-8222-222222222222",
   },
   createdAt: "2026-09-10T00:00:00.000Z",
   updatedAt: "2026-09-10T00:00:00.000Z",
   attemptCount: 0,
  };
  const active = {
   ...mutation,
   status: "syncing",
   updatedAt: "2026-09-10T00:00:01.000Z",
   attemptCount: 1,
  };
  const canonical = {
   ...active.annotation,
   note_text: "First edit",
   revision: 2,
  };

  vi.stubGlobal("navigator", { onLine: true });
  localStore.getPendingAnnotationMutations.mockResolvedValue([mutation]);
  localStore.markPendingAnnotationMutationSyncing.mockResolvedValue(active);
  localStore.acknowledgePendingAnnotationUpdate.mockResolvedValue(false);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ annotation: canonical })));

  await expect(syncPendingReaderAnnotations("user-1")).resolves.toEqual({
   syncedCount: 0,
   errorCount: 0,
  });
  expect(localStore.acknowledgePendingAnnotationUpdate).toHaveBeenCalledWith(active, canonical);
 });

 it("does not replay an update against a temporary id after its create acknowledgement remaps it", async () => {
  const tempId = "11111111-1111-4111-8111-111111111111";
  const create: PendingAnnotationMutation = {
   id: "reader_annotation:create:" + tempId,
   type: "reader_annotation.create",
   status: "pending",
   userId: "user-1",
   tempId,
   documentId: "doc-1",
   annotation: {
    ...mockAnnotation,
    id: tempId,
    user_id: "22222222-2222-4222-8222-222222222222",
   },
   createdAt: "2026-09-10T00:00:00.000Z",
   updatedAt: "2026-09-10T00:00:00.000Z",
   attemptCount: 0,
  };
  const update: PendingAnnotationMutation = {
   id: "reader_annotation:update:" + tempId,
   type: "reader_annotation.update",
   status: "pending",
   userId: "user-1",
   annotationId: tempId,
   documentId: "doc-1",
   noteText: "Edited while offline",
   expectedRevision: 1,
   annotation: { ...create.annotation, note_text: "Edited while offline" },
   createdAt: "2026-09-10T00:00:01.000Z",
   updatedAt: "2026-09-10T00:00:01.000Z",
   attemptCount: 0,
  };
  const activeCreate = {
   ...create,
   status: "syncing",
   updatedAt: "2026-09-10T00:00:02.000Z",
   attemptCount: 1,
  };
  const canonical = {
   ...create.annotation,
   id: "33333333-3333-4333-8333-333333333333",
   revision: 2,
  };

  vi.stubGlobal("navigator", { onLine: true });
  localStore.getPendingAnnotationMutations.mockResolvedValue([create, update]);
  localStore.markPendingAnnotationMutationSyncing.mockImplementation(
   async (mutation: PendingAnnotationMutation) => (mutation.id === create.id ? activeCreate : null),
  );
  localStore.acknowledgePendingAnnotationCreate.mockResolvedValue({
   applied: true,
   localAnnotation: { ...canonical, note_text: update.noteText },
  });
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ annotation: canonical }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(syncPendingReaderAnnotations("user-1")).resolves.toEqual({
   syncedCount: 1,
   errorCount: 0,
  });
  expect(localStore.acknowledgePendingAnnotationCreate).toHaveBeenCalledWith(
   activeCreate,
   canonical,
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith("/api/reading/annotations", expect.any(Object));
 });
});
