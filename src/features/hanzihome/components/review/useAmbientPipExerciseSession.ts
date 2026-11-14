"use client";

import { useCallback, useState } from "react";
import { useFastMandarinSpeech } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { evaluateUniversalAnswer } from "@/features/hanzihome/components/practice/universal-exercise-adapter";
import type { UniversalExerciseItem } from "@/features/hanzihome/components/practice/universal-exercise.types";
import type { AmbientPipExerciseRunnerProps } from "./AmbientPipExerciseRunner";

/** Owns the PiP exercise session: active deck, current question, answers and evaluations. */
export function useAmbientPipExerciseSession(rawItems: AmbientPipExerciseRunnerProps["items"]) {
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
  }
 }, [currentIndex, stopSpeech, totalCount]);

 const handlePrev = useCallback(() => {
  stopSpeech();
  if (currentIndex > 0) {
   setCurrentIndex((prev) => prev - 1);
  }
 }, [currentIndex, stopSpeech]);

 const handleRetryCurrent = useCallback(() => {
  if (!currentItem) return;
  stopSpeech();
  setAnswers((prev) => {
   const next = new Map(prev);
   next.delete(currentItem.id);
   return next;
  });
  setEvaluations((prev) => {
   const next = new Map(prev);
   next.delete(currentItem.id);
   return next;
  });
 }, [currentItem, stopSpeech]);

 const handleRestartAll = useCallback(() => {
  stopSpeech();
  setRetryingMistakes(null);
  setAnswers(new Map());
  setEvaluations(new Map());
  setCurrentIndex(0);
  setIsCompleted(false);
 }, [stopSpeech]);

 const handleRetryMistakes = useCallback(() => {
  stopSpeech();
  const mistakes = activeItems.filter((item) => evaluations.get(item.id) === false);
  if (mistakes.length === 0) return;
  setRetryingMistakes(mistakes);
  setAnswers(new Map());
  setEvaluations(new Map());
  setCurrentIndex(0);
  setIsCompleted(false);
 }, [activeItems, evaluations, stopSpeech]);

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
  stopSpeech,
  handleAnswerChange,
  handleCheckCurrent,
  handleNext,
  handlePrev,
  handleRetryCurrent,
  handleRestartAll,
  handleRetryMistakes,
 };
}
