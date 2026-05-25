"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import type {
 LearningStatus,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";
import {
 emptyLearningState,
 nextProgress,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

const queryKey = ["learning-state"] as const;
const localStorageKey = "hanzihome-learning-state";

function readLocalLearningState() {
 if (typeof window === "undefined") return emptyLearningState;

 try {
  const localValue = window.localStorage.getItem(localStorageKey);
  return normalizeLearningState(
   localValue ? JSON.parse(localValue) : emptyLearningState,
  );
 } catch {
  return emptyLearningState;
 }
}

function writeLocalLearningState(state: UserLearningState) {
 if (typeof window === "undefined") return;

 try {
  window.localStorage.setItem(localStorageKey, JSON.stringify(state));
 } catch {
  // localStorage can fail in private mode/quota edge cases.
 }
}

async function readLearningState() {
 const response = await fetch("/api/learning-state", {
  method: "GET",
  cache: "no-store",
 });

 if (!response.ok) {
  return readLocalLearningState();
 }

 const payload = (await response.json()) as Partial<UserLearningState>;
 const normalized = normalizeLearningState(payload);
 writeLocalLearningState(normalized);

 return normalized;
}

async function persistLearningState(state: UserLearningState) {
 writeLocalLearningState(state);

 const response = await fetch("/api/learning-state", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(state),
 });

 if (!response.ok) {
  return state;
 }

 const normalized = normalizeLearningState(
  (await response.json()) as Partial<UserLearningState>,
 );
 writeLocalLearningState(normalized);

 return normalized;
}

export function useLearningState() {
 const queryClient = useQueryClient();
 const query = useQuery({
  queryKey,
  queryFn: readLearningState,
  placeholderData: readLocalLearningState,
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
 });

 const mutation = useMutation({
  mutationFn: persistLearningState,
  onMutate: async (nextState) => {
   await queryClient.cancelQueries({ queryKey });
   const previous = queryClient.getQueryData<UserLearningState>(queryKey);

   writeLocalLearningState(nextState);
   queryClient.setQueryData(queryKey, nextState);

   return { previous };
  },
  onError: (_error, _nextState, context) => {
   if (context?.previous) {
    writeLocalLearningState(context.previous);
    queryClient.setQueryData(queryKey, context.previous);
   }
  },
  onSuccess: (savedState) => {
   queryClient.setQueryData(queryKey, savedState);
  },
 });

 const updateState = useCallback(
  (recipe: (state: UserLearningState) => UserLearningState) => {
   const current = normalizeLearningState(
    queryClient.getQueryData<UserLearningState>(queryKey) ||
     query.data ||
     readLocalLearningState(),
   );

   const nextState = normalizeLearningState(recipe(current));

   if (nextState === current) return;

   mutation.mutate(nextState);
  },
  [mutation, query.data, queryClient],
 );

 return useMemo(
  () => ({
   state: normalizeLearningState(query.data),
   isLoading: query.isLoading,
   isSaving: mutation.isPending,

   updateSettings: (settings: Partial<UserLearningState["settings"]>) =>
    updateState((state) => {
     const changed = Object.entries(settings).some(
      ([key, value]) =>
       state.settings[key as keyof UserLearningState["settings"]] !== value,
     );

     if (!changed) return state;

     return {
      ...state,
      settings: { ...state.settings, ...settings },
     };
    }),

   updateVocabProgress: (id: string, status: LearningStatus) =>
    updateState((state) => ({
     ...state,
     progress: {
      ...state.progress,
      vocab: { ...state.progress.vocab, [id]: nextProgress(status) },
     },
    })),

   updateGrammarProgress: (id: string, status: LearningStatus) =>
    updateState((state) => ({
     ...state,
     progress: {
      ...state.progress,
      grammar: { ...state.progress.grammar, [id]: nextProgress(status) },
     },
    })),

   toggleBookmark: (scope: keyof UserLearningState["bookmarks"], id: string) =>
    updateState((state) => {
     const current = state.bookmarks[scope] || [];
     const exists = current.includes(id);

     return {
      ...state,
      bookmarks: {
       ...state.bookmarks,
       [scope]: exists
        ? current.filter((item) => item !== id)
        : [...current, id],
      },
     };
    }),

   appendReviewHistory: (
    item: { type: "vocab" | "grammar" | "radical"; id: string },
    result: ReviewResult,
   ) =>
    updateState((state) => ({
     ...state,
     reviewHistory: [
      ...state.reviewHistory,
      { ...item, result, answeredAt: new Date().toISOString() },
     ],
    })),
  }),
  [mutation.isPending, query.data, query.isLoading, updateState],
 );
}
