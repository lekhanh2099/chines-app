"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
 LearningStatus,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";
import {
 fetchHanziHomeLearningState,
 saveHanziHomeLearningState,
} from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import {
 emptyLearningState,
 nextProgress,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

const learningStateQueryKey = ["hanzihome", "learning-state"] as const;

export function useLearningState() {
 const queryClient = useQueryClient();
 const query = useQuery({
  queryKey: learningStateQueryKey,
  queryFn: fetchHanziHomeLearningState,
 });
 const persistMutation = useMutation({
  mutationFn: saveHanziHomeLearningState,
  onMutate: async (nextState) => {
   await queryClient.cancelQueries({ queryKey: learningStateQueryKey });
   const previousState =
    queryClient.getQueryData<UserLearningState>(learningStateQueryKey);

   queryClient.setQueryData(
    learningStateQueryKey,
    normalizeLearningState(nextState),
   );

   return { previousState };
  },
  onError: (_error, _nextState, context) => {
   if (context?.previousState) {
    queryClient.setQueryData(learningStateQueryKey, context.previousState);
   }
  },
  onSuccess: (savedState) => {
   queryClient.setQueryData(
    learningStateQueryKey,
    normalizeLearningState(savedState),
   );
  },
 });

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
   persistMutation.mutate(nextState);
  },
  [persistMutation, query.data, queryClient],
 );

 return useMemo(
  () => ({
   state,
   isLoading: query.isLoading,
   isSaving: persistMutation.isPending,
   isError: query.isError || persistMutation.isError,

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
    item: { type: "vocab" | "grammar" | "radical"; id: string },
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
  [persistMutation.isError, persistMutation.isPending, query.isError, query.isLoading, state, updateState],
 );
}
