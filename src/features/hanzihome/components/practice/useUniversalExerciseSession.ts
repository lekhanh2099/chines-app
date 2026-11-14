"use client";

import { useCallback, useState } from "react";
import { useFastMandarinSpeech } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import type { UniversalExerciseRunnerProps } from "./UniversalExerciseRunner";
import { evaluateUniversalAnswer } from "./universal-exercise-adapter";
import type { UniversalExerciseItem } from "./universal-exercise.types";

/** Owns the exercise runner session: active deck, current question, answers and evaluations. */
export function useUniversalExerciseSession({
 rawItems,
 onComplete,
}: {
 rawItems: UniversalExerciseRunnerProps["items"];
 onComplete: UniversalExerciseRunnerProps["onComplete"];
}) {
 const [retryingMistakes, setRetryingMistakes] = useState<readonly UniversalExerciseItem[] | null>(
  null,
 );
 const [prevRawItems, setPrevRawItems] = useState(rawItems);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [answers, setAnswers] = useState<ReadonlyMap<string, string>>(new Map());
 const [evaluations, setEvaluations] = useState<ReadonlyMap<string, boolean>>(new Map());
 const [isCompleted, setIsCompleted] = useState(false);

 if (rawItems !== prevRawItems) {
  setPrevRawItems(rawItems);
  setRetryingMistakes(null);
  setCurrentIndex(0);
  setAnswers(new Map());
  setEvaluations(new Map());
  setIsCompleted(false);
 }

 const activeItems = retryingMistakes ?? rawItems;

 const { speak, stop: stopSpeech } = useFastMandarinSpeech();

 const totalCount = activeItems.length;
 const currentItem = activeItems[currentIndex];
 const currentAnswer = currentItem ? (answers.get(currentItem.id) ?? "") : "";
 const currentEvaluation = currentItem ? evaluations.get(currentItem.id) : undefined;
 const isCurrentSubmitted = currentEvaluation !== undefined;

 const handleAnswerChange = useCallback(
  (value: string) => {
   if (!currentItem) return;
   setAnswers((prev) => new Map(prev).set(currentItem.id, value));
  },
  [currentItem],
 );

 const handleCheckCurrent = useCallback(() => {
  if (!currentItem) return;
  const isCorrect = evaluateUniversalAnswer(currentItem, currentAnswer);
  setEvaluations((prev) => new Map(prev).set(currentItem.id, isCorrect));

  // If correct, play audio for linguistic context
  if (isCorrect && currentItem.audioText) {
   speak(currentItem.audioText);
  }
 }, [currentAnswer, currentItem, speak]);

 const handleNext = useCallback(() => {
  stopSpeech();
  if (currentIndex + 1 < totalCount) {
   setCurrentIndex((prev) => prev + 1);
  } else {
   setIsCompleted(true);
   const correctCount = Array.from(evaluations.values()).filter(Boolean).length;
   onComplete?.({ total: totalCount, correct: correctCount });
  }
 }, [currentIndex, evaluations, onComplete, stopSpeech, totalCount]);

 const handlePrev = useCallback(() => {
  stopSpeech();
  if (currentIndex > 0) {
   setCurrentIndex((prev) => prev - 1);
  }
 }, [currentIndex, stopSpeech]);

 const handleRetryCurrent = useCallback(() => {
  if (!currentItem) return;
  stopSpeech();
  setEvaluations((prev) => {
   const next = new Map(prev);
   next.delete(currentItem.id);
   return next;
  });
 }, [currentItem, stopSpeech]);

 const handleRetryMistakes = useCallback(() => {
  stopSpeech();
  const mistakeItems = activeItems.filter((item) => evaluations.get(item.id) === false);
  if (mistakeItems.length > 0) {
   setRetryingMistakes(mistakeItems);
   setCurrentIndex(0);
   setAnswers(new Map());
   setEvaluations(new Map());
   setIsCompleted(false);
  }
 }, [activeItems, evaluations, stopSpeech]);

 const handleRestartAll = useCallback(() => {
  stopSpeech();
  setRetryingMistakes(null);
  setCurrentIndex(0);
  setAnswers(new Map());
  setEvaluations(new Map());
  setIsCompleted(false);
 }, [stopSpeech]);

 return {
  totalCount,
  currentIndex,
  currentItem,
  currentAnswer,
  currentEvaluation,
  isCurrentSubmitted,
  evaluations,
  isCompleted,
  speak,
  handleAnswerChange,
  handleCheckCurrent,
  handleNext,
  handlePrev,
  handleRetryCurrent,
  handleRetryMistakes,
  handleRestartAll,
 };
}
