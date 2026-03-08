/**
 * useQuickLookup — TanStack Query hook for instant Chinese vocab lookup.
 *
 * Uses the existing /api/vocab/inspect endpoint.
 * Falls back to local pinyin-pro for pinyin when DB doesn't have the word.
 * Cache: Infinity staleTime (dictionary data doesn't change).
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { pinyin as getPinyin } from "pinyin-pro";
import { extractChinese } from "@/lib/chinese-utils";
import type { VocabData, AiAnalysis } from "@/types/database";

export type LookupResult = {
 found: boolean;
 data: VocabData;
 isSaved: boolean;
};

async function lookupVocab(hanzi: string): Promise<LookupResult> {
 const chinese = extractChinese(hanzi);
 if (!chinese) {
  return {
   found: false,
   data: { hanzi, pinyin: "", meaning: "", ai_analysis: {} },
   isSaved: false,
  };
 }

 try {
  const res = await fetch("/api/lookup", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    text: chinese,
    type: "word",
   }),
  });
  const json = await res.json();

  if (json.data) {
   return {
    found: true,
    data: {
     id: json.data.id,
     dictionary_id: json.data.dictionary_id,
     hanzi: json.data.hanzi,
     pinyin: json.data.pinyin || getPinyin(chinese),
     meaning: json.data.meaning || "",
     ai_analysis: (json.data.analysis ||
      json.data.ai_analysis ||
      {}) as AiAnalysis,
    },
    isSaved: !!json.cached,
   };
  }
 } catch {
  // Fall through to local fallback
 }

 // Not in DB — generate pinyin locally
 return {
  found: false,
  data: {
   hanzi: chinese,
   pinyin: getPinyin(chinese),
   meaning: "",
   ai_analysis: {},
  },
  isSaved: false,
 };
}

export function useQuickLookup(selectedText: string) {
 return useQuery<LookupResult>({
  queryKey: ["vocab-lookup", extractChinese(selectedText)],
  queryFn: () => lookupVocab(selectedText),
  enabled: !!selectedText && selectedText.length > 0,
  staleTime: Infinity,
  gcTime: 1000 * 60 * 30, // 30 min garbage collection
 });
}
