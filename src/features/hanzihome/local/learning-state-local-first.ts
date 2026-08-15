"use client";

import { parseErrorLike, type ErrorInput } from "@/types/error";
import {
 fetchHanziHomeLearningState,
 saveHanziHomeLearningState,
} from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import type { UserLearningState } from "@/features/hanzihome/types";
import { z } from "zod";
import {
 emptyLearningState,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

import {
 clearPendingLearningStateMutation,
 enqueueLearningStateSync,
 listPendingLearningStateMutations,
 markLearningStateMutationFailed,
 markLearningStateMutationSyncing,
 readLocalLearningState,
 readPendingLearningStateMutation,
 writeLocalLearningState,
 type PendingLearningStateMutation,
} from "./learning-state-local-store";

export const LearningStateSyncStatusSchema = z.enum(["synced", "pending", "syncing", "error"]);
export type LearningStateSyncStatus = z.infer<typeof LearningStateSyncStatusSchema>;
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
type Optional<T> = z.infer<z.ZodOptional<z.ZodType<T>>>;

export type LearningStateSyncResult = {
 status: LearningStateSyncStatus;
 syncedCount: number;
 pendingCount: number;
 state?: UserLearningState;
 error?: string;
};

const remoteRefreshCooldownMs = 15_000;
let remoteRefreshInFlight: Nullable<Promise<Nullable<UserLearningState>>> = null;
let remoteSyncInFlight: Nullable<Promise<LearningStateSyncResult>> = null;
let lastRemoteRefreshAt = 0;

function isBrowserOnline() {
 return typeof navigator === "undefined" || navigator.onLine;
}

function errorMessage(error: ErrorInput) {
 return parseErrorLike(error).message || "Unknown learning-state sync error";
}

export async function loadLearningStateLocalFirst(): Promise<UserLearningState> {
 const local = await readLocalLearningState().catch(() => null);
 if (local) return normalizeLearningState(local.state);

 try {
  const remoteState = normalizeLearningState(await fetchHanziHomeLearningState());
  await writeLocalLearningState({
   state: remoteState,
   lastSyncedAt: new Date().toISOString(),
  });
  return remoteState;
 } catch {
  return normalizeLearningState(emptyLearningState);
 }
}

export async function saveLearningStateLocalFirst(state: UserLearningState): Promise<void> {
 const normalized = normalizeLearningState(state);

 await writeLocalLearningState({ state: normalized });
 await enqueueLearningStateSync(normalized);
}

export async function refreshLearningStateFromRemoteIfClean(): Promise<
 Nullable<UserLearningState>
> {
 if (!isBrowserOnline()) return null;
 if (remoteRefreshInFlight) return remoteRefreshInFlight;
 if (Date.now() - lastRemoteRefreshAt < remoteRefreshCooldownMs) return null;

 remoteRefreshInFlight = (async () => {
  const pending = await readPendingLearningStateMutation();
  if (pending) return null;

  try {
   const remoteState = normalizeLearningState(await fetchHanziHomeLearningState());
   await writeLocalLearningState({
    state: remoteState,
    lastSyncedAt: new Date().toISOString(),
   });
   return remoteState;
  } finally {
   // Failed/unauthenticated attempts must also respect the cooldown. Without
   // this, every focus event retries the same request immediately.
   lastRemoteRefreshAt = Date.now();
  }
 })().finally(() => {
  remoteRefreshInFlight = null;
 });

 return remoteRefreshInFlight;
}

function shouldApplySyncResult(
 current: Nullable<PendingLearningStateMutation>,
 syncing: PendingLearningStateMutation,
) {
 return Boolean(current && current.updatedAt === syncing.updatedAt);
}

export async function syncPendingLearningStateMutations(): Promise<LearningStateSyncResult> {
 if (remoteSyncInFlight) return remoteSyncInFlight;

 remoteSyncInFlight = syncPendingLearningStateMutationsOnce().finally(() => {
  remoteSyncInFlight = null;
 });

 return remoteSyncInFlight;
}

async function syncPendingLearningStateMutationsOnce(): Promise<LearningStateSyncResult> {
 if (!isBrowserOnline()) {
  const pending = await listPendingLearningStateMutations().catch(() => []);
  return {
   status: pending.length ? "pending" : "synced",
   syncedCount: 0,
   pendingCount: pending.length,
  };
 }

 const pending = await listPendingLearningStateMutations();
 if (pending.length === 0) {
  return { status: "synced", syncedCount: 0, pendingCount: 0 };
 }

 let syncedCount = 0;
 let latestState: Optional<UserLearningState>;

 for (const mutation of pending) {
  const syncingMutation = await markLearningStateMutationSyncing(mutation);

  try {
   const savedState = normalizeLearningState(
    await saveHanziHomeLearningState(syncingMutation.payload),
   );
   const currentMutation = await readPendingLearningStateMutation();

   if (shouldApplySyncResult(currentMutation, syncingMutation)) {
    await writeLocalLearningState({
     state: savedState,
     lastSyncedAt: new Date().toISOString(),
    });
    await clearPendingLearningStateMutation();
    latestState = savedState;
    syncedCount++;
   }
  } catch (error) {
   const currentMutation = await readPendingLearningStateMutation();
   const message = errorMessage(error);

   if (shouldApplySyncResult(currentMutation, syncingMutation)) {
    await markLearningStateMutationFailed({
     mutation: syncingMutation,
     error: message,
    });
   }

   const remaining = await listPendingLearningStateMutations().catch(() => []);
   return {
    status: "error",
    syncedCount,
    pendingCount: remaining.length,
    state: latestState,
    error: message,
   };
  }
 }

 const remaining = await listPendingLearningStateMutations();
 return {
  status: remaining.length ? "pending" : "synced",
  syncedCount,
  pendingCount: remaining.length,
  state: latestState,
 };
}
