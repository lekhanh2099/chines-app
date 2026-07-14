import { beforeEach, describe, expect, it, vi } from "vitest";

import { emptyLearningState } from "@/features/hanzihome/utils/learning-state";
import type { PendingLearningStateMutation } from "./learning-state-local-store";

const store = vi.hoisted(() => ({
 clear: vi.fn(),
 enqueue: vi.fn(),
 list: vi.fn(),
 markFailed: vi.fn(),
 markSyncing: vi.fn(),
 readLocal: vi.fn(),
 readPending: vi.fn(),
 writeLocal: vi.fn(),
}));

const api = vi.hoisted(() => ({
 fetch: vi.fn(),
 save: vi.fn(),
}));

vi.mock("./learning-state-local-store", () => ({
 clearPendingLearningStateMutation: store.clear,
 enqueueLearningStateSync: store.enqueue,
 listPendingLearningStateMutations: store.list,
 markLearningStateMutationFailed: store.markFailed,
 markLearningStateMutationSyncing: store.markSyncing,
 readLocalLearningState: store.readLocal,
 readPendingLearningStateMutation: store.readPending,
 writeLocalLearningState: store.writeLocal,
}));

vi.mock("@/features/hanzihome/repositories/hanzihome-content-api-client", () => ({
 fetchHanziHomeLearningState: api.fetch,
 saveHanziHomeLearningState: api.save,
}));

import { syncPendingLearningStateMutations } from "./learning-state-local-first";

const pendingMutation: PendingLearningStateMutation = {
 id: "learning_state:current",
 type: "learning_state.replace",
 status: "pending",
 payload: emptyLearningState,
 createdAt: "2026-07-14T00:00:00.000Z",
 updatedAt: "2026-07-14T00:00:01.000Z",
 attemptCount: 0,
};

describe("learning-state local-first sync", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("navigator", { onLine: true });
  store.list.mockResolvedValueOnce([pendingMutation]).mockResolvedValue([]);
  store.markSyncing.mockResolvedValue(pendingMutation);
  store.readPending.mockResolvedValue(pendingMutation);
  api.save.mockResolvedValue(emptyLearningState);
 });

 it("clears the queue only after the matching mutation is saved", async () => {
  const result = await syncPendingLearningStateMutations();

  expect(api.save).toHaveBeenCalledWith(emptyLearningState);
  expect(store.writeLocal).toHaveBeenCalledWith({
   state: emptyLearningState,
   lastSyncedAt: expect.any(String),
  });
  expect(store.clear).toHaveBeenCalledOnce();
  expect(result).toMatchObject({ status: "synced", syncedCount: 1, pendingCount: 0 });
 });

 it("does not clear a newer mutation that arrived while a request was in flight", async () => {
  store.readPending.mockResolvedValue({
   ...pendingMutation,
   updatedAt: "2026-07-14T00:00:02.000Z",
  });
  store.list.mockReset();
  store.list
   .mockResolvedValueOnce([pendingMutation])
   .mockResolvedValueOnce([{ ...pendingMutation, updatedAt: "2026-07-14T00:00:02.000Z" }]);

  const result = await syncPendingLearningStateMutations();

  expect(store.clear).not.toHaveBeenCalled();
  expect(result).toMatchObject({ status: "pending", syncedCount: 0, pendingCount: 1 });
 });

 it("marks the matching mutation failed and preserves it for retry", async () => {
  api.save.mockRejectedValue(new Error("network down"));
  store.list.mockReset();
  store.list.mockResolvedValueOnce([pendingMutation]).mockResolvedValueOnce([pendingMutation]);

  const result = await syncPendingLearningStateMutations();

  expect(store.markFailed).toHaveBeenCalledWith({
   mutation: pendingMutation,
   error: "network down",
  });
  expect(result).toMatchObject({
   status: "error",
   syncedCount: 0,
   pendingCount: 1,
   error: "network down",
  });
 });
});
