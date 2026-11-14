"use client";

import { useCallback, useEffect } from "react";

import { useTTSAudioElement } from "./tts/useTTSAudioElement";
import { useTTSAudioGeneration } from "./tts/useTTSAudioGeneration";
import { useTTSPlaybackCore } from "./tts/useTTSPlaybackCore";
import { useTTSPreparation } from "./tts/useTTSPreparation";
import { useTTSSegmentRunner } from "./tts/useTTSSegmentRunner";
import { useTTSSpeechCommands } from "./tts/useTTSSpeechCommands";
import { useTTSVoices } from "./tts/useTTSVoices";

export {
 DEFAULT_MANDARIN_VOICE,
 MANDARIN_VOICE_STORAGE_KEY,
 TTSVoiceSchema,
} from "./tts/tts-contract";
export type { TTSVoice } from "./tts/tts-contract";

export function useTTS() {
 const core = useTTSPlaybackCore();
 const {
  state,
  setState,
  progress,
  currentTimeSeconds,
  durationSeconds,
  rate,
  setRate,
  speakingText,
  speakingRequestText,
  abortControllerRef,
  playbackRunRef,
  lifecycleRef,
  synthesisRateRef,
  settleLifecycle,
  settlePlayback,
  resetPlayback,
 } = core;
 const {
  voices,
  selectedVoice,
  selectedVoiceName,
  setSelectedVoiceName,
  loadVoices,
  abortVoiceLoad,
  voiceLoadErrorRef,
 } = useTTSVoices(setState);
 const { preparedAudioRef, cancelPreparation, prepareAudio } = useTTSPreparation({
  loadVoices,
  selectedVoiceName,
  voiceLoadErrorRef,
 });
 const { audioRef, cleanupAudio, playBlob } = useTTSAudioElement(core);
 const { generateAudio, generationAbortControllerRef } = useTTSAudioGeneration({
  loadVoices,
  selectedVoiceName,
  rate,
  setState,
 });
 const { loadAndPlay, playNextSequenceSegment } = useTTSSegmentRunner({
  core,
  selectedVoiceName,
  preparedAudioRef,
  playBlob,
 });

 const stop = useCallback(() => {
  cancelPreparation();
  playbackRunRef.current += 1;
  abortControllerRef.current?.abort();
  generationAbortControllerRef.current?.abort();
  abortControllerRef.current = null;
  generationAbortControllerRef.current = null;
  cleanupAudio();
  resetPlayback(null);
  settlePlayback(false);
 }, [
  abortControllerRef,
  cancelPreparation,
  cleanupAudio,
  generationAbortControllerRef,
  playbackRunRef,
  resetPlayback,
  settlePlayback,
 ]);

 const pause = useCallback(() => {
  const audio = audioRef.current;
  if (audio === null || audio.paused) return;
  audio.pause();
 }, [audioRef]);

 const resume = useCallback(() => {
  const audio = audioRef.current;
  if (audio === null || !audio.paused) return;
  const runId = playbackRunRef.current;
  void audio.play().catch(() => {
   if (playbackRunRef.current !== runId) return;
   setState((current) => ({
    ...current,
    isSpeaking: false,
    isPaused: true,
    error: "Trình duyệt đã chặn tiếp tục phát audio.",
   }));
   settleLifecycle(false, new Error("Trình duyệt đã chặn tiếp tục phát audio."));
  });
 }, [audioRef, playbackRunRef, setState, settleLifecycle]);

 useEffect(() => {
  return () => {
   abortVoiceLoad();
   playbackRunRef.current += 1;
   abortControllerRef.current?.abort();
   generationAbortControllerRef.current?.abort();
   cancelPreparation();
   cleanupAudio();
   settleLifecycle(false);
  };
 }, [
  abortControllerRef,
  abortVoiceLoad,
  cancelPreparation,
  cleanupAudio,
  generationAbortControllerRef,
  playbackRunRef,
  settleLifecycle,
 ]);

 const { speak, speakWithLifecycle, speakSequence } = useTTSSpeechCommands({
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
 });

 const setPlaybackRate = useCallback(
  (nextRate: number) => {
   if (!Number.isFinite(nextRate) || nextRate <= 0) return;
   if (lifecycleRef.current?.rate !== nextRate) cancelPreparation();
   setRate(nextRate);
   if (lifecycleRef.current) lifecycleRef.current.rate = nextRate;
   if (audioRef.current) audioRef.current.playbackRate = nextRate / synthesisRateRef.current;
  },
  [audioRef, cancelPreparation, lifecycleRef, setRate, synthesisRateRef],
 );

 return {
  voices,
  loadVoices,
  selectedVoice,
  selectedVoiceName,
  setSelectedVoiceName,
  rate,
  setRate,
  speak,
  speakWithLifecycle,
  setPlaybackRate,
  speakSequence,
  pause,
  resume,
  generateAudio,
  prepareAudio,
  cancelPreparation,
  stop,
  isSpeaking: state.isSpeaking,
  isPaused: state.isPaused,
  speakingText,
  speakingRequestText,
  progress,
  currentTimeSeconds,
  durationSeconds,
  isLoading: state.isLoading,
  error: state.error,
 };
}
