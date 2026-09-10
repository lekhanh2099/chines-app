import { beforeEach, describe, expect, it, vi } from "vitest";

import { emptyLearningState, nextProgress } from "@/features/hanzihome/utils/learning-state";
import type { UserLearningState } from "@/features/hanzihome/types";

// In-memory simulated storage for IndexedDB transactions
const storage = new Map<string, Map<string, unknown>>();

function getStoreMap(name: string) {
 let map = storage.get(name);
 if (!map) {
  map = new Map<string, unknown>();
  storage.set(name, map);
 }
 return map;
}

vi.mock("./hanzihome-local-db", () => ({
 HANZIHOME_LOCAL_STORES: {
  learningState: "learning_state",
  pendingMutations: "pending_mutations",
 },
 deleteFromStore: vi.fn((name: string, key: string) => {
  getStoreMap(name).delete(key);
  return Promise.resolve();
 }),
 deleteFromStoreIf: vi.fn((name: string, key: string) => {
  getStoreMap(name).delete(key);
  return Promise.resolve(true);
 }),
 readFromStore: vi.fn((name: string, key: string) => {
  return Promise.resolve(getStoreMap(name).get(key) ?? null);
 }),
 putInStore: vi.fn((name: string, value: { id: string }) => {
  getStoreMap(name).set(value.id, value);
  return Promise.resolve();
 }),
 getAllFromStoreMatching: vi.fn((name: string) => {
  return Promise.resolve(Array.from(getStoreMap(name).values()));
 }),
 replaceInStoreIf: vi.fn(),
 promisifyRequest: (request: { result: unknown; onsuccess?: () => void }) => {
  return Promise.resolve(request.result);
 },
 runInLocalTransaction: async (
  storeNames: string[],
  _mode: string,
  operation: (stores: Record<string, unknown>, tx: unknown) => Promise<unknown>,
 ) => {
  const staging = new Map<string, Map<string, unknown>>();
  for (const name of storeNames) {
   staging.set(name, new Map(getStoreMap(name)));
  }

  const stores: Record<string, unknown> = {};
  for (const name of storeNames) {
   stores[name] = {
    get: (key: string) => ({
     result: staging.get(name)?.get(key),
    }),
    put: (val: { id: string }) => {
     staging.get(name)?.set(val.id, val);
    },
    delete: (key: string) => {
     staging.get(name)?.delete(key);
    },
   };
  }

  const result = await operation(stores, {});

  // Commit on complete
  for (const name of storeNames) {
   const staged = staging.get(name);
   if (staged) {
    storage.set(name, staged);
   }
  }

  return result;
 },
}));

import {
 acknowledgeLearningStateSyncAtomic,
 captureLearningStateGeneration,
 commitCleanRemoteRefreshAtomic,
 markLearningStateMutationFailedAtomic,
 readLocalLearningState,
 readPendingLearningStateMutation,
 rebaseLearningStateMutationAtomic,
 saveLearningStateAtomic,
} from "./learning-state-local-store";

const ownerUserId = "user-atomic";

describe("learning-state-local-store atomic operations", () => {
 beforeEach(() => {
  storage.clear();
 });

 it("commits local state and pending mutation atomically in a single transaction", async () => {
  const nextState: UserLearningState = {
   ...emptyLearningState,
   settings: { ...emptyLearningState.settings, lastLessonId: "lesson-atomic-1" },
  };

  const { localRecord, pendingMutation, reviewMutation } = await saveLearningStateAtomic({
   ownerUserId,
   baseState: emptyLearningState,
   nextState,
  });

  expect(localRecord.state.settings.lastLessonId).toBe("lesson-atomic-1");
  expect(pendingMutation.payload.settings.lastLessonId).toBe("lesson-atomic-1");
  expect(pendingMutation.status).toBe("pending");
  expect(reviewMutation).toBeUndefined();

  // Verify both stores are populated
  const stateStore = getStoreMap("learning_state");
  const mutationStore = getStoreMap("pending_mutations");
  expect(stateStore.get(`learning_state:${ownerUserId}:current`)).toEqual(localRecord);
  expect(mutationStore.get(`learning_state:${ownerUserId}:pending`)).toEqual(pendingMutation);
 });

 it("commits local state, pending mutation, and review attempt mutation atomically when reviewAttempt is provided", async () => {
  const nextState: UserLearningState = {
   ...emptyLearningState,
   progress: {
    ...emptyLearningState.progress,
    vocab: { "word-1": nextProgress("known") },
   },
  };
  const attemptId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  const { localRecord, pendingMutation, reviewMutation } = await saveLearningStateAtomic({
   ownerUserId,
   baseState: emptyLearningState,
   nextState,
   reviewAttempt: {
    attemptId,
    input: {
     itemType: "vocab",
     itemId: "word-1",
     label: "学习",
     result: "known",
    },
   },
  });

  expect(reviewMutation).toBeDefined();
  expect(reviewMutation?.attemptId).toBe(attemptId);
  expect(reviewMutation?.payload.itemId).toBe("word-1");

  const mutationStore = getStoreMap("pending_mutations");
  expect(mutationStore.get(`review_attempt:${ownerUserId}:${attemptId}`)).toEqual(reviewMutation);
  expect(mutationStore.get(`learning_state:${ownerUserId}:pending`)).toEqual(pendingMutation);
  const stateStore = getStoreMap("learning_state");
  expect(stateStore.get(`learning_state:${ownerUserId}:current`)).toEqual(localRecord);
 });

 it("acknowledges sync atomically only when mutation generation matches", async () => {
  const savedState: UserLearningState = {
   ...emptyLearningState,
   settings: { ...emptyLearningState.settings, lastLessonId: "lesson-synced" },
  };

  const { pendingMutation } = await saveLearningStateAtomic({
   ownerUserId,
   baseState: emptyLearningState,
   nextState: savedState,
  });

  // Attempt acknowledge with mismatching generation -> should fail and preserve pending mutation
  const mismatchResult = await acknowledgeLearningStateSyncAtomic({
   ownerUserId,
   expectedMutationUpdatedAt: "2026-01-01T00:00:00.000Z",
   savedState,
   remoteUpdatedAt: "2026-08-20T01:00:00.000Z",
  });
  expect(mismatchResult).toBe(false);
  expect(getStoreMap("pending_mutations").has(`learning_state:${ownerUserId}:pending`)).toBe(true);

  // Attempt acknowledge with matching generation -> should succeed and clear pending mutation
  const matchResult = await acknowledgeLearningStateSyncAtomic({
   ownerUserId,
   expectedMutationUpdatedAt: pendingMutation.updatedAt,
   savedState,
   remoteUpdatedAt: "2026-08-20T01:00:00.000Z",
  });
  expect(matchResult).toBe(true);
  expect(getStoreMap("pending_mutations").has(`learning_state:${ownerUserId}:pending`)).toBe(false);

  const stateRecord = await readLocalLearningState(ownerUserId);
  expect(stateRecord?.lastSyncedState?.settings.lastLessonId).toBe("lesson-synced");
  expect(stateRecord?.remoteUpdatedAt).toBe("2026-08-20T01:00:00.000Z");
 });

 it("marks mutation failed atomically when generation matches", async () => {
  const { pendingMutation } = await saveLearningStateAtomic({
   ownerUserId,
   baseState: emptyLearningState,
   nextState: emptyLearningState,
  });

  const failedResult = await markLearningStateMutationFailedAtomic({
   ownerUserId,
   expectedMutationUpdatedAt: pendingMutation.updatedAt,
   error: "Server 500",
  });

  expect(failedResult).toBe(true);
  const updatedMutation = await readPendingLearningStateMutation(ownerUserId);
  expect(updatedMutation?.status).toBe("failed");
  expect(updatedMutation?.lastError).toBe("Server 500");

  const stateRecord = await readLocalLearningState(ownerUserId);
  expect(stateRecord?.lastSyncError).toBe("Server 500");
 });

 it("rebases mutation atomically over remote state on conflict", async () => {
  const localState: UserLearningState = {
   ...emptyLearningState,
   settings: { ...emptyLearningState.settings, lastLessonId: "lesson-local" },
  };
  const remoteState: UserLearningState = {
   ...emptyLearningState,
   settings: { ...emptyLearningState.settings, density: "compact" },
  };
  const mergedState: UserLearningState = {
   ...emptyLearningState,
   settings: { ...emptyLearningState.settings, lastLessonId: "lesson-local", density: "compact" },
  };

  const { pendingMutation } = await saveLearningStateAtomic({
   ownerUserId,
   baseState: emptyLearningState,
   nextState: localState,
  });

  const rebased = await rebaseLearningStateMutationAtomic({
   ownerUserId,
   expectedMutationUpdatedAt: pendingMutation.updatedAt,
   baseState: remoteState,
   mergedState,
   remoteUpdatedAt: "2026-08-20T02:00:00.000Z",
  });

  expect(rebased).not.toBeNull();
  expect(rebased?.payload.settings.lastLessonId).toBe("lesson-local");
  expect(rebased?.payload.settings.density).toBe("compact");
  expect(rebased?.baseState).toEqual(remoteState);
  expect(rebased?.expectedUpdatedAt).toBe("2026-08-20T02:00:00.000Z");

  const stateRecord = await readLocalLearningState(ownerUserId);
  expect(stateRecord?.state.settings.density).toBe("compact");
 });

 it("prevents clean remote refresh if a local write occurred during fetch or pending mutation exists", async () => {
  const remoteState: UserLearningState = {
   ...emptyLearningState,
   settings: { ...emptyLearningState.settings, lastLessonId: "lesson-remote" },
  };

  // 1. If pending mutation exists, refresh must abort
  await saveLearningStateAtomic({
   ownerUserId,
   baseState: emptyLearningState,
   nextState: emptyLearningState,
  });
  const refreshWithPending = await commitCleanRemoteRefreshAtomic({
   ownerUserId,
   capturedLocalUpdatedAt: "2026-01-01T00:00:00.000Z",
   remoteState,
   remoteUpdatedAt: "2026-08-20T03:00:00.000Z",
  });
  expect(refreshWithPending).toBe(false);

  // Clear pending mutation
  getStoreMap("pending_mutations").clear();

  // 2. Capture generation before fetch
  const captured = await captureLearningStateGeneration(ownerUserId);
  expect(captured.hasPending).toBe(false);

  // Simulate a newer local write occurring while fetch is in-flight
  await saveLearningStateAtomic({
   ownerUserId,
   baseState: emptyLearningState,
   nextState: {
    ...emptyLearningState,
    settings: { ...emptyLearningState.settings, lastLessonId: "newer" },
   },
  });
  getStoreMap("pending_mutations").clear(); // even if outbox was cleared, local generation changed!

  const refreshWithStaleCapture = await commitCleanRemoteRefreshAtomic({
   ownerUserId,
   capturedLocalUpdatedAt: captured.localUpdatedAt,
   remoteState,
   remoteUpdatedAt: "2026-08-20T03:00:00.000Z",
  });
  expect(refreshWithStaleCapture).toBe(false);

  // 3. Clean capture and commit without intervening writes
  const freshCapture = await captureLearningStateGeneration(ownerUserId);
  const cleanRefresh = await commitCleanRemoteRefreshAtomic({
   ownerUserId,
   capturedLocalUpdatedAt: freshCapture.localUpdatedAt,
   remoteState,
   remoteUpdatedAt: "2026-08-20T04:00:00.000Z",
  });
  expect(cleanRefresh).toBe(true);

  const stateRecord = await readLocalLearningState(ownerUserId);
  expect(stateRecord?.state.settings.lastLessonId).toBe("lesson-remote");
 });
});
