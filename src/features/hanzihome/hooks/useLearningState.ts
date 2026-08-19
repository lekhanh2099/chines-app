"use client";

import type { JsonFieldValue } from "@/types/json";
import { createStore, useSelector } from "@tanstack/react-store";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
 emptyLearningState,
 nextProgress,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

type LearningStateSyncUiState = {
 status: LearningStateSyncStatus;
 pendingCount: number;
 lastError: string | null;
 isOnline: boolean;
};

const learningStateSyncStore = createStore<LearningStateSyncUiState>({
 status: "synced",
 pendingCount: 0,
 lastError: null,
 isOnline: true,
});
let learningStateWriteChain = Promise.resolve();

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

function updateSyncUiState(result: LearningStateSyncResult) {
 learningStateSyncStore.setState((state) => ({
  ...state,
  status: result.status,
  pendingCount: result.pendingCount,
  lastError: result.error ?? null,
 }));
}

async function syncLearningState(queryClient: ReturnType<typeof useQueryClient>) {
 learningStateSyncStore.setState((state) => ({ ...state, status: "syncing" }));
 const result = await syncPendingLearningStateMutations();
 updateSyncUiState(result);
 if (result.state) {
  queryClient.setQueryData(hanzihomeQueryKeys.learningState, normalizeLearningState(result.state));
 }
 if (result.status === "synced") {
  try {
   const remoteState = await refreshLearningStateFromRemoteIfClean();
   if (remoteState) {
    queryClient.setQueryData(hanzihomeQueryKeys.learningState, normalizeLearningState(remoteState));
   }
  } catch {
   // Remote refresh is opportunistic. Pending local writes remain observable in the sync store.
  }
 }
 return result;
}

export function LearningStateSyncAgent() {
 const queryClient = useQueryClient();
 const isOnline = useSyncExternalStore(
  subscribeToBrowserOnlineState,
  getBrowserOnlineState,
  getServerOnlineState,
 );
 const query = useQuery({
  queryKey: hanzihomeQueryKeys.learningState,
  queryFn: loadLearningStateLocalFirst,
 });

 useEffect(() => {
  learningStateSyncStore.setState((state) => ({ ...state, isOnline }));
  if (isOnline && query.isSuccess) void syncLearningState(queryClient);
 }, [isOnline, query.isSuccess, queryClient]);

 useEffect(() => {
  if (!query.isSuccess) return;
  const handleFocus = () => {
   void syncLearningState(queryClient);
  };

  window.addEventListener("focus", handleFocus);

  return () => {
   window.removeEventListener("focus", handleFocus);
  };
 }, [query.isSuccess, queryClient]);

 return null;
}

export function useLearningState() {
 const queryClient = useQueryClient();
 const syncUiState = useSelector(learningStateSyncStore, (value) => value);
 const query = useQuery({
  queryKey: hanzihomeQueryKeys.learningState,
  queryFn: loadLearningStateLocalFirst,
 });
 const state = useMemo(
  () => normalizeLearningState(query.data ?? emptyLearningState),
  [query.data],
 );
 const retrySync = useCallback(() => syncLearningState(queryClient), [queryClient]);
 const updateState = useCallback(
  (recipe: (state: UserLearningState) => UserLearningState) => {
   const current = normalizeLearningState(
    queryClient.getQueryData<UserLearningState>(hanzihomeQueryKeys.learningState) ??
     query.data ??
     emptyLearningState,
   );
   const nextState = normalizeLearningState(recipe(current));

   queryClient.setQueryData(hanzihomeQueryKeys.learningState, nextState);
   learningStateSyncStore.setState((value) => ({
    ...value,
    status: "pending",
    pendingCount: 1,
    lastError: null,
   }));
   learningStateWriteChain = learningStateWriteChain
    .catch(() => undefined)
    .then(() => saveLearningStateLocalFirst(current, nextState));

   void learningStateWriteChain
    .then(() => syncLearningState(queryClient))
    .catch((error: JsonFieldValue) => {
     const message =
      error instanceof Error ? error.message : "Could not save learning state locally.";
     learningStateSyncStore.setState((value) => ({
      ...value,
      status: "error",
      pendingCount: 1,
      lastError: message,
     }));
    });
  },
  [query.data, queryClient],
 );

 return useMemo(
  () => ({
   state,
   isLoading: query.isLoading,
   isSaving: syncUiState.status === "syncing",
   isError: query.isError || syncUiState.status === "error",
   isOnline: syncUiState.isOnline,
   syncStatus: syncUiState.status,
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

   appendReviewHistory: (
    item: Pick<UserLearningState["reviewHistory"][number], "type" | "id" | "label">,
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
  [query.isError, query.isLoading, retrySync, state, syncUiState, updateState],
 );
}
