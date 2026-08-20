import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { emptyLearningState } from "@/features/hanzihome/utils/learning-state";
import type { UserLearningState } from "@/features/hanzihome/types";
import type { PendingLearningStateMutation } from "./learning-state-local-store";

const store = vi.hoisted(() => ({
 clear: vi.fn(),
 enqueue: vi.fn(),
 list: vi.fn(),
 markFailed: vi.fn(),
 markSyncing: vi.fn(),
 replace: vi.fn(),
 readLocal: vi.fn(),
 readPending: vi.fn(),
 writeLocal: vi.fn(),
}));

const api = vi.hoisted(() => ({
 fetch: vi.fn(),
 save: vi.fn(),
 ApiError: class extends Error {
  constructor(readonly status: number) {
   super("request failed");
  }
 },
}));

vi.mock("./learning-state-local-store", () => ({
 clearPendingLearningStateMutation: store.clear,
 enqueueLearningStateSync: store.enqueue,
 listPendingLearningStateMutations: store.list,
 markLearningStateMutationFailed: store.markFailed,
 markLearningStateMutationSyncing: store.markSyncing,
 replacePendingLearningStateMutation: store.replace,
 readLocalLearningState: store.readLocal,
 readPendingLearningStateMutation: store.readPending,
 writeLocalLearningState: store.writeLocal,
}));

vi.mock("@/features/hanzihome/repositories/hanzihome-content-api-client", () => ({
 fetchHanziHomeLearningState: api.fetch,
 saveHanziHomeLearningState: api.save,
 HanziHomeApiError: api.ApiError,
}));

import {
 mergeLearningStateAfterConflict,
 refreshLearningStateFromRemoteIfClean,
 syncPendingLearningStateMutations,
} from "./learning-state-local-first";

const ownerUserId = "user-a";
const pendingMutation: PendingLearningStateMutation = {
 id: `learning_state:${ownerUserId}:pending`,
 ownerUserId,
 type: "learning_state.replace",
 status: "pending",
 payload: emptyLearningState,
 baseState: emptyLearningState,
 expectedUpdatedAt: null,
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
  store.markSyncing.mockImplementation((mutation) => Promise.resolve(mutation));
  store.replace.mockImplementation(({ mutation, baseState, state, expectedUpdatedAt }) =>
   Promise.resolve({
    ...mutation,
    payload: state,
    baseState,
    expectedUpdatedAt,
    updatedAt: "2026-07-14T00:00:01.500Z",
   }),
  );
  store.readPending.mockResolvedValue(pendingMutation);
  store.clear.mockResolvedValue(true);
  api.save.mockResolvedValue({ state: emptyLearningState, updatedAt: "2026-07-14T00:00:02.000Z" });
 });

 afterEach(() => {
  vi.useRealTimers();
 });

 it("backs off after a failed clean-state refresh", async () => {
  store.readPending.mockResolvedValue(null);
  api.fetch.mockRejectedValue(new Error("Unauthorized"));

  await expect(refreshLearningStateFromRemoteIfClean(ownerUserId)).rejects.toThrow("Unauthorized");
  expect(await refreshLearningStateFromRemoteIfClean(ownerUserId)).toBeNull();

  expect(api.fetch).toHaveBeenCalledOnce();
  expect(api.fetch).toHaveBeenCalledWith(ownerUserId);
 });

 it("deduplicates concurrent clean-state refreshes per owner", async () => {
  store.readPending.mockResolvedValue(null);
  api.fetch.mockResolvedValue({ state: emptyLearningState, updatedAt: null });

  const [first, second] = await Promise.all([
   refreshLearningStateFromRemoteIfClean(ownerUserId),
   refreshLearningStateFromRemoteIfClean(ownerUserId),
  ]);
  const cooldownResult = await refreshLearningStateFromRemoteIfClean(ownerUserId);

  expect(api.fetch).toHaveBeenCalledOnce();
  expect(api.fetch).toHaveBeenCalledWith(ownerUserId);
  expect(first).toEqual(emptyLearningState);
  expect(second).toEqual(emptyLearningState);
  expect(cooldownResult).toBeNull();
 });

 it("deduplicates concurrent pending-state syncs for the same owner", async () => {
  const first = syncPendingLearningStateMutations(ownerUserId);
  const second = syncPendingLearningStateMutations(ownerUserId);

  await expect(Promise.all([first, second])).resolves.toEqual([
   expect.objectContaining({ status: "synced", syncedCount: 1, pendingCount: 0 }),
   expect.objectContaining({ status: "synced", syncedCount: 1, pendingCount: 0 }),
  ]);
  expect(api.save).toHaveBeenCalledOnce();
  expect(store.markSyncing).toHaveBeenCalledOnce();
  expect(store.clear).toHaveBeenCalledOnce();
 });

 it("clears the queue atomically only after the matching owner mutation is saved", async () => {
  const result = await syncPendingLearningStateMutations(ownerUserId);

  expect(api.save).toHaveBeenCalledWith(emptyLearningState, null, ownerUserId);
  expect(store.writeLocal).toHaveBeenCalledWith({
   ownerUserId,
   state: emptyLearningState,
   lastSyncedState: emptyLearningState,
   remoteUpdatedAt: "2026-07-14T00:00:02.000Z",
   lastSyncedAt: expect.any(String),
  });
  expect(store.clear).toHaveBeenCalledWith(ownerUserId, pendingMutation.updatedAt);
  expect(result).toMatchObject({ status: "synced", syncedCount: 1, pendingCount: 0 });
 });

 it("drains a newer mutation that replaced the in-flight generation without another browser event", async () => {
  const newerMutation: PendingLearningStateMutation = {
   ...pendingMutation,
   payload: {
    ...emptyLearningState,
    settings: { ...emptyLearningState.settings, lastLessonId: "lesson-2" },
   },
   updatedAt: "2026-07-14T00:00:02.000Z",
  };

  store.list.mockReset();
  store.list
   .mockResolvedValueOnce([pendingMutation])
   .mockResolvedValueOnce([newerMutation])
   .mockResolvedValueOnce([newerMutation])
   .mockResolvedValueOnce([]);
  store.readPending.mockReset();
  store.readPending.mockResolvedValueOnce(newerMutation).mockResolvedValueOnce(newerMutation);

  const result = await syncPendingLearningStateMutations(ownerUserId);

  expect(api.save).toHaveBeenCalledTimes(2);
  expect(api.save).toHaveBeenNthCalledWith(1, emptyLearningState, null, ownerUserId);
  expect(api.save).toHaveBeenNthCalledWith(2, newerMutation.payload, null, ownerUserId);
  expect(store.clear).toHaveBeenCalledOnce();
  expect(store.clear).toHaveBeenCalledWith(ownerUserId, newerMutation.updatedAt);
  expect(result).toMatchObject({ status: "synced", syncedCount: 1, pendingCount: 0 });
 });

 it("marks the matching mutation failed and preserves it for retry", async () => {
  api.save.mockRejectedValue(new Error("network down"));
  store.list.mockReset();
  store.list.mockResolvedValueOnce([pendingMutation]).mockResolvedValueOnce([pendingMutation]);

  const result = await syncPendingLearningStateMutations(ownerUserId);

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

 it("rebases local changes over a newer remote state after a conflict", async () => {
  const localState: UserLearningState = {
   ...emptyLearningState,
   settings: { ...emptyLearningState.settings, lastCourseId: "local-course" },
  };
  const remoteState: UserLearningState = {
   ...emptyLearningState,
   settings: { ...emptyLearningState.settings, density: "compact" },
  };
  const localMutation = { ...pendingMutation, payload: localState };
  const rebasedMutation = {
   ...localMutation,
   payload: {
    ...remoteState,
    settings: { ...remoteState.settings, lastCourseId: "local-course" },
   },
   baseState: remoteState,
   expectedUpdatedAt: "2026-07-14T00:00:02.000Z",
   updatedAt: "2026-07-14T00:00:01.500Z",
  };
  store.list.mockReset();
  store.list.mockResolvedValueOnce([localMutation]).mockResolvedValue([]);
  store.markSyncing.mockResolvedValue(localMutation);
  store.replace.mockResolvedValue(rebasedMutation);
  store.readPending.mockResolvedValue(rebasedMutation);
  api.save.mockRejectedValueOnce(new api.ApiError(409)).mockResolvedValueOnce({
   state: rebasedMutation.payload,
   updatedAt: "2026-07-14T00:00:03.000Z",
  });
  api.fetch.mockResolvedValue({
   state: remoteState,
   updatedAt: "2026-07-14T00:00:02.000Z",
  });

  const result = await syncPendingLearningStateMutations(ownerUserId);

  expect(store.replace).toHaveBeenCalledWith({
   mutation: localMutation,
   baseState: remoteState,
   state: rebasedMutation.payload,
   expectedUpdatedAt: "2026-07-14T00:00:02.000Z",
  });
  expect(api.fetch).toHaveBeenCalledWith(ownerUserId);
  expect(api.save).toHaveBeenLastCalledWith(
   rebasedMutation.payload,
   "2026-07-14T00:00:02.000Z",
   ownerUserId,
  );
  expect(result).toMatchObject({ status: "synced", syncedCount: 1, pendingCount: 0 });
 });

 it("keeps unrelated remote fields while applying local field changes", () => {
  const local: UserLearningState = {
   ...emptyLearningState,
   settings: { ...emptyLearningState.settings, lastLessonId: "local-lesson" },
  };
  const remote: UserLearningState = {
   ...emptyLearningState,
   settings: { ...emptyLearningState.settings, density: "compact" },
  };

  const merged = mergeLearningStateAfterConflict({ base: emptyLearningState, local, remote });

  expect(merged.settings.lastLessonId).toBe("local-lesson");
  expect(merged.settings.density).toBe("compact");
 });
});
