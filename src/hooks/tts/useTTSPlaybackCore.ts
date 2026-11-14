"use client";

import { useCallback, useRef, useState } from "react";
import { z } from "zod";

import { DEFAULT_RATE } from "./tts-contract";
import type { TTSPlaybackLifecycle, TTSState } from "./tts-contract";

/**
 * Playback state, the refs shared by every playback path (run id, abort
 * controller, sequence cursor, settle callback, lifecycle, synthesis rate) and
 * the settle/reset steps they all use.
 */
export function useTTSPlaybackCore() {
 const [state, setState] = useState<TTSState>({
  isSpeaking: false,
  isPaused: false,
  isLoading: false,
  error: null,
 });
 const [progress, setProgress] = useState(0);
 const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
 const [durationSeconds, setDurationSeconds] = useState(0);
 const [rate, setRate] = useState(DEFAULT_RATE);
 const [speakingText, setSpeakingText] = useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const [speakingRequestText, setSpeakingRequestText] =
  useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const abortControllerRef = useRef<AbortController>(null);
 const playbackRunRef = useRef(0);
 const sequenceSegmentsRef = useRef<string[]>([]);
 const sequenceIndexRef = useRef(0);
 const settledCallbackRef = useRef<() => void>(null);
 const lifecycleRef = useRef<TTSPlaybackLifecycle>(null);
 const synthesisRateRef = useRef(DEFAULT_RATE);

 const settleLifecycle = useCallback((completed: boolean, error?: Error) => {
  const lifecycle = lifecycleRef.current;
  lifecycleRef.current = null;
  lifecycle?.onSettled?.();
  if (error) lifecycle?.reject(error);
  else lifecycle?.resolve({ completed, cancelled: !completed });
 }, []);

 const settlePlayback = useCallback(
  (completed = true, error?: Error) => {
   const callback = settledCallbackRef.current;
   settledCallbackRef.current = null;
   settleLifecycle(completed, error);
   // The sequence callback means "finished naturally": callers use it for
   // loop/auto-advance, so stop, errors and interruptions must not fire it.
   if (completed && !error) callback?.();
  },
  [settleLifecycle],
 );

 /** Clears speaking text, timing and the sequence cursor, then sets an idle state with `error`. */
 const resetPlayback = useCallback((error: TTSState["error"]) => {
  setSpeakingText(null);
  setSpeakingRequestText(null);
  setProgress(0);
  setCurrentTimeSeconds(0);
  setDurationSeconds(0);
  sequenceSegmentsRef.current = [];
  sequenceIndexRef.current = 0;
  setState({ isSpeaking: false, isPaused: false, isLoading: false, error });
 }, []);

 return {
  state,
  setState,
  progress,
  setProgress,
  currentTimeSeconds,
  setCurrentTimeSeconds,
  durationSeconds,
  setDurationSeconds,
  rate,
  setRate,
  speakingText,
  setSpeakingText,
  speakingRequestText,
  setSpeakingRequestText,
  abortControllerRef,
  playbackRunRef,
  sequenceSegmentsRef,
  sequenceIndexRef,
  settledCallbackRef,
  lifecycleRef,
  synthesisRateRef,
  settleLifecycle,
  settlePlayback,
  resetPlayback,
 };
}
