"use client";

import { useCallback, useEffect, useRef } from "react";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import type { TtsClipRow, TtsSegmentMode } from "./tts-studio.schemas";

export function useTtsStudioPlayback({
 text,
 mode,
 segments,
 autoAdvance,
 loopCurrent,
 speakSequence,
 stop,
 pause,
 resume,
 isSpeaking,
 isPaused,
 onSelect,
 onOpenClip,
 setSelectedVoiceName,
 setRate,
}: {
 text: string;
 mode: TtsSegmentMode;
 segments: Parameters<ReturnType<typeof useSharedMandarinTts>["speakSequence"]>[0];
 autoAdvance: boolean;
 loopCurrent: boolean;
 speakSequence: ReturnType<typeof useSharedMandarinTts>["speakSequence"];
 stop: ReturnType<typeof useSharedMandarinTts>["stop"];
 pause: ReturnType<typeof useSharedMandarinTts>["pause"];
 resume: ReturnType<typeof useSharedMandarinTts>["resume"];
 isSpeaking: ReturnType<typeof useSharedMandarinTts>["isSpeaking"];
 isPaused: ReturnType<typeof useSharedMandarinTts>["isPaused"];
 onSelect: (index: number) => void;
 onOpenClip: (clip: TtsClipRow) => void;
 setSelectedVoiceName: ReturnType<typeof useSharedMandarinTts>["setSelectedVoiceName"];
 setRate: ReturnType<typeof useSharedMandarinTts>["setRate"];
}) {
 const playbackRunRef = useRef(0);
 const loopCurrentRef = useRef(false);

 useEffect(() => {
  loopCurrentRef.current = loopCurrent;
 }, [loopCurrent]);

 useEffect(() => {
  playbackRunRef.current += 1;
  stop();
 }, [mode, stop, text]);

 const playSegments = useCallback(() => {
  if (segments.length === 0) return;
  playbackRunRef.current += 1;
  const runId = playbackRunRef.current;
  const play = () => {
   if (playbackRunRef.current !== runId) return;
   speakSequence(segments, () => {
    if (playbackRunRef.current !== runId || !loopCurrentRef.current) return;
    play();
   });
  };
  play();
 }, [segments, speakSequence]);

 const playSegmentAt = useCallback(
  (index: number) => {
   const segment = segments[index];
   if (segment === undefined) return;
   playbackRunRef.current += 1;
   const runId = playbackRunRef.current;
   const play = (currentIndex: number) => {
    const currentSegment = segments[currentIndex];
    if (currentSegment === undefined || playbackRunRef.current !== runId) return;
    onSelect(currentIndex);
    speakSequence([currentSegment], () => {
     if (playbackRunRef.current !== runId) return;
     if (loopCurrentRef.current) {
      play(currentIndex);
      return;
     }
     if (autoAdvance && currentIndex < segments.length - 1) play(currentIndex + 1);
    });
   };
   play(index);
  },
  [autoAdvance, onSelect, segments, speakSequence],
 );

 const stopPlayback = useCallback(() => {
  playbackRunRef.current += 1;
  stop();
 }, [stop]);

 useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
   const target = event.target;
   const isTextEntry = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
   if (isTextEntry) {
    if (event.key === "Escape") {
     stopPlayback();
     return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
     event.preventDefault();
     playSegments();
    }
    return;
   }
   if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.isComposing ||
    (target instanceof HTMLElement &&
     target.closest(
      "a, button, input, textarea, select, [contenteditable='true'], [role='button'], [role='combobox'], [role='menuitem'], [role='option'], [role='tab']",
     ))
   )
    return;
   if (event.key === "Escape") {
    stopPlayback();
    return;
   }
   if (event.key === " ") {
    event.preventDefault();
    if (isSpeaking) pause();
    else if (isPaused) resume();
    else playSegments();
    return;
   }
   if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    playSegments();
   }
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
 }, [isPaused, isSpeaking, pause, playSegments, resume, stopPlayback]);

 const openClip = (clip: TtsClipRow) => {
  stopPlayback();
  onOpenClip(clip);
  setSelectedVoiceName(clip.voice);
  setRate(clip.rate);
 };

 return { playSegments, playSegmentAt, stopPlayback, openClip };
}
