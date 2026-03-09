"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { pinyin as getPinyin } from "pinyin-pro";
import { extractChinese } from "@/lib/chinese-utils";
import {
 getVocabWithProgress,
 getPrimaryMeaning,
 getNormalizedDefinitions,
 getNormalizedRelatedCompounds,
 hasInspectorDeepDiveData,
 upsertVocab,
 saveVocabToSrs,
} from "@/services/vocab.service";
import type { VocabData, AiAnalysis, PersonalNoteMode } from "@/types/database";

/**
 * Hook: Fetch vocab detail + progress for the dictionary page.
 * Also provides save and AI generation mutations.
 */
export function useVocabDetail(hanzi: string, options?: { enabled?: boolean }) {
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;
 const queryClient = useQueryClient();
 const chineseText = extractChinese(hanzi) || hanzi;
 const enabled = options?.enabled ?? true;

 // ── Main query: vocab data + SRS progress ──
 const query = useQuery({
  queryKey: ["vocab-detail", chineseText],
  enabled,
  queryFn: async () => {
   const pinyinText = getPinyin(chineseText);

   const user = await getClientSessionUser(supabase);

   if (!user) {
    return {
     vocab: {
      hanzi: chineseText,
      pinyin: pinyinText,
      meaning: "",
      ai_analysis: {} as AiAnalysis,
     } as VocabData,
     srsLevel: null,
     isSaved: false,
     personalNote: "",
     personalNoteMode: "important" as PersonalNoteMode,
    };
   }

   const result = await getVocabWithProgress(supabase, chineseText, user.id);

   // Ensure pinyin fallback from pinyin-pro
   if (!result.vocab.pinyin) {
    result.vocab.pinyin = pinyinText;
   }

   return result;
  },
 });

 // ── Mutation: trigger AI analysis ──
 const aiMutation = useMutation({
  mutationFn: async () => {
   const res = await fetch("/api/ai/generate-vocab", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hanzi: chineseText }),
   });
   if (!res.ok) throw new Error("AI generation failed");
   const result = await res.json();
   return result.data as AiAnalysis;
  },
  onSuccess: (aiData) => {
   // Update the cached query data optimistically
   queryClient.setQueryData(
    ["vocab-detail", chineseText],
    (old: typeof query.data) => {
     if (!old) return old;
     return {
      ...old,
      vocab: {
       ...old.vocab,
       pinyin:
        (aiData as AiAnalysis & { pinyin?: string }).pinyin || old.vocab.pinyin,
       meaning: getPrimaryMeaning(aiData, old.vocab.meaning),
       ai_analysis: {
        ...old.vocab.ai_analysis,
        ...aiData,
       },
      },
     };
    },
   );
  },
 });

 // ── Mutation: save to SRS ──
 const saveMutation = useMutation({
  mutationFn: async (
   vocabInput:
    | VocabData
    | {
       vocabData: VocabData;
       options?: {
        contextSentence?: string;
        contextTranslation?: string;
        personalNote?: string;
        personalNoteMode?: PersonalNoteMode;
       };
      },
  ) => {
   const payload =
    "vocabData" in vocabInput ? vocabInput : { vocabData: vocabInput };
   const user = await getClientSessionUser(supabase);
   if (!user) throw new Error("Not authenticated");

   const result = await saveVocabToSrs(
    supabase,
    user.id,
    payload.vocabData,
    payload.options,
   );
   if (!result) throw new Error("Save failed");

   if (payload.options?.personalNote?.trim() && !result.noteSchemaAvailable) {
    throw new Error(
     "Database chua co cot personal_note. Chay migration 20260307000004_user_vocab_personal_note.sql truoc.",
    );
   }

   return result;
  },
  onSuccess: (_result, variables) => {
   const payload =
    typeof variables === "object" &&
    variables !== null &&
    "vocabData" in variables
     ? variables
     : { vocabData: variables };

   queryClient.setQueryData(
    ["vocab-detail", chineseText],
    (old: typeof query.data) => {
     if (!old) return old;

     return {
      ...old,
      isSaved: true,
      personalNote: payload.options?.personalNote ?? old.personalNote,
      personalNoteMode:
       payload.options?.personalNoteMode ?? old.personalNoteMode,
     };
    },
   );

   // Refetch to update isSaved status
   queryClient.invalidateQueries({ queryKey: ["vocab-detail", chineseText] });
   queryClient.invalidateQueries({ queryKey: ["vocab-list"] });
  },
 });

 // ── Mutation: upsert vocab with AI data (used by API route callback) ──
 const upsertMutation = useMutation({
  mutationFn: async (data: {
   hanzi: string;
   pinyin?: string;
   meaning?: string;
   ai_analysis?: AiAnalysis;
  }) => {
   return upsertVocab(supabase, data);
  },
 });

 // Helper: check if AI data exists
 const hasAiData = useCallback(() => {
  const ai = query.data?.vocab?.ai_analysis;
  if (!ai) return false;
  return !!(
   getNormalizedDefinitions(ai, query.data?.vocab?.meaning || "").length ||
   ai.examples?.length ||
   ai.components?.length ||
   ai.etymology ||
   ai.mnemonic_story ||
   getNormalizedRelatedCompounds(ai).length ||
   ai.related_words?.length ||
   ai.collocations?.length ||
   ai.vn_trap ||
   ai.common_mistakes ||
   ai.radical
  );
 }, [query.data]);

 const hasDeepAiData = useCallback(() => {
  return hasInspectorDeepDiveData(query.data?.vocab?.ai_analysis);
 }, [query.data]);

 return {
  // Query
  vocabData: query.data?.vocab ?? null,
  srsLevel: query.data?.srsLevel ?? null,
  isSaved: query.data?.isSaved ?? null,
  personalNote: query.data?.personalNote ?? "",
  personalNoteMode: query.data?.personalNoteMode ?? "important",
  isLoading: query.isLoading,

  // AI
  triggerAi: aiMutation.mutate,
  isAiLoading: aiMutation.isPending,

  // Save
  saveToSrs: saveMutation.mutate,
  isSaving: saveMutation.isPending,
  saveMutation,

  // Utils
  hasAiData,
  hasDeepAiData,
  upsertMutation,
 };
}
