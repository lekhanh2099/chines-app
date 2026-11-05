"use client";

import { useEffect, useRef, useState } from "react";
import { useUnsavedDraftGuard } from "@/components/layout/navigation/UnsavedDraftNavigationGuard";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import { createDictationAttempt, type DictationAttempt } from "./dictation-session";
import {
 dictationCardModels,
 dictationResponseMs,
 studioDictationEditorModel,
} from "./dictation-workspace-utils";

export function useStudioDictationSession({
 entry,
 index,
 total,
 onAttempt,
 onNext,
 onPrevious,
}: {
 entry: ListeningTranscriptEntry;
 index: number;
 total: number;
 onAttempt: (attempt: DictationAttempt) => void;
 onNext: () => void;
 onPrevious: () => void;
}) {
 const [answers, setAnswers] = useState<Parameters<typeof dictationCardModels>[0]["answers"]>({});
 const [attemptHistory, setAttemptHistory] = useState<
  Parameters<typeof dictationCardModels>[0]["attemptHistory"]
 >({});
 const [dirtyAnswers, setDirtyAnswers] = useState<
  Parameters<typeof dictationCardModels>[0]["dirtyAnswers"]
 >({});
 const hasUnsavedAnswer = Object.entries(answers).some(
  ([entryId, answer]) =>
   dirtyAnswers[entryId] === true &&
   answer !== undefined &&
   answer.trim().length > 0 &&
   answer !== attemptHistory[entryId]?.at(-1)?.answer,
 );
 useUnsavedDraftGuard(hasUnsavedAnswer);
 const autoNextTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
 const startTimeRef = useRef<number | null>(null);
 const model = studioDictationEditorModel({
  entry,
  index,
  total,
  answer: answers[entry.id] ?? "",
  history: attemptHistory[entry.id] ?? [],
  isDirty: dirtyAnswers[entry.id] === true,
 });

 const cancelAutoNext = () => {
  if (autoNextTimerRef.current !== undefined) {
   clearTimeout(autoNextTimerRef.current);
   autoNextTimerRef.current = undefined;
  }
 };

 useEffect(() => {
  startTimeRef.current = null;
  return () => {
   if (autoNextTimerRef.current !== undefined) {
    clearTimeout(autoNextTimerRef.current);
    autoNextTimerRef.current = undefined;
   }
  };
 }, [entry.id]);

 const updateAnswer = (value: string) => {
  if (startTimeRef.current === null && value.trim().length > 0) {
   startTimeRef.current = Date.now();
  }
  setAnswers((current) => ({ ...current, [entry.id]: value }));
  setDirtyAnswers((current) => ({ ...current, [entry.id]: true }));
 };

 const handlePrevious = () => {
  cancelAutoNext();
  onPrevious();
 };

 const handleNext = () => {
  cancelAutoNext();
  onNext();
 };

 const checkCurrent = () => {
  if (!model.answer.trim()) return;
  const now = Date.now();
  const responseMs = dictationResponseMs(now, startTimeRef.current ?? undefined);
  const nextAttempt = createDictationAttempt(entry.id, model.target, model.answer, responseMs);
  setAttemptHistory((current) => ({
   ...current,
   [entry.id]: [...(current[entry.id] ?? []), nextAttempt],
  }));
  setDirtyAnswers((current) => ({ ...current, [entry.id]: false }));
  onAttempt(nextAttempt);

  if (nextAttempt.score === 100 && index < total - 1) {
   cancelAutoNext();
   autoNextTimerRef.current = setTimeout(onNext, 900);
  }
 };

 const editAgain = () => {
  cancelAutoNext();
  startTimeRef.current = Date.now();
  setDirtyAnswers((current) => ({ ...current, [entry.id]: true }));
 };

 const confirmOrEdit = () => {
  if (model.isChecked) {
   if (model.canAdvance) handleNext();
   else editAgain();
  } else {
   checkCurrent();
  }
 };

 return { ...model, updateAnswer, handlePrevious, handleNext, editAgain, confirmOrEdit };
}
