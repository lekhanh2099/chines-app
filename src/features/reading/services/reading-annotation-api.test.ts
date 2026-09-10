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
}));

import {
 createReaderAnnotation,
 deleteReaderAnnotation,
 fetchReaderAnnotations,
 syncPendingReaderAnnotations,
 updateReaderAnnotation,
} from "./reading-annotation-api";
import type { ReaderAnnotationRow } from "../model/reading-annotation.schemas";

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
 });

 afterEach(() => {
  vi.unstubAllGlobals();
 });

 it("returns cached local annotations when network fails during fetchReaderAnnotations", async () => {
  localStore.getLocalReaderAnnotations.mockResolvedValue([mockAnnotation]);
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

  const result = await fetchReaderAnnotations("doc-1");
  expect(result).toHaveLength(1);
  expect(result[0]?.id).toBe("ann-1");
  expect(result[0]?.selected_text).toBe("你好");
  expect(localStore.getLocalReaderAnnotations).toHaveBeenCalledWith("doc-1");
 });

 it("persists locally and enqueues outbox mutation when creating annotation offline", async () => {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

  const created = await createReaderAnnotation({
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
  });

  expect(created.document_id).toBe("doc-1");
  expect(created.selected_text).toBe("你好");
  expect(created.note_text).toBe("Local offline note");

  expect(localStore.saveLocalReaderAnnotation).toHaveBeenCalledWith(
   expect.objectContaining({
    document_id: "doc-1",
    selected_text: "你好",
    note_text: "Local offline note",
   }),
  );
  expect(localStore.enqueuePendingAnnotationMutation).toHaveBeenCalledWith(
   expect.objectContaining({
    type: "reader_annotation.create",
    documentId: "doc-1",
   }),
  );
 });

 it("updates locally and enqueues update mutation when updating annotation offline", async () => {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

  const updated = await updateReaderAnnotation(mockAnnotation, "Updated note text");
  expect(updated.note_text).toBe("Updated note text");
  expect(updated.revision).toBe(2);

  expect(localStore.saveLocalReaderAnnotation).toHaveBeenCalledWith(
   expect.objectContaining({
    id: "ann-1",
    note_text: "Updated note text",
   }),
  );
  expect(localStore.enqueuePendingAnnotationMutation).toHaveBeenCalledWith(
   expect.objectContaining({
    type: "reader_annotation.update",
    annotationId: "ann-1",
    noteText: "Updated note text",
   }),
  );
 });

 it("deletes locally and enqueues delete mutation when deleting annotation offline", async () => {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

  await deleteReaderAnnotation("ann-1", 1);

  expect(localStore.deleteLocalReaderAnnotation).toHaveBeenCalledWith("ann-1");
  expect(localStore.cancelPendingMutationsForAnnotation).toHaveBeenCalledWith("ann-1");
  expect(localStore.enqueuePendingAnnotationMutation).toHaveBeenCalledWith(
   expect.objectContaining({
    type: "reader_annotation.delete",
    annotationId: "ann-1",
    expectedRevision: 1,
   }),
  );
 });

 it("replays outbox mutations during syncPendingReaderAnnotations upon reconnect", async () => {
  localStore.getPendingAnnotationMutations.mockResolvedValue([
   {
    id: "mut-1",
    type: "reader_annotation.delete",
    status: "pending",
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

  const syncResult = await syncPendingReaderAnnotations();
  expect(syncResult.syncedCount).toBe(1);
  expect(syncResult.errorCount).toBe(0);
  expect(localStore.removePendingAnnotationMutation).toHaveBeenCalledWith("mut-1");
 });
});
