"use client";

import { useEffect, useRef, useState } from "react";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import { createDictationAttempt, type DictationAttempt } from "./dictation-session";
import { dictationCardModels, studioDictationEditorModel } from "./dictation-workspace-utils";

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
 const autoNextTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
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
  return () => {
   if (autoNextTimerRef.current !== undefined) {
    clearTimeout(autoNextTimerRef.current);
    autoNextTimerRef.current = undefined;
   }
  };
 }, [entry.id]);

 const updateAnswer = (value: string) => {
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
  const nextAttempt = createDictationAttempt(entry.id, model.target, model.answer, null);
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
