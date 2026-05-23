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

async function readLearningState() {
 const response = await fetch("/api/learning-state", { method: "GET" });
 if (!response.ok) {
  const localValue = window.localStorage.getItem(localStorageKey);
  return normalizeLearningState(localValue ? JSON.parse(localValue) : emptyLearningState);
 }
 const payload = (await response.json()) as Partial<UserLearningState>;
 return normalizeLearningState(payload);
}

async function persistLearningState(state: UserLearningState) {
 window.localStorage.setItem(localStorageKey, JSON.stringify(state));
 const response = await fetch("/api/learning-state", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(state),
 });
 if (!response.ok) {
  return state;
 }
 return normalizeLearningState((await response.json()) as Partial<UserLearningState>);
}

export function useLearningState() {
 const queryClient = useQueryClient();
 const query = useQuery({
  queryKey,
  queryFn: readLearningState,
  initialData: emptyLearningState,
 });

 const mutation = useMutation({
  mutationFn: persistLearningState,
  onMutate: async (nextState) => {
   await queryClient.cancelQueries({ queryKey });
   const previous = queryClient.getQueryData<UserLearningState>(queryKey);
   queryClient.setQueryData(queryKey, nextState);
   return { previous };
  },
  onError: (_error, _nextState, context) => {
   if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
  },
  onSuccess: (savedState) => {
   queryClient.setQueryData(queryKey, savedState);
  },
 });

 const updateState = useCallback(
  (recipe: (state: UserLearningState) => UserLearningState) => {
   const current = queryClient.getQueryData<UserLearningState>(queryKey) || query.data;
   mutation.mutate(recipe(normalizeLearningState(current)));
  },
  [mutation, query.data, queryClient],
 );

 return useMemo(
  () => ({
   state: query.data,
   isLoading: query.isLoading,
   isSaving: mutation.isPending,
   updateSettings: (settings: Partial<UserLearningState["settings"]>) =>
    updateState((state) => ({
     ...state,
     settings: { ...state.settings, ...settings },
    })),
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
