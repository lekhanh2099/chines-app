"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useVocabDetail } from "@/features/vocabulary/hooks/useVocabDetail";
import { useSmartSelectionInsights } from "@/hooks/useSmartSelectionInsights";
import {
 getNormalizedDefinitions,
 getNormalizedRelatedCompounds,
 getNormalizedRadicals,
} from "@/services/vocab.service";
import type {
 DictionaryPageViewModel,
 DictionaryWordReadyViewModel,
 MeaningItem,
} from "@/features/dictionary/types";
import {
 getExampleKey,
 getUniqueChineseCharacters,
 isSentenceLikeQuery,
 normalizeExample,
} from "@/features/dictionary/utils";

export function useDictionaryPageViewModel(): DictionaryPageViewModel {
 const params = useParams<{ hanzi: string | string[] }>();
 const paramValue = Array.isArray(params.hanzi)
  ? params.hanzi[0]
  : params.hanzi;
 const rawText = decodeURIComponent(paramValue || "");
 const chineseCharacters = getUniqueChineseCharacters(rawText);
 const isSentenceView = isSentenceLikeQuery(rawText);

 const {
  vocabData,
  srsLevel,
  isSaved,
  isLoading,
  triggerAi,
  isAiLoading,
  saveToSrs,
  isSaving,
  hasDeepAiData,
  personalNote: savedPersonalNote,
  personalNoteMode,
 } = useVocabDetail(rawText, { enabled: !isSentenceView });

 const sentenceQuery = useSmartSelectionInsights(rawText, rawText, {
  enabled: isSentenceView,
  mode: "sentence",
 });

 const [activeCharacter, setActiveCharacter] = useState<string | null>(null);

 const requestAiAnalysis = useCallback(() => {
  triggerAi(undefined, {
   onSuccess: () => toast.success("Đã phân tích xong!"),
   onError: () => toast.error("Không thể phân tích từ này. Thử lại sau."),
  });
 }, [triggerAi]);

 useEffect(() => {
  if (
   !isSentenceView &&
   !isLoading &&
   !isAiLoading &&
   vocabData &&
   !hasDeepAiData()
  ) {
   requestAiAnalysis();
  }
 }, [
  hasDeepAiData,
  isAiLoading,
  isLoading,
  isSentenceView,
  requestAiAnalysis,
  vocabData,
 ]);

 if (isSentenceView) {
  return {
   mode: "sentence",
   text: rawText,
   characters: chineseCharacters,
   isLoading: sentenceQuery.isLoading,
   translation:
    sentenceQuery.data?.translation || sentenceQuery.data?.entry.meaning || "",
   pinyin: sentenceQuery.data?.entry.pinyin || "",
   error:
    sentenceQuery.error instanceof Error ? sentenceQuery.error.message : null,
  };
 }

 if (isLoading) {
  return { mode: "word", state: "loading" };
 }

 if (!vocabData) {
  return { mode: "word", state: "not-found" };
 }

 const ai = vocabData.ai_analysis;
 const etymologyText =
  typeof ai?.etymology === "object" ? ai.etymology.explanation : ai?.etymology;
 const definitions = getNormalizedDefinitions(ai, vocabData.meaning || "");
 const radicals = getNormalizedRadicals(ai);
 const meaningSummary =
  ai?.meaning_summary || definitions[0]?.meaning || vocabData.meaning || "";
 const examples = (
  ai?.examples ??
  definitions
   .flatMap((definition) => definition.examples || [])
   .filter((example) => example.cn || example.vi)
 ).map((example) => normalizeExample(example));
 const relatedCompounds = getNormalizedRelatedCompounds(ai).slice(0, 8);
 const selectedCharacter =
  activeCharacter && chineseCharacters.includes(activeCharacter)
   ? activeCharacter
   : chineseCharacters[0] || vocabData.hanzi;
 const normalizedMeanings = definitions
  .map((definition) => ({
   meaning: definition.meaning || definition.text || "",
   pos: definition.pos || ai?.word_type || undefined,
   examples: (definition.examples || [])
    .filter((example) => example.cn || example.vi)
    .map((example) => normalizeExample(example)),
  }))
  .filter((definition) => definition.meaning || definition.examples.length > 0);

 const meaningItems: MeaningItem[] = normalizedMeanings.length
  ? normalizedMeanings
  : meaningSummary || vocabData.meaning
    ? [
       {
        meaning: meaningSummary || vocabData.meaning || "",
        pos: ai?.word_type || undefined,
        examples: [],
       },
      ]
    : [];

 const usedExampleKeys = new Set(
  normalizedMeanings.flatMap((definition) =>
   definition.examples.map((example) => getExampleKey(example)),
  ),
 );
 const extraExamples = examples.filter(
  (example) => !usedExampleKeys.has(getExampleKey(example)),
 );
 const hasLearningInsights = Boolean(
  ai?.mnemonic_story ||
  ai?.usage_logic?.length ||
  ai?.vn_trap ||
  ai?.common_mistakes ||
  ai?.confusion,
 );
 const hasContent = Boolean(
  meaningItems.length ||
  meaningSummary ||
  examples.length ||
  radicals.length ||
  ai?.components?.length ||
  etymologyText ||
  ai?.mnemonic_story ||
  ai?.usage_logic?.length ||
  relatedCompounds.length ||
  ai?.vn_trap ||
  ai?.common_mistakes,
 );
 const canRenderDashboard = hasContent || chineseCharacters.length > 0;
 const srsStatusLabel =
  srsLevel === null
   ? "Chưa vào SRS"
   : srsLevel === 0
     ? "Mới"
     : srsLevel <= 2
       ? "Ôn tập"
       : srsLevel <= 4
         ? "Tốt"
         : "Thuần thục";

 const handleSpeak = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
   return;
  }

  const utterance = new SpeechSynthesisUtterance(vocabData.hanzi);
  utterance.lang = "zh-CN";
  utterance.rate = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
 };

 const handleSave = () => {
  if (isSaving) return;

  saveToSrs(vocabData, {
   onSuccess: () => toast.success(`Đã lưu \"${vocabData.hanzi}\" vào SRS!`),
   onError: () => toast.error("Không thể lưu từ vựng"),
  });
 };

 const handleSavePersonalNote = (note: string) => {
  if (isSaving) return;

  saveToSrs(
   {
    vocabData,
    options: {
     personalNote: note,
     personalNoteMode: personalNoteMode || "normal",
    },
   },
   {
    onSuccess: () => toast.success("Đã lưu ghi chú cá nhân"),
    onError: (error) =>
     toast.error(
      error instanceof Error ? error.message : "Không thể lưu ghi chú cá nhân",
     ),
   },
  );
 };

 const viewModel: DictionaryWordReadyViewModel = {
  mode: "word",
  state: "ready",
  rawText,
  chineseCharacters,
  selectedCharacter,
  setActiveCharacter,
  vocabData,
  ai,
  meaningSummary,
  meaningItems,
  extraExamples,
  relatedCompounds,
  hasLearningInsights,
  canRenderDashboard,
  isAiLoading,
  isSaved,
  isSaving,
  srsLevel,
  srsStatusLabel,
  savedPersonalNote,
  personalNoteMode,
  requestAiAnalysis,
  handleSpeak,
  handleSave,
  handleSavePersonalNote,
 };

 return viewModel;
}
