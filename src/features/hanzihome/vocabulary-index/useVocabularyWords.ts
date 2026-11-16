"use client";

import { useQuery } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

import { reusedVocabularyResponseSchema, vocabularyWordResponseSchema } from "./vocabulary-index";

const storeStaleTime = 5 * 60 * 1000;

/** Whether `hanzi` occurs in more than one lesson, textbook or note of the store. */
export function useIsReusedVocabularyWord(hanzi: string) {
 const { userId } = useClientSession();
 const reused = useQuery({
  queryKey: hanzihomeQueryKeys.reusedVocabulary(userId ?? ""),
  queryFn: async ({ signal }) => {
   const response = await fetch("/api/hanzihome/vocabulary/reused", { signal });
   if (!response.ok) throw new Error(`Reused vocabulary failed with status ${response.status}`);
   return new Set(reusedVocabularyResponseSchema.parse(await response.json()).words);
  },
  enabled: Boolean(userId),
  staleTime: storeStaleTime,
  refetchOnWindowFocus: false,
 });
 return reused.data?.has(hanzi.trim()) ?? false;
}

/** Every reading of `hanzi` with the meaning it carries in each lesson, loaded on demand. */
export function useVocabularyWord(hanzi: string, enabled: boolean) {
 const { userId } = useClientSession();
 const word = hanzi.trim();
 return useQuery({
  queryKey: hanzihomeQueryKeys.vocabularyWord(userId ?? "", word),
  queryFn: async ({ signal }) => {
   const response = await fetch(`/api/hanzihome/vocabulary/words/${encodeURIComponent(word)}`, {
    signal,
   });
   if (!response.ok) throw new Error(`Vocabulary word failed with status ${response.status}`);
   return vocabularyWordResponseSchema.parse(await response.json()).entries;
  },
  enabled: enabled && Boolean(userId) && word.length > 0,
  staleTime: storeStaleTime,
  refetchOnWindowFocus: false,
 });
}
