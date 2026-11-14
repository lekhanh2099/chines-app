"use client";

import { useCallback } from "react";
import type { UseQueryResult, useQueryClient } from "@tanstack/react-query";

import type { useClientSession } from "@/components/providers/QueryProvider";
import type { ReviewResult, UserLearningState } from "@/features/hanzihome/types";
import {
 saveLearningStateLocalFirst,
 type LearningStateSyncResult,
} from "@/features/hanzihome/local/learning-state-local-first";
import {
 enqueueReviewAttempt,
 type ReviewAttemptInput,
} from "@/features/hanzihome/local/review-attempt-outbox";
import {
 emptyLearningState,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";
import type { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

import {
 failedReviewIntents,
 failedWriteIntents,
 getOwnerSyncUiState,
 learningStateWriteChains,
 syncLearningState,
 updateOwnerSyncUiState,
} from "./learning-state-sync-store";
import {
 applyReviewProgress,
 reviewAttemptInput,
 reviewResultToLearningStatus,
 type ReviewItem,
} from "./learning-state-update-model";

export function useLearningStateWrites({
 userId,
 queryClient,
 queryKey,
 queryData,
}: {
 userId: ReturnType<typeof useClientSession>["userId"];
 queryClient: ReturnType<typeof useQueryClient>;
 queryKey: ReturnType<typeof hanzihomeQueryKeys.learningState>;
 queryData: UseQueryResult<UserLearningState>["data"];
}) {
 const retrySync = useCallback(async (): Promise<LearningStateSyncResult> => {
  if (!userId) {
   return {
    status: "synced",
    syncedCount: 0,
    pendingCount: 0,
   };
  }

  // 1. Recover in the same owner write chain as fresh actions. Every failed
  // intent keeps its review evidence, while state replay uses the latest
  // optimistic snapshot so an older retry cannot overwrite a newer action.
  const previous = learningStateWriteChains.get(userId) ?? Promise.resolve();
  const retryWrites = previous
   .catch(() => undefined)
   .then(async () => {
    let pendingWrites = failedWriteIntents.get(userId);
    while (pendingWrites && pendingWrites.length > 0) {
     failedWriteIntents.delete(userId);
     for (const [index, intent] of pendingWrites.entries()) {
      const latestState = normalizeLearningState(
       queryClient.getQueryData<UserLearningState>(queryKey) ?? intent.nextState,
      );
      try {
       await saveLearningStateLocalFirst(userId, latestState, latestState, {
        reviewAttempt: intent.reviewAttempt,
       });
      } catch (writeErr) {
       const remaining = failedWriteIntents.get(userId) ?? [];
       failedWriteIntents.set(userId, [...pendingWrites.slice(index), ...remaining]);
       throw writeErr;
      }
     }
     pendingWrites = failedWriteIntents.get(userId);
    }
   });
  learningStateWriteChains.set(userId, retryWrites);

  try {
   await retryWrites;
  } catch (writeErr) {
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
  } finally {
   if (learningStateWriteChains.get(userId) === retryWrites) {
    learningStateWriteChains.delete(userId);
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
 }, [queryClient, queryKey, userId]);

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
    queryClient.getQueryData<UserLearningState>(queryKey) ?? queryData ?? emptyLearningState,
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
  [queryData, queryClient, queryKey, userId],
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
   updateState((current) => applyReviewProgress(current, item, status), {
    reviewAttempt: {
     attemptId,
     input: attemptInput,
    },
   });
  },
  [queueReviewEvidence, updateState, userId],
 );

 return { retrySync, updateState, queueReviewEvidence, recordReview };
}
