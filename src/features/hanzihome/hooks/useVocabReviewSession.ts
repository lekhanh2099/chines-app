"use client";

import { useCallback, useMemo, useReducer, useRef } from "react";
import { z } from "zod";

import { getReviewDueAt, isReviewDue } from "@/features/hanzihome/review/review-scheduler";
import type {
 GrammarViewModel,
 HanziHomeVocabItem,
 LearningProgressItem,
 LearningStatus,
 ReviewResult,
} from "@/features/hanzihome/types";
import { getVocabDisplayMeaning, getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";

export const ReviewDeckModeSchema = z.enum(["all", "vocab", "grammar", "hard", "due"]);
export type ReviewDeckMode = z.infer<typeof ReviewDeckModeSchema>;

type ReviewItemMap = {
 vocab: {
  type: "vocab";
  id: string;
  prompt: string;
  answer: string;
  status: LearningStatus;
  progress?: LearningProgressItem;
  source: HanziHomeVocabItem;
 };
 grammar: {
  type: "grammar";
  id: string;
  prompt: string;
  answer: string;
  status: LearningStatus;
  progress?: LearningProgressItem;
  source: GrammarViewModel;
 };
};
export type ReviewItem = ReviewItemMap[keyof ReviewItemMap];

type ReviewState = {
 index: number;
 revealed: boolean;
 completed: boolean;
};

type ReviewActionMap = {
 reveal: { type: "reveal" };
 answer: { type: "answer"; itemCount: number; result: ReviewResult };
 previous: { type: "previous" };
 next: { type: "next"; itemCount: number };
 reset: { type: "reset" };
};
type ReviewAction = ReviewActionMap[keyof ReviewActionMap];

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

function itemKey(item: ReviewItem) {
 return `${item.type}:${item.id}`;
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

function getDueRank(item: ReviewItem) {
 const dueAt = getReviewDueAt(item.progress);
 if (!dueAt) return Number.NEGATIVE_INFINITY;

 const timestamp = Date.parse(dueAt);
 return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

function seededRandom(seed: number) {
 let value = seed % 2147483647;
 if (value <= 0) value += 2147483646;

 return () => {
  value = (value * 16807) % 2147483647;
  return (value - 1) / 2147483646;
 };
}

function shuffleItems<T>(items: T[], seed: number): T[] {
 const nextItems = [...items];
 const random = seededRandom(seed);

 for (let index = nextItems.length - 1; index > 0; index -= 1) {
  const swapIndex = Math.floor(random() * (index + 1));
  const current = nextItems[index];
  nextItems[index] = nextItems[swapIndex];
  nextItems[swapIndex] = current;
 }

 return nextItems;
}

export function useVocabReviewSession(input: {
 vocab: HanziHomeVocabItem[];
 grammar: GrammarViewModel[];
 vocabProgress: Record<string, LearningProgressItem>;
 grammarProgress: Record<string, LearningProgressItem>;
 mode: ReviewDeckMode;
 shuffleSeed?: number;
}) {
 const deckItemKeysRef = useRef<string[] | null>(null);
 const allItems = useMemo<ReviewItem[]>(() => {
  const vocabItems: ReviewItem[] = input.vocab.map((item) => {
   const itemId = getVocabItemKey(item);
   const progress = input.vocabProgress[itemId];

   return {
    type: "vocab",
    id: itemId,
    prompt: item.hanzi,
    answer: [item.pinyin, item.meaning.hanviet, getVocabDisplayMeaning(item)]
     .filter(Boolean)
     .join(" · "),
    status: progress?.status || "new",
    progress,
    source: item,
   };
  });

  const grammarItems: ReviewItem[] = input.grammar.map((item) => {
   const progress = input.grammarProgress[item.id];

   return {
    type: "grammar",
    id: item.id,
    prompt: item.cleanTitle,
    answer: item.core || item.structuresView[0] || "Chưa có mô tả.",
    status: progress?.status || "new",
    progress,
    source: item,
   };
  });

  return [...vocabItems, ...grammarItems];
 }, [input.grammar, input.grammarProgress, input.vocab, input.vocabProgress]);

 const eligibleItems = useMemo(() => {
  const sortedItems = allItems
   .filter((item) => {
    if (input.mode === "vocab") return item.type === "vocab";
    if (input.mode === "grammar") return item.type === "grammar";
    if (input.mode === "hard") return item.status === "hard";
    if (input.mode === "due") return isReviewDue(item.progress);
    return true;
   })
   .map((item, index) => ({ item, index }))
   .sort((a, b) => {
    if (input.mode === "due") {
     return getDueRank(a.item) - getDueRank(b.item) || a.index - b.index;
    }
    if (input.mode === "hard") {
     return getItemRank(a.item) - getItemRank(b.item) || a.index - b.index;
    }

    return a.index - b.index;
   })
   .map(({ item }) => item);

  return input.shuffleSeed ? shuffleItems(sortedItems, input.shuffleSeed) : sortedItems;
 }, [allItems, input.mode, input.shuffleSeed]);

 const items = useMemo(() => {
  const deckKeys = deckItemKeysRef.current;
  if (!deckKeys) return eligibleItems;

  const itemByKey = new Map(allItems.map((item) => [itemKey(item), item]));
  return deckKeys.flatMap((key) => {
   const item = itemByKey.get(key);
   return item ? [item] : [];
  });
 }, [allItems, eligibleItems]);

 const [state, dispatch] = useReducer(reducer, {
  index: 0,
  revealed: false,
  completed: false,
 });

 const reveal = useCallback(() => dispatch({ type: "reveal" }), []);
 const answer = useCallback(
  (result: ReviewResult) => {
   if (!deckItemKeysRef.current) {
    deckItemKeysRef.current = items.map(itemKey);
   }
   dispatch({ type: "answer", itemCount: items.length, result });
  },
  [items],
 );
 const next = useCallback(
  () => dispatch({ type: "next", itemCount: items.length }),
  [items.length],
 );
 const previous = useCallback(() => dispatch({ type: "previous" }), []);
 const reset = useCallback(() => {
  deckItemKeysRef.current = null;
  dispatch({ type: "reset" });
 }, []);

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
