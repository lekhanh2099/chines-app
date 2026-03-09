"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
 getClientAiPromptSettingsFingerprint,
 loadClientAiPromptSettings,
} from "@/lib/ai-prompt-settings-client";
import { extractChinese, isChineseOnlyText } from "@/lib/chinese-utils";
import type {
 PersonalNoteMode,
 SmartSelectionMode,
 SmartSelectionResult,
} from "@/types/database";

function resolveMode(selection: string): SmartSelectionMode {
 return selection.length <= 2 ? "word" : "sentence";
}

export function useSmartSelectionInsights(
 selectedText: string,
 contextSentence: string,
 options?: {
  enabled?: boolean;
  mode?: SmartSelectionMode;
 },
) {
 const queryClient = useQueryClient();
 const trimmedSelection = selectedText.trim();
 const chineseSelection = extractChinese(trimmedSelection);
 const lookupKey = chineseSelection || trimmedSelection;
 const isChineseSelection = isChineseOnlyText(trimmedSelection);
 const mode = options?.mode || resolveMode(lookupKey);
 const enabled = options?.enabled ?? true;
 const promptSettings = loadClientAiPromptSettings();
 const settingsFingerprint =
  getClientAiPromptSettingsFingerprint(promptSettings);
 const cacheVersion = "smart-selection-v3";

 const query = useQuery<SmartSelectionResult>({
  queryKey: [
   "editor-smart-selection",
   cacheVersion,
   lookupKey,
   contextSentence,
   mode,
   settingsFingerprint,
  ],
  enabled: enabled && isChineseSelection && !!lookupKey,
  staleTime: 1000 * 60 * 8,
  gcTime: 1000 * 60 * 30,
  queryFn: async () => {
   const res = await fetch("/api/editor/context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     selection: trimmedSelection,
     contextSentence,
     mode,
    }),
   });

   const json = (await res.json()) as SmartSelectionResult & { error?: string };
   if (!res.ok) {
    throw new Error(json.error || "Không thể lấy dữ liệu selection");
   }

   return json;
  },
 });

 const saveMutation = useMutation({
  mutationFn: async (payload?: {
   personalNote?: string;
   personalNoteMode?: PersonalNoteMode;
  }) => {
   const data = query.data;
   if (!data) {
    throw new Error("Không có dữ liệu để lưu");
   }

   const res = await fetch("/api/vocab/inspect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     hanzi: data.entry.hanzi,
     pinyin: data.entry.pinyin,
     meaning:
      data.mode === "sentence"
       ? data.translation || data.entry.meaning
       : data.entry.meaning,
     ai_analysis: {
      ...(data.entry.ai_analysis || {}),
      ...(data.mode === "sentence"
       ? {
          sentence_translation: data.translation || data.entry.meaning,
          grammar_breakdown: data.grammar_points,
         }
       : {}),
     },
     context_sentence:
      contextSentence || data.context_sentence || trimmedSelection,
     context_translation:
      data.mode === "sentence"
       ? data.translation || data.entry.meaning
       : undefined,
     personal_note: payload?.personalNote,
     personal_note_mode: payload?.personalNoteMode,
    }),
   });

   const json = (await res.json()) as { error?: string };
   if (!res.ok) {
    throw new Error(json.error || "Không thể lưu selection");
   }

   return json;
  },
  onSuccess: (_result, payload) => {
   queryClient.setQueryData<SmartSelectionResult | undefined>(
    [
     "editor-smart-selection",
     cacheVersion,
     lookupKey,
     contextSentence,
     mode,
     settingsFingerprint,
    ],
    (old) =>
     old
      ? {
         ...old,
         isSaved: true,
         personal_note: payload?.personalNote ?? old.personal_note,
         personal_note_mode:
          payload?.personalNoteMode ?? old.personal_note_mode,
        }
      : old,
   );
  },
 });

 return {
  ...query,
  mode,
  isChineseSelection,
  saveSelection: saveMutation.mutateAsync,
  isSaving: saveMutation.isPending,
  saveMutation,
 };
}
