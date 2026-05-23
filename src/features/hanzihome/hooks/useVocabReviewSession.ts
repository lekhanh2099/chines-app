"use client";

import { useCallback, useMemo, useReducer } from "react";
import type {
 GrammarViewModel,
 LearningStatus,
 ReviewResult,
 VocabViewModel,
} from "@/features/hanzihome/types";

export type ReviewItem =
 | { type: "vocab"; id: string; prompt: string; answer: string; source: VocabViewModel }
 | { type: "grammar"; id: string; prompt: string; answer: string; source: GrammarViewModel }

type ReviewState = {
 index: number;
 revealed: boolean;
 completed: boolean;
};

type ReviewAction =
 | { type: "reveal" }
 | { type: "answer"; itemCount: number; result: ReviewResult }
 | { type: "next"; itemCount: number }
 | { type: "reset" };

function reducer(state: ReviewState, action: ReviewAction): ReviewState {
 if (action.type === "reveal") return { ...state, revealed: true };
 if (action.type === "reset") return { index: 0, revealed: false, completed: false };
 const nextIndex = state.index + 1;
 return {
  index: nextIndex,
  revealed: false,
  completed: nextIndex >= action.itemCount,
 };
}

export function useVocabReviewSession(input: {
 vocab: VocabViewModel[];
 grammar: GrammarViewModel[];
 vocabProgress: Record<string, { status: LearningStatus }>;
 grammarProgress: Record<string, { status: LearningStatus }>;
}) {
 const items = useMemo<ReviewItem[]>(() => {
  const rankByStatus: Record<LearningStatus, number> = {
   hard: 0,
   learning: 1,
   new: 2,
   known: 3,
  };
  return [
   ...input.vocab.map((item) => ({
    type: "vocab" as const,
    id: item.id,
    prompt: item.word,
    answer: [item.pinyin, item.hanViet, item.meaning].filter(Boolean).join(" · "),
    source: item,
   })),
   ...input.grammar.map((item) => ({
    type: "grammar" as const,
    id: item.id,
    prompt: item.cleanTitle,
    answer: item.core || item.structuresView[0] || "Chưa có mô tả.",
    source: item,
   })),
  ].sort((a, b) => {
   const aStatus =
    a.type === "vocab"
     ? input.vocabProgress[a.id]?.status || "new"
     : input.grammarProgress[a.id]?.status || "new";
   const bStatus =
    b.type === "vocab"
     ? input.vocabProgress[b.id]?.status || "new"
     : input.grammarProgress[b.id]?.status || "new";
   return rankByStatus[aStatus] - rankByStatus[bStatus];
  });
 }, [input.grammar, input.grammarProgress, input.vocab, input.vocabProgress]);

 const [state, dispatch] = useReducer(reducer, {
  index: 0,
  revealed: false,
  completed: false,
 });
 const reveal = useCallback(() => dispatch({ type: "reveal" }), []);
 const answer = useCallback(
  (result: ReviewResult) =>
   dispatch({ type: "answer", itemCount: items.length, result }),
  [items.length],
 );
 const next = useCallback(
  () => dispatch({ type: "next", itemCount: items.length }),
  [items.length],
 );
 const reset = useCallback(() => dispatch({ type: "reset" }), []);

 return {
  items,
  state,
  currentItem: items[state.index] || null,
  reveal,
  answer,
  next,
  reset,
 };
}
