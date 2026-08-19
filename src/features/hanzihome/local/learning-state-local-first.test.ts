import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import {
 refreshLearningStateFromRemoteIfClean,
 syncPendingLearningStateMutations,
} from "./learning-state-local-first";

const pendingMutation: PendingLearningStateMutation = {
 id: "learning_state:current",
 type: "learning_state.replace",
 status: "pending",
 payload: emptyLearningState,
 createdAt: "2026-07-14T00:00:00.000Z",
 updatedAt: "2026-07-14T00:00:01.000Z",
 attemptCount: 0,
};

let testClock = 0;

describe("learning-state local-first sync", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  testClock += 1;
  vi.setSystemTime(new Date(2_000_000_000_000 + testClock * 60_000));
  vi.stubGlobal("navigator", { onLine: true });
  store.list.mockReset();
  store.readPending.mockReset();
  api.fetch.mockReset();
  api.save.mockReset();
  store.list.mockResolvedValueOnce([pendingMutation]).mockResolvedValue([]);
  store.markSyncing.mockResolvedValue(pendingMutation);
  store.readPending.mockResolvedValue(pendingMutation);
  api.save.mockResolvedValue(emptyLearningState);
 });

 afterEach(() => {
  vi.useRealTimers();
 });

 it("backs off after a failed clean-state refresh", async () => {
  store.readPending.mockResolvedValue(null);
  api.fetch.mockRejectedValue(new Error("Unauthorized"));

  await expect(refreshLearningStateFromRemoteIfClean()).rejects.toThrow("Unauthorized");
  expect(await refreshLearningStateFromRemoteIfClean()).toBeNull();

  expect(api.fetch).toHaveBeenCalledOnce();
 });

 it("deduplicates concurrent clean-state refreshes", async () => {
  store.readPending.mockResolvedValue(null);
  api.fetch.mockResolvedValue(emptyLearningState);

  const [first, second] = await Promise.all([
   refreshLearningStateFromRemoteIfClean(),
   refreshLearningStateFromRemoteIfClean(),
  ]);
  const cooldownResult = await refreshLearningStateFromRemoteIfClean();

  expect(api.fetch).toHaveBeenCalledOnce();
  expect(first).toEqual(emptyLearningState);
  expect(second).toEqual(emptyLearningState);
  expect(cooldownResult).toBeNull();
 });

 it("deduplicates concurrent pending-state syncs across mounted consumers", async () => {
  const first = syncPendingLearningStateMutations();
  const second = syncPendingLearningStateMutations();

  await expect(Promise.all([first, second])).resolves.toEqual([
   expect.objectContaining({ status: "synced", syncedCount: 1, pendingCount: 0 }),
   expect.objectContaining({ status: "synced", syncedCount: 1, pendingCount: 0 }),
  ]);
  expect(api.save).toHaveBeenCalledOnce();
  expect(store.markSyncing).toHaveBeenCalledOnce();
  expect(store.clear).toHaveBeenCalledOnce();
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
