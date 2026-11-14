"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
 DEFAULT_VIETNAMESE_VOICE,
 useFastMandarinSpeech,
} from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { buildDictationDiff } from "@/features/hanzihome/practice/dictation-comparison";
import { calculateChineseAccuracy } from "@/features/hanzihome/practice/text-comparison";
import { dictationResponseMs } from "@/features/dictation/dictation-workspace-utils";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import type { AmbientPipDictationCardProps } from "./AmbientPipDictationCard";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import {
 type AttemptResult,
 type DictationMode,
 initialPipDictationMode,
 nextPipDictationSpeechRate,
 pipDictationSummaryStats,
 shuffledPipDictationIndices,
 togglePipDictationMode,
} from "./pip-dictation-utils";

/** Owns the PiP dictation session: word order, answer/check state, attempts and playback. */
export function useAmbientPipDictationSession({
 items,
 initialMode,
}: {
 items: AmbientPipDictationCardProps["items"];
 initialMode: AmbientPipDictationCardProps["initialMode"];
}) {
 const [dictationMode, setDictationMode] = useState<DictationMode>(() =>
  initialPipDictationMode(initialMode),
 );
 const [mistakesItems, setMistakesItems] = useState<readonly HanziHomeVocabItem[] | null>(null);
 const [shuffledIndices, setShuffledIndices] = useState<readonly number[] | null>(null);
 const [speechRate, setSpeechRate] = useState<number>(1.0);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [answer, setAnswer] = useState("");
 const [isChecked, setIsChecked] = useState(false);
 const [attempt, setAttempt] = useState<AttemptResult | null>(null);
 const [sessionAttempts, setSessionAttempts] = useState<Map<number, AttemptResult>>(
  () => new Map(),
 );
 const [isCompleted, setIsCompleted] = useState(false);
 const [isAutoSpeak, setIsAutoSpeak] = useState(true);
 const [showHint, setShowHint] = useState(false);

 const startTimeRef = useRef<number | null>(null);
 const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 const { speak, stop } = useFastMandarinSpeech();

 const isRetryingMistakes = mistakesItems !== null;
 const baseItems = mistakesItems ?? items;
 const isShuffled = shuffledIndices !== null;

 const activeItems = useMemo<readonly HanziHomeVocabItem[]>(() => {
  if (shuffledIndices && shuffledIndices.length === baseItems.length) {
   return shuffledIndices.map((idx) => baseItems[idx] ?? baseItems[0]);
  }
  return baseItems;
 }, [baseItems, shuffledIndices]);

 const totalCount = activeItems.length;
 const currentItem = activeItems[currentIndex] ?? activeItems[0];

 const cancelAutoNext = useCallback(() => {
  if (autoNextTimerRef.current !== null) {
   clearTimeout(autoNextTimerRef.current);
   autoNextTimerRef.current = null;
  }
 }, []);

 const handleToggleDictationMode = useCallback(() => {
  cancelAutoNext();
  setDictationMode(togglePipDictationMode);
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [cancelAutoNext]);

 const playCurrentAudio = useCallback(() => {
  if (!currentItem) return;
  if (dictationMode === "vi-to-zh") {
   const viMeaning = getVocabDisplayMeaning(currentItem);
   if (viMeaning) {
    speak(viMeaning, { rate: speechRate, lang: "vi-VN", voice: DEFAULT_VIETNAMESE_VOICE });
   }
  } else {
   if (currentItem.hanzi) {
    speak(currentItem.hanzi, { rate: speechRate, lang: "zh-CN" });
   }
  }
 }, [currentItem, dictationMode, speak, speechRate]);

 const playSecondaryAudio = useCallback(() => {
  if (!currentItem) return;
  if (dictationMode === "vi-to-zh") {
   if (currentItem.hanzi) {
    speak(currentItem.hanzi, { rate: speechRate, lang: "zh-CN" });
   }
  } else {
   const viMeaning = getVocabDisplayMeaning(currentItem);
   if (viMeaning) {
    speak(viMeaning, { rate: speechRate, lang: "vi-VN", voice: DEFAULT_VIETNAMESE_VOICE });
   }
  }
 }, [currentItem, dictationMode, speak, speechRate]);

 const handleNext = useCallback(() => {
  if (totalCount === 0) return;
  cancelAutoNext();

  if (currentIndex >= totalCount - 1) {
   setIsCompleted(true);
   return;
  }

  setCurrentIndex((prev) => prev + 1);
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [cancelAutoNext, currentIndex, totalCount]);

 const handlePrev = useCallback(() => {
  if (totalCount === 0) return;
  cancelAutoNext();

  if (isCompleted) {
   setIsCompleted(false);
   setCurrentIndex(totalCount - 1);
   return;
  }

  setCurrentIndex((prev) => Math.max(0, prev - 1));
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [cancelAutoNext, isCompleted, totalCount]);

 const handleAnswerChange = (value: string) => {
  if (!isChecked && startTimeRef.current === null && value.trim().length > 0) {
   startTimeRef.current = Date.now();
  }
  setAnswer(value);
 };

 const handleCheck = useCallback(() => {
  if (!currentItem) return;
  if (!answer.trim()) return;

  const now = Date.now();
  const responseMs = dictationResponseMs(now, startTimeRef.current ?? undefined);
  const score = calculateChineseAccuracy(currentItem.hanzi, answer);
  const diff = buildDictationDiff(currentItem.hanzi, answer);

  const result: AttemptResult = { score, responseMs, diff };
  setAttempt(result);
  setIsChecked(true);

  setSessionAttempts((prev) => {
   const next = new Map(prev);
   next.set(currentIndex, result);
   return next;
  });

  if (score === 100 && totalCount > 1) {
   cancelAutoNext();
   autoNextTimerRef.current = setTimeout(handleNext, 1500);
  }
 }, [answer, cancelAutoNext, currentItem, currentIndex, handleNext, totalCount]);

 const handleEditAgain = useCallback(() => {
  cancelAutoNext();
  setIsChecked(false);
  setAttempt(null);
  startTimeRef.current = Date.now();
  setTimeout(() => inputRef.current?.focus(), 50);
 }, [cancelAutoNext]);

 const handleCycleRate = useCallback(() => {
  setSpeechRate(nextPipDictationSpeechRate);
 }, []);

 const handleToggleShuffle = useCallback(() => {
  cancelAutoNext();
  setShuffledIndices((prev) => {
   if (prev !== null) {
    return null;
   }
   return shuffledPipDictationIndices(baseItems.length);
  });
  setCurrentIndex(0);
  setSessionAttempts(new Map());
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [baseItems.length, cancelAutoNext]);

 const handleToggleAutoSpeak = useCallback(() => {
  setIsAutoSpeak((prev) => !prev);
 }, []);

 const handleToggleHint = useCallback(() => {
  setShowHint((prev) => !prev);
 }, []);

 const summaryStats = useMemo(
  () => pipDictationSummaryStats(activeItems, sessionAttempts),
  [activeItems, sessionAttempts],
 );

 const restartSession = useCallback(
  (nextMistakesItems: readonly HanziHomeVocabItem[] | null) => {
   cancelAutoNext();
   setMistakesItems(nextMistakesItems);
   setShuffledIndices(null);
   setSessionAttempts(new Map());
   setIsCompleted(false);
   setCurrentIndex(0);
   setAnswer("");
   setIsChecked(false);
   setAttempt(null);
   setShowHint(false);
   startTimeRef.current = null;
  },
  [cancelAutoNext],
 );

 const handleRetryMistakes = useCallback(() => {
  if (summaryStats.mistakes.length === 0) return;
  restartSession(summaryStats.mistakes);
 }, [restartSession, summaryStats.mistakes]);

 const handleRestartAll = useCallback(() => {
  restartSession(null);
 }, [restartSession]);

 return {
  dictationMode,
  speechRate,
  currentIndex,
  answer,
  isChecked,
  attempt,
  isCompleted,
  isAutoSpeak,
  showHint,
  inputRef,
  speak,
  stop,
  isRetryingMistakes,
  isShuffled,
  activeItems,
  totalCount,
  currentItem,
  cancelAutoNext,
  handleToggleDictationMode,
  playCurrentAudio,
  playSecondaryAudio,
  handleNext,
  handlePrev,
  handleAnswerChange,
  handleCheck,
  handleEditAgain,
  handleCycleRate,
  handleToggleShuffle,
  handleToggleAutoSpeak,
  handleToggleHint,
  summaryStats,
  handleRetryMistakes,
  handleRestartAll,
 };
}

export type AmbientPipDictationSession = ReturnType<typeof useAmbientPipDictationSession>;
