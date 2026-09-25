"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { generateSmartPinyin } from "@/lib/pronunciation/pinyin-engine";
import { z } from "zod";

import { useClientSession } from "@/components/providers/QueryProvider";
import { extractChinese } from "@/lib/chinese-utils";
import { dictionaryQueryKeys } from "@/features/dictionary/query-keys";
import {
 getVocabWithProgress,
 getPrimaryMeaning,
 getNormalizedDefinitions,
 getNormalizedRelatedCompounds,
 hasInspectorDeepDiveData,
} from "@/services/vocab.service";
import { GenerateVocabResponseSchema } from "@/types/database";
import type { VocabData, AiAnalysis, PersonalNoteMode } from "@/types/database";

const pendingAiGenerations = new Map<string, Promise<AiAnalysis>>();
const saveSrsResponseSchema = z.object({
 vocabId: z.string().min(1),
 dictionaryId: z.string().nullable(),
 contextSchemaAvailable: z.boolean(),
 noteSchemaAvailable: z.boolean(),
});

/**
 * Hook: Fetch vocab detail + progress for the dictionary page.
 * Also provides save and AI generation mutations.
 */
export function useVocabDetail(hanzi: string, options?: { enabled?: boolean }) {
 const { supabase, userId, isResolved } = useClientSession();
 const queryClient = useQueryClient();
 const chineseText = extractChinese(hanzi) || hanzi;
 const enabled = options?.enabled ?? true;
 const detailKey = dictionaryQueryKeys.vocabDetail(userId, chineseText);

 // ── Main query: vocab data + SRS progress ──
 const query = useQuery({
  queryKey: detailKey,
  enabled: enabled && isResolved,
  queryFn: async () => {
   const pinyinText = generateSmartPinyin(chineseText).pinyin;

   if (!userId) {
    const vocab: VocabData = {
     hanzi: chineseText,
     pinyin: pinyinText,
     meaning: "",
     ai_analysis: {},
    };
    const personalNoteMode: PersonalNoteMode = "important";

    return {
     vocab,
     srsLevel: null,
     isSaved: false,
     personalNote: "",
     personalNoteMode,
    };
   }

   const result = await getVocabWithProgress(supabase, chineseText, userId);

   if (!result.vocab.pinyin) {
    result.vocab.pinyin = pinyinText;
   }

   return result;
  },
 });

 // ── Mutation: trigger AI analysis ──
 const aiMutation = useMutation({
  mutationFn: async () => {
   if (!userId) throw new Error("Not authenticated");
   const generationKey = `${userId}:${chineseText}`;
   const existing = pendingAiGenerations.get(generationKey);
   if (existing) return existing;

   const promise = (async () => {
    const res = await fetch("/api/ai/generate-vocab", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ hanzi: chineseText }),
    });
    if (!res.ok) throw new Error("AI generation failed");
    return GenerateVocabResponseSchema.parse(await res.json()).data;
   })();

   pendingAiGenerations.set(generationKey, promise);
   try {
    return await promise;
   } finally {
    pendingAiGenerations.delete(generationKey);
   }
  },
  onSuccess: (aiData) => {
   queryClient.setQueryData(detailKey, (old: typeof query.data) => {
    if (!old) return old;
    return {
     ...old,
     vocab: {
      ...old.vocab,
      pinyin: aiData.pinyin || old.vocab.pinyin,
      meaning: getPrimaryMeaning(aiData, old.vocab.meaning),
      ai_analysis: {
       ...old.vocab.ai_analysis,
       ...aiData,
      },
     },
    };
   });
  },
 });

 // ── Mutation: save to SRS through the authenticated server boundary ──
 const saveMutation = useMutation({
  mutationFn: async (payload: {
   vocabData: VocabData;
   options?: {
    contextSentence?: string;
    contextTranslation?: string;
    personalNote?: string;
    personalNoteMode?: PersonalNoteMode;
   };
  }) => {
   if (!userId) throw new Error("Not authenticated");

   const response = await fetch("/api/dictionary/srs", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
     "X-HanziHome-Owner-Id": userId,
    },
    body: JSON.stringify({
     hanzi: payload.vocabData.hanzi,
     contextSentence: payload.options?.contextSentence,
     contextTranslation: payload.options?.contextTranslation,
     personalNote: payload.options?.personalNote,
     personalNoteMode: payload.options?.personalNoteMode,
    }),
   });

   if (!response.ok) throw new Error("Save failed");
   const result = saveSrsResponseSchema.parse(await response.json());

   if (payload.options?.personalNote?.trim() && !result.noteSchemaAvailable) {
    throw new Error("Database chua co cot personal_note. Hay dong bo schema truoc.");
   }

   return result;
  },
  onSuccess: (_result, variables) => {
   const payload = variables;

   queryClient.setQueryData(detailKey, (old: typeof query.data) => {
    if (!old) return old;

    return {
     ...old,
     isSaved: true,
     personalNote: payload.options?.personalNote ?? old.personalNote,
     personalNoteMode: payload.options?.personalNoteMode ?? old.personalNoteMode,
    };
   });

   queryClient.invalidateQueries({ queryKey: detailKey });
   queryClient.invalidateQueries({ queryKey: dictionaryQueryKeys.vocabListRoot(userId) });
  },
 });

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
  vocabData: query.data?.vocab ?? null,
  srsLevel: query.data?.srsLevel ?? null,
  isSaved: query.data?.isSaved ?? null,
  personalNote: query.data?.personalNote ?? "",
  personalNoteMode: query.data?.personalNoteMode ?? "important",
  isLoading: query.isLoading,

  triggerAi: aiMutation.mutate,
  isAiLoading: aiMutation.isPending,

  saveToSrs: saveMutation.mutate,
  isSaving: saveMutation.isPending,
  saveMutation,

  hasAiData,
  hasDeepAiData,
 };
}
