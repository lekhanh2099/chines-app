"use client";

import { useCallback, useMemo, useState } from "react";

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

export function useLearningState() {
 const [state, setState] = useState<UserLearningState>(() =>
  normalizeLearningState(emptyLearningState),
 );

 const updateState = useCallback(
  (recipe: (state: UserLearningState) => UserLearningState) => {
   setState((current) => normalizeLearningState(recipe(current)));
  },
  [],
 );

 return useMemo(
  () => ({
   state,
   isLoading: false,
   isSaving: false,

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
  [state, updateState],
 );
}
