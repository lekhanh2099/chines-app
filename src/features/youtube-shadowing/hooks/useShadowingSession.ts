"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useShadowingRecorder } from "@/features/reading/hooks/useShadowingRecorder";

import type { YoutubePlayerController } from "./useYoutubePlayer";

const MAX_RECORDINGS = 3;
const TAP_TO_PLAY_HINT_DELAY_MS = 1500;

function subscribeNoop() {
 return () => {};
}

function getClientHydrated() {
 return true;
}

function getServerHydrated() {
 return false;
}

export type ShadowingRecordingItem = {
 id: string;
 attemptNumber: number;
 url: string;
 durationSeconds: number;
 startedAtIndex: number;
};

export function useShadowingSession({
 player,
 activeIndex,
}: {
 player: YoutubePlayerController;
 activeIndex: number;
}) {
 const recorder = useShadowingRecorder();
 const [isShadowing, setIsShadowing] = useState(false);
 const [tapHintElapsed, setTapHintElapsed] = useState(false);
 const [recordings, setRecordings] = useState<ShadowingRecordingItem[]>([]);

 const tapHintTimerRef = useRef<number>(undefined);
 const startedAtIndexRef = useRef(-1);
 const attemptCounterRef = useRef(0);
 const lastBlobRef = useRef<Blob>(undefined);
 const activeUrlsRef = useRef<Set<string>>(new Set());
 const isPlayingRef = useRef(player.isPlaying);
 const isShadowingRef = useRef(isShadowing);
 const durationSecondsRef = useRef(recorder.durationSeconds);

 useEffect(() => {
  isPlayingRef.current = player.isPlaying;
 }, [player.isPlaying]);

 useEffect(() => {
  isShadowingRef.current = isShadowing;
 }, [isShadowing]);

 useEffect(() => {
  durationSecondsRef.current = recorder.durationSeconds;
 }, [recorder.durationSeconds]);

 const clearTapHintTimer = useCallback(() => {
  if (tapHintTimerRef.current === undefined) return;
  window.clearTimeout(tapHintTimerRef.current);
  tapHintTimerRef.current = undefined;
 }, []);

 const stopShadowing = useCallback(() => {
  clearTapHintTimer();
  player.pause();
  recorder.stop();
  setIsShadowing(false);
  setTapHintElapsed(false);
 }, [clearTapHintTimer, player, recorder]);

 const startShadowing = useCallback(async () => {
  clearTapHintTimer();
  setTapHintElapsed(false);
  recorder.clear();

  const started = await recorder.start();
  if (!started) return;

  startedAtIndexRef.current = activeIndex;
  setIsShadowing(true);
  player.play();

  tapHintTimerRef.current = window.setTimeout(() => {
   tapHintTimerRef.current = undefined;
   if (isShadowingRef.current && !isPlayingRef.current) {
    setTapHintElapsed(true);
   }
  }, TAP_TO_PLAY_HINT_DELAY_MS);
 }, [activeIndex, clearTapHintTimer, player, recorder]);

 useEffect(() => {
  if (!player.hasEnded || !isShadowing) return;
  const frameId = window.requestAnimationFrame(() => {
   stopShadowing();
  });
  return () => window.cancelAnimationFrame(frameId);
 }, [isShadowing, player.hasEnded, stopShadowing]);

 useEffect(() => {
  const blob = recorder.audioBlob;
  if (!blob || blob === lastBlobRef.current) return;
  lastBlobRef.current = blob;

  const url = URL.createObjectURL(blob);
  activeUrlsRef.current.add(url);
  attemptCounterRef.current += 1;
  const nextItem: ShadowingRecordingItem = {
   id: `rec-${attemptCounterRef.current}-${Date.now()}`,
   attemptNumber: attemptCounterRef.current,
   url,
   durationSeconds: durationSecondsRef.current,
   startedAtIndex: startedAtIndexRef.current,
  };

  queueMicrotask(() => {
   setRecordings((current) => {
    const next = [nextItem, ...current];
    const kept = next.slice(0, MAX_RECORDINGS);
    const evicted = next.slice(MAX_RECORDINGS);
    for (const item of evicted) {
     URL.revokeObjectURL(item.url);
     activeUrlsRef.current.delete(item.url);
    }
    return kept;
   });
  });
 }, [recorder.audioBlob]);

 const deleteRecording = useCallback((recordingId: string) => {
  setRecordings((current) => {
   const target = current.find((item) => item.id === recordingId);
   if (target) {
    URL.revokeObjectURL(target.url);
    activeUrlsRef.current.delete(target.url);
   }
   return current.filter((item) => item.id !== recordingId);
  });
 }, []);

 useEffect(() => {
  const urls = activeUrlsRef.current;
  return () => {
   clearTapHintTimer();
   for (const url of urls) {
    URL.revokeObjectURL(url);
   }
   urls.clear();
  };
 }, [clearTapHintTimer]);

 const isHydrated = useSyncExternalStore(subscribeNoop, getClientHydrated, getServerHydrated);
 const isRecorderSupported = isHydrated ? recorder.isSupported : true;
 const needsTapToPlay = isShadowing && tapHintElapsed && !player.isPlaying;
 const recorderErrorCode = !isHydrated
  ? ""
  : recorder.error === "permission-denied"
    ? "permission-denied"
    : recorder.error === "unsupported"
      ? "unsupported"
      : recorder.error === "recording-failed"
        ? "recording-failed"
        : !recorder.isSupported
          ? "unsupported"
          : "";

 return {
  isShadowing,
  isRecording: recorder.isRecording,
  isRequestingMic: recorder.isRequesting,
  isRecorderSupported,
  recordingDurationSeconds: recorder.durationSeconds,
  recorderErrorCode,
  needsTapToPlay,
  recordings,
  startShadowing,
  stopShadowing,
  deleteRecording,
 };
}
