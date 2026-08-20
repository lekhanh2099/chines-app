import { beforeEach, describe, expect, it, vi } from "vitest";

import { emptyLearningState } from "@/features/hanzihome/utils/learning-state";
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

import { syncPendingLearningStateMutations } from "./learning-state-local-first";

const ownerUserId = "user-a";
const first: PendingLearningStateMutation = {
 id: `learning_state:${ownerUserId}:pending`,
 ownerUserId,
 type: "learning_state.replace",
 status: "pending",
 payload: emptyLearningState,
 baseState: emptyLearningState,
 expectedUpdatedAt: null,
 createdAt: "2026-08-20T00:00:00.000Z",
 updatedAt: "2026-08-20T00:00:01.000Z",
 attemptCount: 0,
};
const newer: PendingLearningStateMutation = {
 ...first,
 payload: {
  ...emptyLearningState,
  settings: { ...emptyLearningState.settings, lastLessonId: "lesson-newer" },
 },
 updatedAt: "2026-08-20T00:00:02.000Z",
};

describe("learning-state IndexedDB generation races", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("navigator", { onLine: true });
  store.clear.mockResolvedValue(true);
  store.readPending.mockResolvedValue(newer);
  api.save.mockResolvedValue({
   state: newer.payload,
   updatedAt: "2026-08-20T00:00:03.000Z",
  });
 });

 it("does not send a stale generation when compare-and-replace loses before syncing", async () => {
  store.list
   .mockResolvedValueOnce([first])
   .mockResolvedValueOnce([newer])
   .mockResolvedValueOnce([newer])
   .mockResolvedValueOnce([]);
  store.markSyncing.mockResolvedValueOnce(null).mockResolvedValueOnce(newer);

  const result = await syncPendingLearningStateMutations(ownerUserId);

  expect(api.save).toHaveBeenCalledOnce();
  expect(api.save).toHaveBeenCalledWith(newer.payload, null, ownerUserId);
  expect(store.clear).toHaveBeenCalledWith(ownerUserId, newer.updatedAt);
  expect(result).toMatchObject({ status: "synced", syncedCount: 1, pendingCount: 0 });
 });

 it("does not overwrite a newer generation when conflict rebase compare-and-replace loses", async () => {
  store.list
   .mockResolvedValueOnce([first])
   .mockResolvedValueOnce([newer])
   .mockResolvedValueOnce([newer])
   .mockResolvedValueOnce([]);
  store.markSyncing.mockResolvedValueOnce(first).mockResolvedValueOnce(newer);
  store.replace.mockResolvedValueOnce(null);
  api.save.mockRejectedValueOnce(new api.ApiError(409)).mockResolvedValueOnce({
   state: newer.payload,
   updatedAt: "2026-08-20T00:00:04.000Z",
  });
  api.fetch.mockResolvedValue({
   state: emptyLearningState,
   updatedAt: "2026-08-20T00:00:02.500Z",
  });

  const result = await syncPendingLearningStateMutations(ownerUserId);

  expect(store.replace).toHaveBeenCalledOnce();
  expect(api.save).toHaveBeenCalledTimes(2);
  expect(api.save).toHaveBeenLastCalledWith(newer.payload, null, ownerUserId);
  expect(store.clear).toHaveBeenCalledWith(ownerUserId, newer.updatedAt);
  expect(result).toMatchObject({ status: "synced", syncedCount: 1, pendingCount: 0 });
 });
});
