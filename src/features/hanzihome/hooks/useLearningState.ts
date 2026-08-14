"use client";

import type { JsonFieldValue } from "@/types/json";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import type { LearningStatus, ReviewResult, UserLearningState } from "@/features/hanzihome/types";
import {
 loadLearningStateLocalFirst,
 refreshLearningStateFromRemoteIfClean,
 saveLearningStateLocalFirst,
 syncPendingLearningStateMutations,
 type LearningStateSyncResult,
 type LearningStateSyncStatus,
} from "@/features/hanzihome/local/learning-state-local-first";
import { nextScheduledProgress } from "@/features/hanzihome/review/review-scheduler";
import {
 emptyLearningState,
 nextProgress,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

const learningStateQueryKey = ["hanzihome", "learning-state"];

type ReviewableProgressScope = keyof UserLearningState["progress"];

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

export function useLearningState({ enabled = true }: { enabled?: boolean } = {}) {
 const queryClient = useQueryClient();
 const writeChainRef = useRef<Promise<void>>(Promise.resolve());
 const syncInFlightRef = useRef<Promise<LearningStateSyncResult>>(null);
 const [syncStatus, setSyncStatus] = useState<LearningStateSyncStatus>("synced");
 const [pendingSyncCount, setPendingSyncCount] = useState(0);
 const [lastSyncError, setLastSyncError] = useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const isOnline = useSyncExternalStore(
  subscribeToBrowserOnlineState,
  getBrowserOnlineState,
  getServerOnlineState,
 );
 const query = useQuery({
  queryKey: learningStateQueryKey,
  queryFn: loadLearningStateLocalFirst,
  enabled,
 });

 const applySyncResult = useCallback(
  (result: LearningStateSyncResult) => {
   setSyncStatus(result.status);
   setPendingSyncCount(result.pendingCount);
   setLastSyncError(result.error ?? null);

   if (result.state) {
    queryClient.setQueryData(learningStateQueryKey, normalizeLearningState(result.state));
   }
  },
  [queryClient],
 );

 const refreshRemoteIfClean = useCallback(async () => {
  try {
   const remoteState = await refreshLearningStateFromRemoteIfClean();
   if (remoteState) {
    queryClient.setQueryData(learningStateQueryKey, normalizeLearningState(remoteState));
   }
  } catch {
   // Remote refresh is opportunistic. Pending local writes are handled by the sync queue.
  }
 }, [queryClient]);

 const syncPendingMutations = useCallback(async () => {
  if (syncInFlightRef.current) return syncInFlightRef.current;

  setSyncStatus("syncing");
  syncInFlightRef.current = syncPendingLearningStateMutations()
   .then((result) => {
    applySyncResult(result);
    return result;
   })
   .finally(() => {
    syncInFlightRef.current = null;
   });

  return syncInFlightRef.current;
 }, [applySyncResult]);

 const syncThenRefresh = useCallback(async () => {
  const result = await syncPendingMutations();
  if (result.status === "synced") {
   await refreshRemoteIfClean();
  }
  return result;
 }, [refreshRemoteIfClean, syncPendingMutations]);

 const state = useMemo(
  () => normalizeLearningState(query.data ?? emptyLearningState),
  [query.data],
 );

 const updateState = useCallback(
  (recipe: (state: UserLearningState) => UserLearningState) => {
   const current = normalizeLearningState(
    queryClient.getQueryData<UserLearningState>(learningStateQueryKey) ??
     query.data ??
     emptyLearningState,
   );
   const nextState = normalizeLearningState(recipe(current));

   queryClient.setQueryData(learningStateQueryKey, nextState);
   setSyncStatus("pending");
   setPendingSyncCount(1);
   setLastSyncError(null);

   writeChainRef.current = writeChainRef.current
    .catch(() => undefined)
    .then(() => saveLearningStateLocalFirst(nextState));

   void writeChainRef.current
    .then(() => syncPendingMutations())
    .catch((error: JsonFieldValue) => {
     const message =
      error instanceof Error ? error.message : "Could not save learning state locally.";
     setSyncStatus("error");
     setPendingSyncCount(1);
     setLastSyncError(message);
    });
  },
  [query.data, queryClient, syncPendingMutations],
 );

 useEffect(() => {
  if (!enabled || !query.isSuccess) return;

  void syncThenRefresh();

  const handleOnline = () => {
   void syncThenRefresh();
  };
  const handleFocus = () => {
   void syncThenRefresh();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("focus", handleFocus);

  return () => {
   window.removeEventListener("online", handleOnline);
   window.removeEventListener("focus", handleFocus);
  };
 }, [enabled, query.isSuccess, syncThenRefresh]);

 return useMemo(
  () => ({
   state,
   isLoading: query.isLoading,
   isSaving: syncStatus === "syncing",
   isError: query.isError || syncStatus === "error",
   isOnline,
   syncStatus,
   pendingSyncCount,
   lastSyncError,
   retrySync: syncThenRefresh,

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

   recordReview: (
    item: {
     type: ReviewableProgressScope;
     id: string;
    },
    result: ReviewResult,
   ) =>
    updateState((current) => {
     const reviewedAt = new Date();
     const currentProgress = current.progress[item.type] ?? {};
     const nextItemProgress = nextScheduledProgress(
      currentProgress[item.id],
      result,
      reviewedAt,
     );

     return {
      ...current,
      progress: {
       ...current.progress,
       [item.type]: {
        ...currentProgress,
        [item.id]: nextItemProgress,
       },
      },
      reviewHistory: [
       ...current.reviewHistory,
       {
        type: item.type,
        id: item.id,
        result,
        answeredAt: reviewedAt.toISOString(),
       },
      ],
     };
    }),

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

   appendReviewHistory: (
    item: {
     type: UserLearningState["reviewHistory"][number]["type"];
     id: string;
    },
    result: ReviewResult,
   ) =>
    updateState((current) => ({
     ...current,
     reviewHistory: [
      ...current.reviewHistory,
      { ...item, result, answeredAt: new Date().toISOString() },
     ],
    })),
  }),
  [
   isOnline,
   lastSyncError,
   pendingSyncCount,
   query.isError,
   query.isLoading,
   state,
   syncStatus,
   syncThenRefresh,
   updateState,
  ],
 );
}
