"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { useFastMandarinSpeech } from "@/features/hanzihome/hooks/useFastMandarinSpeech";

type Speak = ReturnType<typeof useFastMandarinSpeech>["speak"];
type Stop = ReturnType<typeof useFastMandarinSpeech>["stop"];

/** Longest a finished countdown waits for speech before advancing anyway. */
export const MAX_SPEECH_HOLD_SECONDS = 30;

/**
 * One second of the ambient auto-advance cycle. A countdown that reaches its
 * end while speech is still playing holds (up to MAX_SPEECH_HOLD_SECONDS) so a
 * long example is not cut off mid-sentence by the next card.
 */
export function pipAutoAdvanceTick({
 remaining,
 held,
 isSpeaking,
 intervalSeconds,
}: {
 remaining: number;
 held: number;
 isSpeaking: boolean;
 intervalSeconds: number;
}) {
 if (remaining <= 1) {
  if (isSpeaking && held < MAX_SPEECH_HOLD_SECONDS) {
   return { advance: false, halfway: false, remaining, held: held + 1 };
  }
  return { advance: true, halfway: false, remaining: intervalSeconds, held: 0 };
 }
 const next = remaining - 1;
 return {
  advance: false,
  halfway: next === Math.floor(intervalSeconds / 2),
  remaining: next,
  held,
 };
}

export function usePipAutoAdvance({
 enabled,
 intervalSeconds,
 speak,
 stop,
 onAdvance,
 onHalfway,
}: {
 enabled: boolean;
 intervalSeconds: number;
 speak: Speak;
 stop: Stop;
 onAdvance: () => void;
 onHalfway?: () => void;
}) {
 const [remainingSeconds, setRemainingSeconds] = useState(intervalSeconds);
 const remainingRef = useRef(intervalSeconds);
 const heldRef = useRef(0);
 const isSpeakingRef = useRef(false);
 const onAdvanceRef = useRef(onAdvance);
 const onHalfwayRef = useRef(onHalfway);

 useEffect(() => {
  onAdvanceRef.current = onAdvance;
  onHalfwayRef.current = onHalfway;
 });

 const resetRemaining = useCallback((seconds: number) => {
  remainingRef.current = seconds;
  heldRef.current = 0;
  setRemainingSeconds(seconds);
 }, []);

 // Every playback (automatic or tapped) reports its end so the cycle can wait.
 const speakTracked = useCallback(
  (input: Parameters<Speak>[0], options?: Parameters<Speak>[1]) => {
   isSpeakingRef.current = true;
   speak(input, {
    ...options,
    onFinish: () => {
     isSpeakingRef.current = false;
     options?.onFinish?.();
    },
   });
  },
  [speak],
 );

 // An interrupted playback never reports onFinish (stop/supersede bump the
 // speech run), so stopping must clear the flag itself or every later cycle
 // would wait the full hold time.
 const stopTracked = useCallback(() => {
  isSpeakingRef.current = false;
  stop();
 }, [stop]);

 useEffect(() => {
  if (!enabled) return;
  // Navigation runs from the interval callback, never inside a state updater
  // (updaters can be invoked twice and would skip a card).
  const timer = setInterval(() => {
   const step = pipAutoAdvanceTick({
    remaining: remainingRef.current,
    held: heldRef.current,
    isSpeaking: isSpeakingRef.current,
    intervalSeconds,
   });
   heldRef.current = step.held;
   if (step.advance) {
    onAdvanceRef.current();
    return;
   }
   if (step.halfway) onHalfwayRef.current?.();
   if (step.remaining !== remainingRef.current) {
    remainingRef.current = step.remaining;
    setRemainingSeconds(step.remaining);
   }
  }, 1000);
  return () => clearInterval(timer);
 }, [enabled, intervalSeconds]);

 return { remainingSeconds, resetRemaining, speakTracked, stopTracked };
}
