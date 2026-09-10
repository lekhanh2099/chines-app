"use client";

import { parseErrorLike, type ErrorInput } from "@/types/error";
import {
 HanziHomeApiError,
 fetchHanziHomeLearningState,
 saveHanziHomeLearningState,
} from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import type { UserLearningState } from "@/features/hanzihome/types";
import { z } from "zod";
import {
 emptyLearningState,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

import { mergeLearningStateAfterConflict } from "./learning-state-conflict-merge";
import type { ReviewAttemptInput } from "./review-attempt-outbox";
import {
 acknowledgeLearningStateSyncAtomic,
 captureLearningStateGeneration,
 commitCleanRemoteRefreshAtomic,
 listPendingLearningStateMutations,
 markLearningStateMutationFailedAtomic,
 markLearningStateMutationSyncing,
 readLocalLearningState,
 rebaseLearningStateMutationAtomic,
 saveLearningStateAtomic,
 writeLocalLearningState,
} from "./learning-state-local-store";

export { mergeLearningStateAfterConflict };

export const LearningStateSyncStatusSchema = z.enum(["synced", "pending", "syncing", "error"]);
export type LearningStateSyncStatus = z.infer<typeof LearningStateSyncStatusSchema>;
type Nullable<T> = T | null;
type Optional<T> = T | undefined;

export type LearningStateSyncResult = {
 status: LearningStateSyncStatus;
 syncedCount: number;
 pendingCount: number;
 state?: UserLearningState;
 error?: string;
};

type OwnerRuntime = {
 remoteRefreshInFlight: Nullable<Promise<Nullable<UserLearningState>>>;
 remoteSyncInFlight: Nullable<Promise<LearningStateSyncResult>>;
 lastRemoteRefreshAt: number;
};

const remoteRefreshCooldownMs = 15_000;
const ownerRuntime = new Map<string, OwnerRuntime>();

function runtimeFor(ownerUserId: string) {
 const existing = ownerRuntime.get(ownerUserId);
 if (existing) return existing;
 const created: OwnerRuntime = {
  remoteRefreshInFlight: null,
  remoteSyncInFlight: null,
  lastRemoteRefreshAt: 0,
 };
 ownerRuntime.set(ownerUserId, created);
 return created;
}

function isBrowserOnline() {
 return typeof navigator === "undefined" || navigator.onLine;
}

function errorMessage(error: ErrorInput) {
 return parseErrorLike(error).message || "Unknown learning-state sync error";
}

export async function loadLearningStateLocalFirst(ownerUserId: string): Promise<UserLearningState> {
 const local = await readLocalLearningState(ownerUserId).catch(() => null);
 if (local) return normalizeLearningState(local.state);

 try {
  const remote = await fetchHanziHomeLearningState(ownerUserId);
  const remoteState = normalizeLearningState(remote.state);
  await writeLocalLearningState({
   ownerUserId,
   state: remoteState,
   lastSyncedState: remoteState,
   remoteUpdatedAt: remote.updatedAt,
   lastSyncedAt: new Date().toISOString(),
  });
  runtimeFor(ownerUserId).lastRemoteRefreshAt = Date.now();
  return remoteState;
 } catch (error) {
  if (!isBrowserOnline()) return normalizeLearningState(emptyLearningState);
  throw error;
 }
}

export async function saveLearningStateLocalFirst(
 ownerUserId: string,
 baseState: UserLearningState,
 state: UserLearningState,
 options?: {
  reviewAttempt?: {
   attemptId: string;
   input: ReviewAttemptInput;
  };
 },
): Promise<void> {
 await saveLearningStateAtomic({
  ownerUserId,
  baseState,
  nextState: state,
  reviewAttempt: options?.reviewAttempt,
 });
}

export async function refreshLearningStateFromRemoteIfClean(
 ownerUserId: string,
): Promise<Nullable<UserLearningState>> {
 if (!isBrowserOnline()) return null;
 const runtime = runtimeFor(ownerUserId);
 if (runtime.remoteRefreshInFlight) return runtime.remoteRefreshInFlight;
 if (Date.now() - runtime.lastRemoteRefreshAt < remoteRefreshCooldownMs) return null;

 const inFlight = (async () => {
  const captured = await captureLearningStateGeneration(ownerUserId);
  if (captured.hasPending) return null;

  try {
   const remote = await fetchHanziHomeLearningState(ownerUserId);
   const remoteState = normalizeLearningState(remote.state);
   const committed = await commitCleanRemoteRefreshAtomic({
    ownerUserId,
    capturedLocalUpdatedAt: captured.localUpdatedAt,
    remoteState,
    remoteUpdatedAt: remote.updatedAt,
   });
   return committed ? remoteState : null;
  } finally {
   runtime.lastRemoteRefreshAt = Date.now();
  }
 })().finally(() => {
  runtime.remoteRefreshInFlight = null;
 });

 runtime.remoteRefreshInFlight = inFlight;
 return inFlight;
}

export async function syncPendingLearningStateMutations(
 ownerUserId: string,
): Promise<LearningStateSyncResult> {
 const runtime = runtimeFor(ownerUserId);
 if (runtime.remoteSyncInFlight) return runtime.remoteSyncInFlight;

 const inFlight = drainPendingLearningStateMutations(ownerUserId).finally(() => {
  runtime.remoteSyncInFlight = null;
 });
 runtime.remoteSyncInFlight = inFlight;
 return inFlight;
}

async function drainPendingLearningStateMutations(
 ownerUserId: string,
): Promise<LearningStateSyncResult> {
 let syncedCount = 0;
 let latestState: Optional<UserLearningState>;

 while (true) {
  const result = await syncPendingLearningStateMutationsOnce(ownerUserId);
  syncedCount += result.syncedCount;
  latestState = result.state ?? latestState;

  if (result.status === "error" || result.pendingCount === 0 || !isBrowserOnline()) {
   return {
    ...result,
    syncedCount,
    state: latestState,
   };
  }

  // A pending generation that survives a successful pass means a newer local
  // write arrived while the previous request was in flight. Drain it now rather
  // than waiting for focus/online/a later mutation to trigger another sync.
 }
}

async function syncPendingLearningStateMutationsOnce(
 ownerUserId: string,
): Promise<LearningStateSyncResult> {
 if (!isBrowserOnline()) {
  const pending = await listPendingLearningStateMutations(ownerUserId).catch(() => []);
  return {
   status: pending.length ? "pending" : "synced",
   syncedCount: 0,
   pendingCount: pending.length,
  };
 }

 const pending = await listPendingLearningStateMutations(ownerUserId);
 if (pending.length === 0) {
  return { status: "synced", syncedCount: 0, pendingCount: 0 };
 }

 let syncedCount = 0;
 let latestState: Optional<UserLearningState>;

 for (const mutation of pending) {
  if (mutation.ownerUserId !== ownerUserId) continue;
  const syncingMutation = await markLearningStateMutationSyncing(mutation);
  // A newer local generation won the IndexedDB compare-and-replace between the
  // list read and this transition. Never overwrite it with the stale generation.
  if (!syncingMutation) continue;
  let activeMutation = syncingMutation;

  try {
   let saved;
   try {
    saved = await saveHanziHomeLearningState(
     activeMutation.payload,
     activeMutation.expectedUpdatedAt ?? null,
     ownerUserId,
    );
   } catch (error) {
    if (!(error instanceof HanziHomeApiError) || error.status !== 409) throw error;
    const remote = await fetchHanziHomeLearningState(ownerUserId);
    const remoteState = normalizeLearningState(remote.state);
    const mergedState = mergeLearningStateAfterConflict({
     base: normalizeLearningState(activeMutation.baseState ?? emptyLearningState),
     local: activeMutation.payload,
     remote: remoteState,
    });
    const rebasedMutation = await rebaseLearningStateMutationAtomic({
     ownerUserId,
     expectedMutationUpdatedAt: activeMutation.updatedAt,
     baseState: remoteState,
     mergedState,
     remoteUpdatedAt: remote.updatedAt,
    });
    // A newer local edit appeared while the conflict was being fetched/merged.
    // Leave that newer generation untouched; the outer drain loop will send it.
    if (!rebasedMutation) continue;
    activeMutation = rebasedMutation;
    saved = await saveHanziHomeLearningState(mergedState, remote.updatedAt, ownerUserId);
   }
   const savedState = normalizeLearningState(saved.state);
   const acknowledged = await acknowledgeLearningStateSyncAtomic({
    ownerUserId,
    expectedMutationUpdatedAt: activeMutation.updatedAt,
    savedState,
    remoteUpdatedAt: saved.updatedAt,
   });
   if (acknowledged) {
    latestState = savedState;
    syncedCount++;
   }
  } catch (error) {
   const message = errorMessage(error);
   await markLearningStateMutationFailedAtomic({
    ownerUserId,
    expectedMutationUpdatedAt: activeMutation.updatedAt,
    error: message,
   });

   const remaining = await listPendingLearningStateMutations(ownerUserId).catch(() => []);
   return {
    status: "error",
    syncedCount,
    pendingCount: remaining.length,
    state: latestState,
    error: message,
   };
  }
 }

 const remaining = await listPendingLearningStateMutations(ownerUserId);
 return {
  status: remaining.length ? "pending" : "synced",
  syncedCount,
  pendingCount: remaining.length,
  state: latestState,
 };
}
