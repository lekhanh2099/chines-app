"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
 getClientAiPromptSettingsFingerprint,
 loadClientAiPromptSettings,
} from "@/lib/ai/ai-prompt-settings-client";
import { useClientSession } from "@/components/providers/QueryProvider";
import { extractChinese, isChineseOnlyText } from "@/lib/text/chinese-utils";
import { enqueueSelectionLookup } from "@/lib/api/selection-lookup-queue";
import { JsonValueSchema } from "@/types/json";
import {
 SmartSelectionResultSchema,
 type PersonalNoteMode,
 type SmartSelectionMode,
 type SmartSelectionResult,
} from "@/types/database";
import { z } from "zod";
import { saveDictionarySrsDurably } from "@/features/dictionary/dictionary-srs-outbox";

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
 const { userId, isResolved } = useClientSession();
 const queryClient = useQueryClient();
 const trimmedSelection = selectedText.trim();
 const chineseSelection = extractChinese(trimmedSelection);
 const lookupKey = chineseSelection || trimmedSelection;
 const isChineseSelection = isChineseOnlyText(trimmedSelection);
 const mode = options?.mode || resolveMode(lookupKey);
 const enabled = options?.enabled ?? true;
 const promptSettings = loadClientAiPromptSettings();
 const settingsFingerprint = getClientAiPromptSettingsFingerprint(promptSettings);
 const cacheVersion = "smart-selection-v4";
 const queryKey = [
  "editor-smart-selection",
  userId,
  cacheVersion,
  lookupKey,
  contextSentence,
  mode,
  settingsFingerprint,
 ];

 const query = useQuery<SmartSelectionResult>({
  queryKey,
  enabled: enabled && isResolved && Boolean(userId) && isChineseSelection && !!lookupKey,
  staleTime: 1000 * 60 * 8,
  gcTime: 1000 * 60 * 30,
  queryFn: () =>
   enqueueSelectionLookup(async () => {
    const res = await fetch("/api/editor/context", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
      selection: trimmedSelection,
      contextSentence,
      mode,
     }),
    });

    const payload = JsonValueSchema.parse(await res.json().catch(() => null));
    if (!res.ok) {
     const parsedError = z.object({ error: z.string().optional() }).safeParse(payload);
     throw new Error(
      parsedError.success && parsedError.data.error
       ? parsedError.data.error
       : "Không thể lấy dữ liệu selection",
     );
    }

    return SmartSelectionResultSchema.parse(payload);
   }),
 });

 const saveMutation = useMutation({
  networkMode: "always",
  mutationFn: async (payload?: { personalNote?: string; personalNoteMode?: PersonalNoteMode }) => {
   if (!query.data) {
    throw new Error("Không có dữ liệu để lưu");
   }
   if (!userId) throw new Error("Not authenticated");

   return saveDictionarySrsDurably(
    {
     hanzi: query.data.entry.hanzi,
     contextSentence: query.data.context_sentence,
     personalNote: payload?.personalNote,
     personalNoteMode: payload?.personalNoteMode,
    },
    userId,
   );
  },
  onSuccess: (_result, payload) => {
   queryClient.setQueryData<typeof query.data>(queryKey, (old) =>
    old
     ? {
        ...old,
        isSaved: true,
        personal_note: payload?.personalNote ?? old.personal_note,
        personal_note_mode: payload?.personalNoteMode ?? old.personal_note_mode,
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
