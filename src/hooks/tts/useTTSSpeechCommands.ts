"use client";

import { useCallback } from "react";

import { DEFAULT_MANDARIN_VOICE } from "./tts-contract";
import type { TTSPlaybackOptions, TTSPlaybackResult } from "./tts-contract";
import { splitSpeechSegments } from "./tts-text";
import type { useTTSAudioElement } from "./useTTSAudioElement";
import type { useTTSPlaybackCore } from "./useTTSPlaybackCore";
import type { useTTSPreparation } from "./useTTSPreparation";
import type { useTTSSegmentRunner } from "./useTTSSegmentRunner";
import type { useTTSVoices } from "./useTTSVoices";

type TTSVoices = ReturnType<typeof useTTSVoices>;
type TTSPreparation = ReturnType<typeof useTTSPreparation>;
type TTSSegmentRunner = ReturnType<typeof useTTSSegmentRunner>;

/**
 * The public playback entry points. Each starts a new playback run: `speak`
 * (one text), `speakWithLifecycle` (promise that settles with the run) and
 * `speakSequence` (segments plus a natural-completion callback).
 */
export function useTTSSpeechCommands({
 core,
 selectedVoiceName,
 loadVoices,
 voiceLoadErrorRef,
 preparedAudioRef,
 cancelPreparation,
 cleanupAudio,
 loadAndPlay,
 playNextSequenceSegment,
 stop,
}: {
 core: ReturnType<typeof useTTSPlaybackCore>;
 selectedVoiceName: TTSVoices["selectedVoiceName"];
 loadVoices: TTSVoices["loadVoices"];
 voiceLoadErrorRef: TTSVoices["voiceLoadErrorRef"];
 preparedAudioRef: TTSPreparation["preparedAudioRef"];
 cancelPreparation: TTSPreparation["cancelPreparation"];
 cleanupAudio: ReturnType<typeof useTTSAudioElement>["cleanupAudio"];
 loadAndPlay: TTSSegmentRunner["loadAndPlay"];
 playNextSequenceSegment: TTSSegmentRunner["playNextSequenceSegment"];
 stop: () => void;
}) {
 const {
  setState,
  setProgress,
  setCurrentTimeSeconds,
  setDurationSeconds,
  setSpeakingText,
  setSpeakingRequestText,
  abortControllerRef,
  playbackRunRef,
  sequenceSegmentsRef,
  sequenceIndexRef,
  settledCallbackRef,
  lifecycleRef,
  settleLifecycle,
  settlePlayback,
 } = core;

 const speak = useCallback(
  async (text: string) => {
   const normalizedText = text.trim();
   if (!normalizedText) {
    setState((current) => ({
     ...current,
     error: null,
    }));
    return;
   }

   playbackRunRef.current += 1;
   cancelPreparation();
   const runId = playbackRunRef.current;
   settledCallbackRef.current = null;
   settleLifecycle(false);
   abortControllerRef.current?.abort();
   cleanupAudio();

   const availableVoices = await loadVoices();
   if (playbackRunRef.current !== runId) return;
   const voiceName = selectedVoiceName || availableVoices[0]?.shortName || DEFAULT_MANDARIN_VOICE;

   sequenceSegmentsRef.current = [];
   sequenceIndexRef.current = 0;
   setSpeakingText(null);
   setSpeakingRequestText(normalizedText);
   setProgress(0);
   setCurrentTimeSeconds(0);
   setDurationSeconds(0);
   setState({ isSpeaking: false, isPaused: false, isLoading: true, error: null });

   await loadAndPlay(
    normalizedText,
    runId,
    () => {
     setSpeakingText(null);
     setSpeakingRequestText(null);
     setProgress(1);
     setState({ isSpeaking: false, isPaused: false, isLoading: false, error: null });
     settlePlayback();
    },
    voiceName,
   );
  },
  [
   abortControllerRef,
   cancelPreparation,
   cleanupAudio,
   loadAndPlay,
   loadVoices,
   playbackRunRef,
   selectedVoiceName,
   sequenceIndexRef,
   sequenceSegmentsRef,
   setCurrentTimeSeconds,
   setDurationSeconds,
   setProgress,
   setSpeakingRequestText,
   setSpeakingText,
   setState,
   settleLifecycle,
   settlePlayback,
   settledCallbackRef,
  ],
 );

 const speakWithLifecycle = useCallback(
  (text: string, options: TTSPlaybackOptions): Promise<TTSPlaybackResult> => {
   // Keep the one prepared segment across the normal Reader handoff.
   const preparation = preparedAudioRef.current;
   preparedAudioRef.current = null;
   stop();
   const runId = playbackRunRef.current;
   const normalizedText = text.trim();
   if (!normalizedText) {
    preparation?.controller.abort();
    return Promise.resolve({ completed: true, cancelled: false });
   }
   if (!Number.isFinite(options.rate) || options.rate <= 0) {
    preparation?.controller.abort();
    return Promise.reject(new Error("Invalid speech rate"));
   }
   preparedAudioRef.current = preparation;
   return new Promise((resolve, reject) => {
    sequenceSegmentsRef.current = splitSpeechSegments([normalizedText]);
    sequenceIndexRef.current = 0;
    lifecycleRef.current = {
     ...options,
     resolve,
     reject,
     onProgress: (progress) => {
      const index = sequenceIndexRef.current;
      const preceding = sequenceSegmentsRef.current
       .slice(0, index)
       .reduce((sum, part) => sum + part.length, 0);
      const length = sequenceSegmentsRef.current[index]?.length ?? 0;
      options.onProgress?.(
       preceding / normalizedText.length + (length / normalizedText.length) * progress,
      );
     },
    };
    setSpeakingRequestText(normalizedText);
    setState({ isSpeaking: false, isPaused: false, isLoading: true, error: null });
    void loadVoices()
     .then(async (availableVoices) => {
      if (playbackRunRef.current !== runId) return;
      const voiceName = selectedVoiceName || availableVoices[0]?.shortName;
      if (!voiceName) {
       throw voiceLoadErrorRef.current ?? new Error("Không tải được giọng Mandarin zh-CN");
      }
      await playNextSequenceSegment(runId, voiceName);
     })
     .catch((error) => {
      if (playbackRunRef.current !== runId) return;
      const failure =
       error instanceof Error ? error : new Error("Microsoft Edge Read Aloud không khả dụng.");
      settlePlayback(false, failure);
      setSpeakingRequestText(null);
      setState({ isSpeaking: false, isPaused: false, isLoading: false, error: failure.message });
     });
   });
  },
  [
   lifecycleRef,
   loadVoices,
   playNextSequenceSegment,
   playbackRunRef,
   preparedAudioRef,
   selectedVoiceName,
   sequenceIndexRef,
   sequenceSegmentsRef,
   setSpeakingRequestText,
   setState,
   settlePlayback,
   stop,
   voiceLoadErrorRef,
  ],
 );

 const speakSequence = useCallback(
  (segments: readonly string[], onComplete?: () => void) => {
   const requestedText = segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("\n");
   const normalizedSegments = splitSpeechSegments(segments);
   if (normalizedSegments.length === 0) {
    stop();
    return;
   }

   playbackRunRef.current += 1;
   cancelPreparation();
   const runId = playbackRunRef.current;
   settledCallbackRef.current = null;
   settleLifecycle(false);
   abortControllerRef.current?.abort();
   cleanupAudio();

   void loadVoices().then((availableVoices) => {
    if (playbackRunRef.current !== runId) return;
    const voiceName = selectedVoiceName || availableVoices[0]?.shortName || DEFAULT_MANDARIN_VOICE;

    sequenceSegmentsRef.current = normalizedSegments;
    sequenceIndexRef.current = 0;
    settledCallbackRef.current = onComplete ?? null;
    setSpeakingText(null);
    setSpeakingRequestText(requestedText);
    setProgress(0);
    setCurrentTimeSeconds(0);
    setDurationSeconds(0);
    setState({ isSpeaking: false, isPaused: false, isLoading: true, error: null });
    void playNextSequenceSegment(runId, voiceName);
   });
  },
  [
   abortControllerRef,
   cancelPreparation,
   cleanupAudio,
   loadVoices,
   playNextSequenceSegment,
   playbackRunRef,
   selectedVoiceName,
   sequenceIndexRef,
   sequenceSegmentsRef,
   setCurrentTimeSeconds,
   setDurationSeconds,
   setProgress,
   setSpeakingRequestText,
   setSpeakingText,
   setState,
   settleLifecycle,
   settledCallbackRef,
   stop,
  ],
 );

 return { speak, speakWithLifecycle, speakSequence };
}
