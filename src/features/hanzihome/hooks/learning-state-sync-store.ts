import { createStore } from "@tanstack/react-store";
import type { useQueryClient } from "@tanstack/react-query";

import type { UserLearningState } from "@/features/hanzihome/types";
import {
 refreshLearningStateFromRemoteIfClean,
 syncPendingLearningStateMutations,
 type LearningStateSyncResult,
 type LearningStateSyncStatus,
} from "@/features/hanzihome/local/learning-state-local-first";
import {
 syncPendingReviewAttempts,
 type ReviewAttemptInput,
} from "@/features/hanzihome/local/review-attempt-outbox";
import { normalizeLearningState } from "@/features/hanzihome/utils/learning-state";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

export type DurabilityStatus = "durable" | "memory-only" | "failed";

type LearningStateSyncUiState = {
 status: LearningStateSyncStatus;
 durability: DurabilityStatus;
 pendingCount: number;
 lastError: string | null;
 isOnline: boolean;
};

type LearningStateSyncStoreState = {
 byOwner: Map<string, LearningStateSyncUiState>;
};

export const defaultSyncUiState: LearningStateSyncUiState = {
 status: "synced",
 durability: "durable",
 pendingCount: 0,
 lastError: null,
 isOnline: true,
};

export const learningStateSyncStore = createStore<LearningStateSyncStoreState>({
 byOwner: new Map(),
});
export const learningStateWriteChains = new Map<string, Promise<void>>();

type FailedLearningStateWriteIntent = {
 baseState: UserLearningState;
 nextState: UserLearningState;
 reviewAttempt?: {
  attemptId: string;
  input: ReviewAttemptInput;
 };
};

type FailedReviewEvidenceIntent = {
 attemptId: string;
 input: ReviewAttemptInput;
};

export const failedWriteIntents = new Map<string, FailedLearningStateWriteIntent[]>();
export const failedReviewIntents = new Map<string, FailedReviewEvidenceIntent[]>();

export function getLearningStateSyncState(ownerUserId: string): LearningStateSyncUiState {
 return learningStateSyncStore.state.byOwner.get(ownerUserId) ?? defaultSyncUiState;
}

export function getOwnerSyncUiState(ownerUserId: string): LearningStateSyncUiState {
 return getLearningStateSyncState(ownerUserId);
}

export function updateOwnerSyncUiState(
 ownerUserId: string,
 update: (current: LearningStateSyncUiState) => LearningStateSyncUiState,
) {
 learningStateSyncStore.setState((state) => {
  const byOwner = new Map(state.byOwner);
  byOwner.set(ownerUserId, update(byOwner.get(ownerUserId) ?? defaultSyncUiState));
  return { byOwner };
 });
}

function updateSyncUiState(ownerUserId: string, result: LearningStateSyncResult) {
 updateOwnerSyncUiState(ownerUserId, (state) => ({
  ...state,
  status: result.status,
  pendingCount: result.pendingCount,
  lastError: result.error ?? null,
 }));
}

export async function syncLearningState(
 queryClient: ReturnType<typeof useQueryClient>,
 ownerUserId: string,
): Promise<LearningStateSyncResult> {
 updateOwnerSyncUiState(ownerUserId, (state) => ({ ...state, status: "syncing" }));
 const learningResult = await syncPendingLearningStateMutations(ownerUserId);
 const reviewResult = await syncPendingReviewAttempts(ownerUserId);
 const combined: LearningStateSyncResult = {
  ...learningResult,
  status:
   learningResult.status === "error" || reviewResult.status === "error"
    ? "error"
    : learningResult.pendingCount + reviewResult.pendingCount > 0
      ? "pending"
      : "synced",
  pendingCount: learningResult.pendingCount + reviewResult.pendingCount,
  error: learningResult.error ?? reviewResult.error,
 };
 updateSyncUiState(ownerUserId, combined);
 const queryKey = hanzihomeQueryKeys.learningState(ownerUserId);

 if (combined.state) {
  queryClient.setQueryData(queryKey, normalizeLearningState(combined.state));
 }
 if (combined.status === "synced") {
  try {
   const remoteState = await refreshLearningStateFromRemoteIfClean(ownerUserId);
   if (remoteState) {
    queryClient.setQueryData(queryKey, normalizeLearningState(remoteState));
   }
  } catch {
   // Remote refresh is opportunistic. Pending local writes remain observable in the owner sync state.
  }
 }
 return combined;
}
