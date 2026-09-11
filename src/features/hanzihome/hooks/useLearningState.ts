"use client";

import { createStore, useSelector } from "@tanstack/react-store";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import type { LearningStatus, ReviewResult, UserLearningState } from "@/features/hanzihome/types";
import {
 loadLearningStateLocalFirst,
 refreshLearningStateFromRemoteIfClean,
 saveLearningStateLocalFirst,
 syncPendingLearningStateMutations,
 type LearningStateSyncResult,
 type LearningStateSyncStatus,
} from "@/features/hanzihome/local/learning-state-local-first";
import {
 enqueueReviewAttempt,
 syncPendingReviewAttempts,
 type ReviewAttemptInput,
} from "@/features/hanzihome/local/review-attempt-outbox";
import {
 emptyLearningState,
 nextProgress,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";
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

type ReviewItem = Pick<UserLearningState["reviewHistory"][number], "type" | "id" | "label">;

const defaultSyncUiState: LearningStateSyncUiState = {
 status: "synced",
 durability: "durable",
 pendingCount: 0,
 lastError: null,
 isOnline: true,
};

const learningStateSyncStore = createStore<LearningStateSyncStoreState>({
 byOwner: new Map(),
});
const learningStateWriteChains = new Map<string, Promise<void>>();

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

const failedWriteIntents = new Map<string, FailedLearningStateWriteIntent[]>();
const failedReviewIntents = new Map<string, FailedReviewEvidenceIntent[]>();

export function getLearningStateSyncState(ownerUserId: string): LearningStateSyncUiState {
 return learningStateSyncStore.state.byOwner.get(ownerUserId) ?? defaultSyncUiState;
}

function getOwnerSyncUiState(ownerUserId: string): LearningStateSyncUiState {
 return getLearningStateSyncState(ownerUserId);
}

function getBrowserOnlineState() {
 return typeof window === "undefined" ? true : navigator.onLine;
}

function getServerOnlineState() {
 return true;
}

function subscribeToBrowserOnlineState(onStoreChange: () => void) {
 if (typeof window === "undefined") return () => undefined;

 window.addEventListener("online", onStoreChange);
 window.addEventListener("offline", onStoreChange);

 return () => {
  window.removeEventListener("online", onStoreChange);
  window.removeEventListener("offline", onStoreChange);
 };
}

function updateOwnerSyncUiState(
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

function reviewResultToLearningStatus(result: ReviewResult): LearningStatus {
 if (result === "known") return "known";
 if (result === "hard") return "hard";
 return "learning";
}

function reviewAttemptInput(item: ReviewItem, result: ReviewResult): ReviewAttemptInput {
 return {
  itemType: item.type,
  itemId: item.id,
  label: item.label,
  result,
 };
}

async function syncLearningState(
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

export function LearningStateSyncAgent() {
 const { userId, isResolved } = useClientSession();
 const queryClient = useQueryClient();
 const isOnline = useSyncExternalStore(
  subscribeToBrowserOnlineState,
  getBrowserOnlineState,
  getServerOnlineState,
 );
 const query = useQuery({
  queryKey: hanzihomeQueryKeys.learningState(userId),
  enabled: isResolved,
  queryFn: () =>
   userId
    ? loadLearningStateLocalFirst(userId)
    : Promise.resolve(normalizeLearningState(emptyLearningState)),
 });

 useEffect(() => {
  if (!userId) return;
  updateOwnerSyncUiState(userId, (state) => ({ ...state, isOnline }));
  if (isOnline && query.isSuccess) void syncLearningState(queryClient, userId);
 }, [isOnline, query.isSuccess, queryClient, userId]);

 useEffect(() => {
  if (!userId || !query.isSuccess) return;
  const handleFocus = () => {
   void syncLearningState(queryClient, userId);
  };

  window.addEventListener("focus", handleFocus);

  return () => {
   window.removeEventListener("focus", handleFocus);
  };
 }, [query.isSuccess, queryClient, userId]);

 return null;
}

export function useLearningState() {
 const { userId, isResolved } = useClientSession();
 const queryClient = useQueryClient();
 const syncUiState = useSelector(
  learningStateSyncStore,
  (value) => (userId ? value.byOwner.get(userId) : undefined) ?? defaultSyncUiState,
 );
 const queryKey = hanzihomeQueryKeys.learningState(userId);
 const query = useQuery({
  queryKey,
  enabled: isResolved,
  queryFn: () =>
   userId
    ? loadLearningStateLocalFirst(userId)
    : Promise.resolve(normalizeLearningState(emptyLearningState)),
 });
 const state = useMemo(
  () => normalizeLearningState(query.data ?? emptyLearningState),
  [query.data],
 );
 const retrySync = useCallback(async (): Promise<LearningStateSyncResult> => {
  if (!userId) {
   return {
    status: "synced",
    syncedCount: 0,
    pendingCount: 0,
   };
  }

  // 1. Recover and persist failed in-memory write intents to local IndexedDB
  const pendingWrites = failedWriteIntents.get(userId);
  if (pendingWrites && pendingWrites.length > 0) {
   failedWriteIntents.delete(userId);
   for (const [index, intent] of pendingWrites.entries()) {
    try {
     await saveLearningStateLocalFirst(userId, intent.baseState, intent.nextState, {
      reviewAttempt: intent.reviewAttempt,
     });
    } catch (writeErr) {
     const remaining = failedWriteIntents.get(userId) ?? [];
     failedWriteIntents.set(userId, [...pendingWrites.slice(index), ...remaining]);
     const message =
      writeErr instanceof Error ? writeErr.message : "Could not save learning state locally.";
     updateOwnerSyncUiState(userId, (value) => ({
      ...value,
      status: "error",
      durability: "failed",
      lastError: message,
     }));
     return {
      status: "error",
      syncedCount: 0,
      pendingCount: Math.max(1, getOwnerSyncUiState(userId).pendingCount),
      error: message,
     };
    }
   }
  }

  // 2. Recover and enqueue failed review evidence to outbox
  const pendingReviews = failedReviewIntents.get(userId);
  if (pendingReviews && pendingReviews.length > 0) {
   failedReviewIntents.delete(userId);
   for (const [index, review] of pendingReviews.entries()) {
    try {
     await enqueueReviewAttempt(userId, review.input, review.attemptId);
    } catch (reviewErr) {
     const remaining = failedReviewIntents.get(userId) ?? [];
     failedReviewIntents.set(userId, [...pendingReviews.slice(index), ...remaining]);
     const message =
      reviewErr instanceof Error ? reviewErr.message : "Could not queue review evidence.";
     updateOwnerSyncUiState(userId, (value) => ({
      ...value,
      status: "error",
      durability: "failed",
      lastError: message,
     }));
     return {
      status: "error",
      syncedCount: 0,
      pendingCount: Math.max(1, getOwnerSyncUiState(userId).pendingCount),
      error: message,
     };
    }
   }
  }

  // 3. Mark local state as durable
  updateOwnerSyncUiState(userId, (value) => ({
   ...value,
   durability: "durable",
   lastError: null,
  }));

  // 4. Drain from durable storage to remote
  return syncLearningState(queryClient, userId);
 }, [queryClient, userId]);

 const updateState = useCallback(
  (
   recipe: (state: UserLearningState) => UserLearningState,
   options?: {
    reviewAttempt?: {
     attemptId: string;
     input: ReviewAttemptInput;
    };
   },
  ) => {
   const current = normalizeLearningState(
    queryClient.getQueryData<UserLearningState>(queryKey) ?? query.data ?? emptyLearningState,
   );
   const nextState = normalizeLearningState(recipe(current));

   queryClient.setQueryData(queryKey, nextState);
   if (!userId) return;

   updateOwnerSyncUiState(userId, (value) => ({
    ...value,
    status: "pending",
    durability: "memory-only",
    pendingCount: Math.max(1, value.pendingCount),
    lastError: null,
   }));

   const previous = learningStateWriteChains.get(userId) ?? Promise.resolve();
   const nextWrite = previous
    .catch(() => undefined)
    .then(async () => {
     await saveLearningStateLocalFirst(userId, current, nextState, {
      reviewAttempt: options?.reviewAttempt,
     });
     updateOwnerSyncUiState(userId, (value) => ({
      ...value,
      durability: "durable",
     }));
    });
   learningStateWriteChains.set(userId, nextWrite);

   void nextWrite
    .then(() => syncLearningState(queryClient, userId))
    .catch((error: unknown) => {
     const message =
      error instanceof Error ? error.message : "Could not save learning state locally.";
     const userFailed = failedWriteIntents.get(userId) ?? [];
     userFailed.push({
      baseState: current,
      nextState,
      reviewAttempt: options?.reviewAttempt,
     });
     failedWriteIntents.set(userId, userFailed);

     updateOwnerSyncUiState(userId, (value) => ({
      ...value,
      status: "error",
      durability: "failed",
      pendingCount: Math.max(1, value.pendingCount),
      lastError: message,
     }));
    })
    .finally(() => {
     if (learningStateWriteChains.get(userId) === nextWrite) {
      learningStateWriteChains.delete(userId);
     }
    });
  },
  [query.data, queryClient, queryKey, userId],
 );

 const queueReviewEvidence = useCallback(
  (item: ReviewItem, result: ReviewResult) => {
   if (!userId) return;
   const input = reviewAttemptInput(item, result);
   const attemptId = crypto.randomUUID();
   updateOwnerSyncUiState(userId, (value) => ({
    ...value,
    status: "pending",
    durability: "memory-only",
    pendingCount: Math.max(1, value.pendingCount),
    lastError: null,
   }));
   void enqueueReviewAttempt(userId, input, attemptId)
    .then(() => {
     updateOwnerSyncUiState(userId, (value) => ({
      ...value,
      durability: "durable",
     }));
     return item.type === "radical" ? syncLearningState(queryClient, userId) : undefined;
    })
    .catch((error: unknown) => {
     const userFailed = failedReviewIntents.get(userId) ?? [];
     userFailed.push({
      attemptId,
      input,
     });
     failedReviewIntents.set(userId, userFailed);

     updateOwnerSyncUiState(userId, (value) => ({
      ...value,
      status: "error",
      durability: "failed",
      pendingCount: Math.max(1, value.pendingCount),
      lastError: error instanceof Error ? error.message : "Could not queue review evidence.",
     }));
    });
  },
  [queryClient, userId],
 );

 const recordReview = useCallback(
  (item: ReviewItem, result: ReviewResult) => {
   if (!userId) return;
   const attemptInput = reviewAttemptInput(item, result);

   if (item.type === "radical") {
    queueReviewEvidence(item, result);
    return;
   }

   const attemptId = crypto.randomUUID();
   const status = reviewResultToLearningStatus(result);
   updateState(
    (current) => ({
     ...current,
     progress:
      item.type === "vocab"
       ? {
          ...current.progress,
          vocab: { ...current.progress.vocab, [item.id]: nextProgress(status) },
         }
       : {
          ...current.progress,
          grammar: { ...current.progress.grammar, [item.id]: nextProgress(status) },
         },
    }),
    {
     reviewAttempt: {
      attemptId,
      input: attemptInput,
     },
    },
   );
  },
  [queueReviewEvidence, updateState, userId],
 );

 return useMemo(
  () => ({
   state,
   isLoading: !isResolved || query.isLoading,
   isSaving: syncUiState.status === "syncing",
   isError: query.isError || syncUiState.status === "error",
   isOnline: syncUiState.isOnline,
   syncStatus: syncUiState.status,
   durability: syncUiState.durability,
   pendingSyncCount: syncUiState.pendingCount,
   lastSyncError: syncUiState.lastError,
   retrySync,

   updateSettings: (settings: Partial<UserLearningState["settings"]>) =>
    updateState((current) => ({
     ...current,
     settings: { ...current.settings, ...settings },
    })),

   updateVocabProgress: (id: string, status: LearningStatus) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      vocab: { ...current.progress.vocab, [id]: nextProgress(status) },
     },
    })),

   updateGrammarProgress: (id: string, status: LearningStatus) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      grammar: { ...current.progress.grammar, [id]: nextProgress(status) },
     },
    })),

   toggleBookmark: (scope: keyof UserLearningState["bookmarks"], id: string) =>
    updateState((current) => {
     const existing = current.bookmarks[scope] || [];
     const nextItems = existing.includes(id)
      ? existing.filter((item) => item !== id)
      : [...existing, id];

     return {
      ...current,
      bookmarks: { ...current.bookmarks, [scope]: nextItems },
     };
    }),

   // Compatibility name for existing review surfaces: it now queues immutable
   // attempt evidence and deliberately never appends user_learning_state.review_history.
   appendReviewHistory: queueReviewEvidence,
   recordReview,
  }),
  [
   isResolved,
   query.isError,
   query.isLoading,
   queueReviewEvidence,
   recordReview,
   retrySync,
   state,
   syncUiState,
   updateState,
  ],
 );
}
