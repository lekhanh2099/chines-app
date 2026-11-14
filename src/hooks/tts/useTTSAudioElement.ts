"use client";

import { useCallback, useRef } from "react";

import type { useTTSPlaybackCore } from "./useTTSPlaybackCore";

/** Owns the playing `HTMLAudioElement` and its object URL: creation, event wiring and teardown. */
export function useTTSAudioElement(core: ReturnType<typeof useTTSPlaybackCore>) {
 const {
  rate,
  setState,
  setProgress,
  setCurrentTimeSeconds,
  setDurationSeconds,
  setSpeakingText,
  setSpeakingRequestText,
  playbackRunRef,
  lifecycleRef,
  synthesisRateRef,
  settlePlayback,
  resetPlayback,
 } = core;
 const audioRef = useRef<HTMLAudioElement>(null);
 const objectUrlRef = useRef<string>(null);

 const cleanupAudio = useCallback(() => {
  if (audioRef.current) {
   const audio = audioRef.current;
   audio.onended = null;
   audio.onerror = null;
   audio.onpause = null;
   audio.onplay = null;
   audio.onloadedmetadata = null;
   audio.ontimeupdate = null;
   audio.pause();
   audio.removeAttribute("src");
   audio.load();
   audioRef.current = null;
  }
  if (objectUrlRef.current) {
   URL.revokeObjectURL(objectUrlRef.current);
   objectUrlRef.current = null;
  }
 }, []);

 const playBlob = useCallback(
  (blob: Blob, runId: number, text: string, onComplete?: () => void, synthesisRate = rate) => {
   if (playbackRunRef.current !== runId) return;

   const url = URL.createObjectURL(blob);
   objectUrlRef.current = url;
   const audio = new Audio(url);
   audioRef.current = audio;
   synthesisRateRef.current = synthesisRate;
   audio.playbackRate = (lifecycleRef.current?.rate ?? synthesisRate) / synthesisRate;
   const finish = () => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    if (onComplete) {
     setProgress(1);
     onComplete();
     return;
    }
    setSpeakingText(null);
    setSpeakingRequestText(null);
    setProgress(1);
    setState({ isSpeaking: false, isPaused: false, isLoading: false, error: null });
    settlePlayback();
   };
   audio.onended = finish;
   audio.onerror = () => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    resetPlayback("Không thể phát audio từ Microsoft Edge Read Aloud.");
    settlePlayback(false, new Error("Không thể phát audio từ Microsoft Edge Read Aloud."));
   };
   const syncTiming = () => {
    if (playbackRunRef.current !== runId) return;
    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    const currentTime = Number.isFinite(audio.currentTime) ? Math.max(0, audio.currentTime) : 0;
    setCurrentTimeSeconds(currentTime);
    setDurationSeconds(duration);
    if (duration > 0) {
     const nextProgress = Math.min(1, Math.max(0, currentTime / duration));
     setProgress(nextProgress);
     lifecycleRef.current?.onProgress?.(nextProgress);
    }
   };
   audio.onloadedmetadata = syncTiming;
   audio.ontimeupdate = syncTiming;
   setSpeakingText(text);
   setProgress(0);
   audio.onplay = () => {
    if (playbackRunRef.current !== runId) return;
    setState((current) => ({ ...current, isSpeaking: true, isPaused: false, error: null }));
    lifecycleRef.current?.onProgress?.(
     audio.duration > 0 ? Math.min(1, Math.max(0, audio.currentTime / audio.duration)) : 0,
    );
   };
   audio.onpause = () => {
    if (playbackRunRef.current !== runId || audio.ended) return;
    setState((current) => ({ ...current, isSpeaking: false, isPaused: true }));
   };
   setState({ isSpeaking: true, isPaused: false, isLoading: false, error: null });
   void audio.play().catch(() => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    resetPlayback("Trình duyệt đã chặn phát audio. Hãy chạm lại nút đọc.");
    settlePlayback(false, new Error("Trình duyệt đã chặn phát audio. Hãy chạm lại nút đọc."));
   });
  },
  [
   cleanupAudio,
   lifecycleRef,
   playbackRunRef,
   rate,
   resetPlayback,
   setCurrentTimeSeconds,
   setDurationSeconds,
   setProgress,
   setSpeakingRequestText,
   setSpeakingText,
   setState,
   settlePlayback,
   synthesisRateRef,
  ],
 );

 return { audioRef, cleanupAudio, playBlob };
}
