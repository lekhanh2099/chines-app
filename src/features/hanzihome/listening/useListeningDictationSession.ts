"use client";

import { useRef, useState } from "react";
import {
 dictationCardModels,
 dictationEntryText,
 dictationResponseMs,
} from "@/features/dictation/dictation-workspace-utils";
import {
 createDictationAttempt,
 type DictationAttempt,
} from "@/features/dictation/dictation-session";
import type { ListeningTranscriptEntry } from "./listening.view-model";

export function useListeningDictationSession({
 entries,
 activeEntryId,
 playPassage,
 playParagraph,
 passageText,
 onSpeak,
 onSpeakSequence,
 onChecked,
 onAttempt,
}: {
 entries: ListeningTranscriptEntry[];
 activeEntryId?: ListeningTranscriptEntry["id"];
 playPassage: boolean;
 playParagraph: boolean;
 passageText: string;
 onSpeak: (text: string) => void;
 onSpeakSequence: (segments: string[]) => void;
 onChecked: (entryId: ListeningTranscriptEntry["id"]) => void;
 onAttempt: (attempt: DictationAttempt) => void;
}) {
 const [answers, setAnswers] = useState<Parameters<typeof dictationCardModels>[0]["answers"]>({});
 const [attemptHistory, setAttemptHistory] = useState<
  Parameters<typeof dictationCardModels>[0]["attemptHistory"]
 >({});
 const [dirtyAnswers, setDirtyAnswers] = useState<
  Parameters<typeof dictationCardModels>[0]["dirtyAnswers"]
 >({});
 const startedAtRef = useRef<Partial<Record<ListeningTranscriptEntry["id"], number>>>({});
 const cards = dictationCardModels({
  entries,
  activeEntryId,
  answers,
  attemptHistory,
  dirtyAnswers,
 });

 const playEntry = (entryId: ListeningTranscriptEntry["id"]) => {
  const card = cards.find((item) => item.entry.id === entryId);
  if (!card) return;
  const startedAt = Date.now();
  if (playPassage || playParagraph) {
   cards.forEach((item) => {
    startedAtRef.current[item.entry.id] ??= startedAt;
   });
   onSpeakSequence(playPassage ? [passageText] : entries.map(dictationEntryText));
   return;
  }
  startedAtRef.current[entryId] ??= startedAt;
  onSpeak(card.expectedText);
 };

 const updateAnswer = (entryId: ListeningTranscriptEntry["id"], value: string) => {
  startedAtRef.current[entryId] ??= Date.now();
  setAnswers((current) => ({ ...current, [entryId]: value }));
  setDirtyAnswers((current) => ({ ...current, [entryId]: true }));
 };

 const checkAnswer = (entryId: ListeningTranscriptEntry["id"]) => {
  const card = cards.find((item) => item.entry.id === entryId);
  if (!card || !card.answer.trim()) return;
  const nextAttempt = createDictationAttempt(
   entryId,
   card.expectedText,
   card.answer,
   dictationResponseMs(Date.now(), startedAtRef.current[entryId]),
  );
  delete startedAtRef.current[entryId];
  setAttemptHistory((current) => ({
   ...current,
   [entryId]: [...(current[entryId] ?? []), nextAttempt],
  }));
  setDirtyAnswers((current) => ({ ...current, [entryId]: false }));
  onChecked(entryId);
  onAttempt(nextAttempt);
 };

 return { cards, playEntry, updateAnswer, checkAnswer };
}
