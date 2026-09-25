"use client";

import { useQuery } from "@tanstack/react-query";
import { generateSmartPinyin } from "@/lib/pronunciation/pinyin-engine";
import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import {
 getBasicVocabData,
 getVocabByHanzi,
 getVocabularyAnalysis,
} from "@/services/vocab.service";
import { aiAnalysisSchema } from "@/types/database";
import { dictionaryQueryKeys } from "../query-keys";

const basicLookupResponseSchema = z.object({
 data: z
  .object({
   id: z.string().optional(),
   dictionary_id: z.string().optional(),
   hanzi: z.string().optional(),
   pinyin: z.string().optional(),
   sino_vietnamese: z.string().nullable().optional(),
   meaning: z.string().optional(),
   analysis: aiAnalysisSchema.optional(),
   ai_analysis: aiAnalysisSchema.optional(),
  })
  .optional(),
});

function parseLookupResponse(payload: z.output<typeof basicLookupResponseSchema>) {
 if (!payload.data?.hanzi) return null;
 return getBasicVocabData({
  id: payload.data.id,
  dictionary_id: payload.data.dictionary_id,
  hanzi: payload.data.hanzi,
  pinyin: payload.data.pinyin ?? "",
  sino_vietnamese: payload.data.sino_vietnamese ?? undefined,
  meaning: payload.data.meaning ?? "",
  ai_analysis: payload.data.analysis ?? payload.data.ai_analysis ?? {},
 });
}

async function fetchInspectorVocab(selectedText: string, lessonId: string, signal: AbortSignal) {
 const pinyin = generateSmartPinyin(selectedText).pinyin;
 try {
  const response = await fetch("/api/lookup/basic", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ text: selectedText, lessonId: lessonId || undefined }),
   signal,
  });
  const parsed = basicLookupResponseSchema.safeParse(await response.json());
  const vocab = parsed.success ? parseLookupResponse(parsed.data) : null;
  if (response.ok && vocab) {
   return getBasicVocabData({ ...vocab, pinyin: vocab.pinyin || pinyin });
  }

  // Read-only fallback. Inspector lookup must never create/update canonical
  // dictionary rows or user SRS state as a side effect of selecting text.
  const supabase = createClient();
  const existing = await getVocabByHanzi(supabase, selectedText);
  if (existing) {
   return getBasicVocabData({
    id: existing.id,
    hanzi: existing.hanzi,
    pinyin: existing.pinyin || pinyin,
    sino_vietnamese: existing.sino_vietnamese ?? undefined,
    meaning: existing.meaning ?? "",
    ai_analysis: getVocabularyAnalysis(existing),
   });
  }
 } catch (error) {
  if (error instanceof Error && error.name === "AbortError") throw error;
 }

 return getBasicVocabData({
  hanzi: selectedText,
  pinyin,
  meaning: "",
  ai_analysis: {},
 });
}

export function useInspectorLookup(selectedText: string, lessonId: string, enabled: boolean) {
 const query = useQuery({
  queryKey: dictionaryQueryKeys.inspector(selectedText, lessonId),
  queryFn: ({ signal }) => fetchInspectorVocab(selectedText, lessonId, signal),
  enabled: enabled && Boolean(selectedText),
  staleTime: 5 * 60 * 1000,
 });

 return { vocabData: query.data ?? null, isLoading: query.isPending };
}
