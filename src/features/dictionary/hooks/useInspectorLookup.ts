"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { pinyin as getPinyin } from "pinyin-pro";
import { z } from "zod";

import { getClientSessionUser } from "@/lib/supabase/client-session";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import {
 classifyVocabType,
 getBasicVocabData,
 getVocabByHanzi,
 getVocabularyAnalysis,
 trackVocabLookup,
} from "@/services/vocab.service";
import { aiAnalysisSchema, type VocabWithProgress } from "@/types/database";
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
 const pinyin = getPinyin(selectedText);
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
 const queryClient = useQueryClient();
 const trackedLookupRef = useRef("");
 const query = useQuery({
  queryKey: dictionaryQueryKeys.inspector(selectedText, lessonId),
  queryFn: ({ signal }) => fetchInspectorVocab(selectedText, lessonId, signal),
  enabled: enabled && Boolean(selectedText),
  staleTime: 5 * 60 * 1000,
 });

 useEffect(() => {
  const vocab = query.data;
  const lookupKey = `${lessonId}:${selectedText}`;
  if (!vocab || trackedLookupRef.current === lookupKey) return;
  trackedLookupRef.current = lookupKey;

  const trackLookup = async () => {
   if (!vocab.hanzi || (!vocab.pinyin && !vocab.meaning && !vocab.sino_vietnamese)) return;
   try {
    const supabase = createClient();
    const user = await getClientSessionUser(supabase);
    if (!user) return;
    const tracked = await trackVocabLookup(supabase, user.id, vocab);
    if (!tracked?.vocabId) return;
    const item: VocabWithProgress = {
     id: tracked.vocabId,
     hanzi: vocab.hanzi,
     pinyin: vocab.pinyin,
     meaning: vocab.meaning,
     ai_analysis: vocab.ai_analysis ?? {},
     proficiency_level: 0,
     is_favorited: false,
     status: "new",
     type: classifyVocabType(vocab.hanzi, vocab.pinyin),
    };
    queryClient.setQueryData<VocabWithProgress[]>(dictionaryQueryKeys.vocabListRoot, (current) => [
     item,
     ...(current ?? []).filter((candidate) => candidate.id !== item.id),
    ]);
   } catch (error) {
    logger.error("[VocabInspector] track lookup failed:", error);
   }
  };

  void trackLookup();
 }, [lessonId, query.data, queryClient, selectedText]);

 return { vocabData: query.data ?? null, isLoading: query.isPending };
}
