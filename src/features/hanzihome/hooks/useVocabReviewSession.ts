"use client";

import { useMemo, useReducer } from "react";
import type {
 GrammarViewModel,
 ReviewResult,
 StaticRadicalData,
 VocabViewModel,
} from "@/features/hanzihome/types";

export type ReviewItem =
 | { type: "vocab"; id: string; prompt: string; answer: string; source: VocabViewModel }
 | { type: "grammar"; id: string; prompt: string; answer: string; source: GrammarViewModel }
 | { type: "radical"; id: string; prompt: string; answer: string; source: StaticRadicalData };

type ReviewState = {
 index: number;
 revealed: boolean;
 completed: boolean;
};

type ReviewAction =
 | { type: "reveal" }
 | { type: "answer"; itemCount: number; result: ReviewResult }
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
 radicals: StaticRadicalData[];
}) {
 const items = useMemo<ReviewItem[]>(() => {
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
  ];
 }, [input.grammar, input.vocab]);

 const [state, dispatch] = useReducer(reducer, {
  index: 0,
  revealed: false,
  completed: false,
 });

 return {
  items,
  state,
  currentItem: items[state.index] || null,
  reveal: () => dispatch({ type: "reveal" }),
  answer: (result: ReviewResult) =>
   dispatch({ type: "answer", itemCount: items.length, result }),
  reset: () => dispatch({ type: "reset" }),
 };
}
