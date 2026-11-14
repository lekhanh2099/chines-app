"use client";

import { useEffect, useRef, useState } from "react";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { useListeningHotkeys } from "@/features/hanzihome/listening/useListeningHotkeys";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import {
 dictationActiveEntryIndex,
 dictationEntryText,
 dictationPlaybackTexts,
} from "./dictation-workspace-utils";

export function useDictationPlayback({
 entries,
 enabled,
 playWholePassage,
 loadVoices,
 stop,
 speakSequence,
 pause,
 resume,
 isLoading,
 isPaused,
 isSpeaking,
}: {
 entries: readonly ListeningTranscriptEntry[];
 enabled: boolean;
 playWholePassage: boolean;
 loadVoices: ReturnType<typeof useSharedMandarinTts>["loadVoices"];
 stop: ReturnType<typeof useSharedMandarinTts>["stop"];
 speakSequence: ReturnType<typeof useSharedMandarinTts>["speakSequence"];
 pause: ReturnType<typeof useSharedMandarinTts>["pause"];
 resume: ReturnType<typeof useSharedMandarinTts>["resume"];
 isLoading: ReturnType<typeof useSharedMandarinTts>["isLoading"];
 isPaused: ReturnType<typeof useSharedMandarinTts>["isPaused"];
 isSpeaking: ReturnType<typeof useSharedMandarinTts>["isSpeaking"];
}) {
 const [activeEntryId, setActiveEntryId] = useState("");
 const [loopCurrent, setLoopCurrent] = useState(false);
 const [autoAdvance, setAutoAdvance] = useState(false);
 const loopCurrentRef = useRef(false);
 const autoAdvanceRef = useRef(false);
 useEffect(() => {
  void loadVoices();
 }, [loadVoices]);
 const effectiveActiveEntryIndex = dictationActiveEntryIndex(entries, activeEntryId);

 const resetPlayback = () => {
  stop();
  loopCurrentRef.current = false;
  autoAdvanceRef.current = false;
  setLoopCurrent(false);
  setAutoAdvance(false);
  setActiveEntryId("");
 };
 const selectTransportEntry = (index: number) => {
  const nextEntry = entries[index];
  if (!nextEntry) return;
  stop();
  setActiveEntryId(nextEntry.id);
 };
 const playTransport = () => {
  const playbackTexts = dictationPlaybackTexts(
   entries,
   effectiveActiveEntryIndex,
   playWholePassage,
  );
  if (playbackTexts.length === 0) return;
  const play = () => {
   speakSequence(playbackTexts, () => {
    if (loopCurrentRef.current) {
     play();
     return;
    }
    if (autoAdvanceRef.current && effectiveActiveEntryIndex < entries.length - 1) {
     const nextEntry = entries[effectiveActiveEntryIndex + 1];
     if (!nextEntry) return;
     setActiveEntryId(nextEntry.id);
     speakSequence([dictationEntryText(nextEntry)]);
    }
   });
  };
  play();
 };
 const toggleTransportPlayback = () => {
  if (isLoading) return;
  if (isPaused) {
   resume();
   return;
  }
  if (isSpeaking) {
   pause();
   return;
  }
  playTransport();
 };
 const changeTransportLoop = (next: boolean) => {
  loopCurrentRef.current = next;
  setLoopCurrent(next);
  if (next) {
   autoAdvanceRef.current = false;
   setAutoAdvance(false);
  }
 };
 const changeTransportAutoAdvance = (next: boolean) => {
  autoAdvanceRef.current = next;
  setAutoAdvance(next);
  if (next) {
   loopCurrentRef.current = false;
   setLoopCurrent(false);
  }
 };
 useListeningHotkeys({
  enabled,
  onPrevious: () => selectTransportEntry(Math.max(0, effectiveActiveEntryIndex - 1)),
  onPlayToggle: toggleTransportPlayback,
  onRepeat: playTransport,
  onNext: () => selectTransportEntry(Math.min(entries.length - 1, effectiveActiveEntryIndex + 1)),
  onToggleLoop: () => changeTransportLoop(!loopCurrentRef.current),
  onStop: stop,
 });
 return {
  effectiveActiveEntryIndex,
  loopCurrent,
  autoAdvance,
  resetPlayback,
  selectTransportEntry,
  playTransport,
  toggleTransportPlayback,
  changeTransportLoop,
  changeTransportAutoAdvance,
 };
}
