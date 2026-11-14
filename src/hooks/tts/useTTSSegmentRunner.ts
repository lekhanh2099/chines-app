"use client";

import { useCallback } from "react";

import { buildCacheKey } from "@/lib/audio/tts-cache";
import { loadTTSAudio } from "./tts-audio-request";
import type { useTTSAudioElement } from "./useTTSAudioElement";
import type { useTTSPlaybackCore } from "./useTTSPlaybackCore";
import type { useTTSPreparation } from "./useTTSPreparation";

/**
 * Loads (reusing a matching preparation) and plays one segment, and walks the
 * sequence cursor segment by segment until the run finishes or is superseded.
 */
export function useTTSSegmentRunner({
 core,
 selectedVoiceName,
 preparedAudioRef,
 playBlob,
}: {
 core: ReturnType<typeof useTTSPlaybackCore>;
 selectedVoiceName: string;
 preparedAudioRef: ReturnType<typeof useTTSPreparation>["preparedAudioRef"];
 playBlob: ReturnType<typeof useTTSAudioElement>["playBlob"];
}) {
 const {
  rate,
  setState,
  setProgress,
  setSpeakingText,
  setSpeakingRequestText,
  abortControllerRef,
  playbackRunRef,
  sequenceSegmentsRef,
  sequenceIndexRef,
  lifecycleRef,
  settlePlayback,
  resetPlayback,
 } = core;

 const loadAndPlay = useCallback(
  async (
   text: string,
   runId: number,
   onComplete?: () => void,
   voiceName = selectedVoiceName,
   synthesisRate = rate,
  ) => {
   const cacheKey = buildCacheKey(text, voiceName, synthesisRate);
   const preparation = preparedAudioRef.current;
   preparedAudioRef.current = null;
   const matches = preparation?.key === cacheKey;
   if (!matches) preparation?.controller.abort();
   const controller = matches && preparation ? preparation.controller : new AbortController();
   abortControllerRef.current = controller;

   try {
    const blob =
     matches && preparation
      ? await preparation.promise.catch((error) => {
         if (controller.signal.aborted) throw error;
         return loadTTSAudio(text, voiceName, synthesisRate, controller);
        })
      : await loadTTSAudio(text, voiceName, synthesisRate, controller);
    if (playbackRunRef.current !== runId) return;
    playBlob(blob, runId, text, onComplete, synthesisRate);
   } catch (error) {
    if (controller.signal.aborted || playbackRunRef.current !== runId) return;

    resetPlayback(
     error instanceof Error ? error.message : "Microsoft Edge Read Aloud không khả dụng.",
    );
    settlePlayback(
     false,
     error instanceof Error ? error : new Error("Microsoft Edge Read Aloud không khả dụng."),
    );
   } finally {
    if (abortControllerRef.current === controller) abortControllerRef.current = null;
   }
  },
  [
   abortControllerRef,
   playBlob,
   playbackRunRef,
   preparedAudioRef,
   rate,
   resetPlayback,
   selectedVoiceName,
   settlePlayback,
  ],
 );

 const finishSequence = useCallback(
  (runId: number) => {
   if (playbackRunRef.current !== runId) return;
   sequenceSegmentsRef.current = [];
   sequenceIndexRef.current = 0;
   setSpeakingText(null);
   setSpeakingRequestText(null);
   setProgress(1);
   setState({ isSpeaking: false, isPaused: false, isLoading: false, error: null });
   settlePlayback();
  },
  [
   playbackRunRef,
   sequenceIndexRef,
   sequenceSegmentsRef,
   setProgress,
   setSpeakingRequestText,
   setSpeakingText,
   setState,
   settlePlayback,
  ],
 );

 const playNextSequenceSegment = useCallback(
  (runId: number, voiceName: string) => {
   const playNext = async (): Promise<void> => {
    if (playbackRunRef.current !== runId) return;

    const nextSegment = sequenceSegmentsRef.current[sequenceIndexRef.current];
    if (!nextSegment) {
     finishSequence(runId);
     return;
    }

    setState({ isSpeaking: false, isPaused: false, isLoading: true, error: null });
    await loadAndPlay(
     nextSegment,
     runId,
     () => {
      sequenceIndexRef.current += 1;
      void playNext();
     },
     voiceName,
     lifecycleRef.current?.rate ?? rate,
    );
   };
   return playNext();
  },
  [
   finishSequence,
   lifecycleRef,
   loadAndPlay,
   playbackRunRef,
   rate,
   sequenceIndexRef,
   sequenceSegmentsRef,
   setState,
  ],
 );

 return { loadAndPlay, playNextSequenceSegment };
}
