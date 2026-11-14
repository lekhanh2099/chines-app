"use client";

import { useSelector } from "@tanstack/react-store";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import type {
 CustomVocabItem,
 LearningStatus,
 UserLearningState,
} from "@/features/hanzihome/types";
import { loadLearningStateLocalFirst } from "@/features/hanzihome/local/learning-state-local-first";
import {
 emptyLearningState,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

import {
 defaultSyncUiState,
 learningStateSyncStore,
 syncLearningState,
 updateOwnerSyncUiState,
} from "./learning-state-sync-store";
import {
 applyBookmarkToggle,
 applyCustomVocabAdd,
 applyCustomVocabRemove,
 applyCustomVocabToggleByHanzi,
 applyCustomVocabUpdate,
 applyGrammarProgress,
 applySettingsUpdate,
 applyVocabProgress,
} from "./learning-state-update-model";
import { useLearningStateWrites } from "./useLearningStateWrites";

export { getLearningStateSyncState, type DurabilityStatus } from "./learning-state-sync-store";

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
  networkMode: "always",
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

export function useLearningSettings(): UserLearningState["settings"] {
 const { userId, isResolved } = useClientSession();
 const query = useQuery({
  queryKey: hanzihomeQueryKeys.learningState(userId),
  enabled: isResolved,
  networkMode: "always",
  queryFn: () =>
   userId
    ? loadLearningStateLocalFirst(userId)
    : Promise.resolve(normalizeLearningState(emptyLearningState)),
  select: (state) => state.settings,
 });
 return query.data ?? emptyLearningState.settings;
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
  networkMode: "always",
  queryFn: () =>
   userId
    ? loadLearningStateLocalFirst(userId)
    : Promise.resolve(normalizeLearningState(emptyLearningState)),
 });
 const state = useMemo(
  () => normalizeLearningState(query.data ?? emptyLearningState),
  [query.data],
 );
 const { retrySync, updateState, queueReviewEvidence, recordReview } = useLearningStateWrites({
  userId,
  queryClient,
  queryKey,
  queryData: query.data,
 });

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
    updateState((current) => applySettingsUpdate(current, settings)),

   updateVocabProgress: (id: string, status: LearningStatus) =>
    updateState((current) => applyVocabProgress(current, id, status)),

   updateGrammarProgress: (id: string, status: LearningStatus) =>
    updateState((current) => applyGrammarProgress(current, id, status)),

   toggleBookmark: (scope: keyof UserLearningState["bookmarks"], id: string) =>
    updateState((current) => applyBookmarkToggle(current, scope, id)),

   addCustomVocab: (items: readonly Omit<CustomVocabItem, "id" | "createdAt">[]) =>
    updateState((current) => applyCustomVocabAdd(current, items)),

   updateCustomVocab: (id: string, patch: Partial<Omit<CustomVocabItem, "id" | "createdAt">>) =>
    updateState((current) => applyCustomVocabUpdate(current, id, patch)),

   removeCustomVocab: (id: string) => updateState((current) => applyCustomVocabRemove(current, id)),

   toggleCustomVocabByHanzi: (item: Omit<CustomVocabItem, "id" | "createdAt">) =>
    updateState((current) => applyCustomVocabToggleByHanzi(current, item)),

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
