"use client";

import { useCallback, useMemo, useReducer } from "react";

import type {
 GrammarViewModel,
 HanziHomeVocabItem,
 LearningStatus,
 ReviewResult,
} from "@/features/hanzihome/types";
import { getVocabDisplayMeaning, getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";

export type ReviewDeckMode = "all" | "vocab" | "grammar" | "hard";

export type ReviewItem =
 | {
    type: "vocab";
    id: string;
    prompt: string;
    answer: string;
    status: LearningStatus;
    source: HanziHomeVocabItem;
   }
 | {
    type: "grammar";
    id: string;
    prompt: string;
    answer: string;
    status: LearningStatus;
    source: GrammarViewModel;
   };

type ReviewState = {
 index: number;
 revealed: boolean;
 completed: boolean;
};

type ReviewAction =
 | { type: "reveal" }
 | { type: "answer"; itemCount: number; result: ReviewResult }
 | { type: "previous" }
 | { type: "next"; itemCount: number }
 | { type: "reset" };

function reducer(state: ReviewState, action: ReviewAction): ReviewState {
 if (action.type === "reveal") {
  return { ...state, revealed: !state.revealed };
 }
 if (action.type === "reset") return { index: 0, revealed: false, completed: false };

 if (action.type === "previous") {
  return {
   index: Math.max(state.index - 1, 0),
   revealed: false,
   completed: false,
  };
 }

 const nextIndex = state.index + 1;

 return {
  index: nextIndex,
  revealed: false,
  completed: nextIndex >= action.itemCount,
 };
}

function getRank(status: LearningStatus) {
 const rankByStatus: Record<LearningStatus, number> = {
  hard: 0,
  learning: 1,
  new: 2,
  known: 3,
 };

 return rankByStatus[status];
}

function getItemRank(item: ReviewItem) {
 return getRank(item.status);
}

export function useVocabReviewSession(input: {
 vocab: HanziHomeVocabItem[];
 grammar: GrammarViewModel[];
 vocabProgress: Record<string, { status: LearningStatus }>;
 grammarProgress: Record<string, { status: LearningStatus }>;
 mode: ReviewDeckMode;
}) {
 const items = useMemo<ReviewItem[]>(() => {
  const vocabItems: ReviewItem[] = input.vocab.map((item) => {
   const itemId = getVocabItemKey(item);
   const status = input.vocabProgress[itemId]?.status || "new";

   return {
    type: "vocab",
    id: itemId,
    prompt: item.hanzi,
    answer: [item.pinyin, item.meaning.hanviet, getVocabDisplayMeaning(item)]
     .filter(Boolean)
     .join(" · "),
    status,
    source: item,
   };
  });

  const grammarItems: ReviewItem[] = input.grammar.map((item) => {
   const status = input.grammarProgress[item.id]?.status || "new";

   return {
    type: "grammar",
    id: item.id,
    prompt: item.cleanTitle,
    answer: item.core || item.structuresView[0] || "Chưa có mô tả.",
    status,
    source: item,
   };
  });

  const merged = [...vocabItems, ...grammarItems];

  return merged
   .filter((item) => {
    if (input.mode === "vocab") return item.type === "vocab";
    if (input.mode === "grammar") return item.type === "grammar";
    if (input.mode === "hard") return item.status === "hard";
    return true;
   })
   .map((item, index) => ({ item, index }))
   .sort((a, b) => {
    if (input.mode !== "hard") return a.index - b.index;

    return getItemRank(a.item) - getItemRank(b.item) || a.index - b.index;
   })
   .map(({ item }) => item);
 }, [input.grammar, input.grammarProgress, input.mode, input.vocab, input.vocabProgress]);

 const [state, dispatch] = useReducer(reducer, {
  index: 0,
  revealed: false,
  completed: false,
 });

 const reveal = useCallback(() => dispatch({ type: "reveal" }), []);
 const answer = useCallback(
  (result: ReviewResult) => dispatch({ type: "answer", itemCount: items.length, result }),
  [items.length],
 );
 const next = useCallback(
  () => dispatch({ type: "next", itemCount: items.length }),
  [items.length],
 );
 const previous = useCallback(() => dispatch({ type: "previous" }), []);
 const reset = useCallback(() => dispatch({ type: "reset" }), []);

 return {
  items,
  state,
  currentItem: items[state.index] || null,
  reveal,
  answer,
  previous,
  next,
  reset,
 };
}
