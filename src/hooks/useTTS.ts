"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { buildCacheKey, getCachedAudio, setCachedAudio } from "@/lib/tts-cache";
import type { JsonFieldValue } from "@/types/json";

export const TTSVoiceSchema = z.object({
 name: z.string(),
 shortName: z.string(),
 gender: z.string(),
 locale: z.string(),
});
const TTSVoiceListSchema = z.array(TTSVoiceSchema);
export type TTSVoice = z.infer<typeof TTSVoiceSchema>;

const DEFAULT_RATE = 1;
const MAX_TTS_TEXT_LENGTH = 10_000;

function splitSpeechSegments(segments: readonly string[]) {
 return segments.flatMap((segment) => {
  const normalizedSegment = segment.trim();
  if (!normalizedSegment) return [];

  if (normalizedSegment.length <= MAX_TTS_TEXT_LENGTH) return [normalizedSegment];

  const chunks: string[] = [];
  let chunk = "";
  for (const character of Array.from(normalizedSegment)) {
   if (chunk && chunk.length + character.length > MAX_TTS_TEXT_LENGTH) {
    chunks.push(chunk);
    chunk = "";
   }
   chunk += character;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
 });
}

type TTSState = z.infer<
 z.ZodObject<{
  isSpeaking: z.ZodBoolean;
  isPaused: z.ZodBoolean;
  isLoading: z.ZodBoolean;
  error: z.ZodNullable<z.ZodString>;
 }>
>;

export function useTTS() {
 const [state, setState] = useState<TTSState>({
  isSpeaking: false,
  isPaused: false,
  isLoading: false,
  error: null,
 });
 const [progress, setProgress] = useState(0);
 const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
 const [durationSeconds, setDurationSeconds] = useState(0);
 const [voices, setVoices] = useState<TTSVoice[]>([]);
 const [selectedVoiceName, setSelectedVoiceName] = useState("");
 const [rate, setRate] = useState(DEFAULT_RATE);
 const [speakingText, setSpeakingText] = useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const [speakingRequestText, setSpeakingRequestText] =
  useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const audioRef = useRef<HTMLAudioElement>(null);
 const objectUrlRef = useRef<string>(null);
 const abortControllerRef = useRef<AbortController>(null);
 const generationAbortControllerRef = useRef<AbortController>(null);
 const voiceLoadControllerRef = useRef<AbortController>(null);
 const voiceLoadPromiseRef = useRef<Promise<TTSVoice[]> | null>(null);
 const playbackRunRef = useRef(0);
 const sequenceSegmentsRef = useRef<string[]>([]);
 const sequenceIndexRef = useRef(0);
 const settledCallbackRef = useRef<() => void>(null);

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

 const settlePlayback = useCallback(() => {
  const callback = settledCallbackRef.current;
  settledCallbackRef.current = null;
  callback?.();
 }, []);

 const stop = useCallback(() => {
  playbackRunRef.current += 1;
  abortControllerRef.current?.abort();
  generationAbortControllerRef.current?.abort();
  abortControllerRef.current = null;
  generationAbortControllerRef.current = null;
  cleanupAudio();
  setSpeakingText(null);
  setSpeakingRequestText(null);
  setProgress(0);
  setCurrentTimeSeconds(0);
  setDurationSeconds(0);
  sequenceSegmentsRef.current = [];
  sequenceIndexRef.current = 0;
  setState({ isSpeaking: false, isPaused: false, isLoading: false, error: null });
  settlePlayback();
 }, [cleanupAudio, settlePlayback]);

 const pause = useCallback(() => {
  const audio = audioRef.current;
  if (audio === null || audio.paused) return;
  audio.pause();
 }, []);

 const resume = useCallback(() => {
  const audio = audioRef.current;
  if (audio === null || !audio.paused) return;
  void audio.play().catch(() => {
   setState((current) => ({
    ...current,
    isSpeaking: false,
    isPaused: true,
    error: "Trình duyệt đã chặn tiếp tục phát audio.",
   }));
  });
 }, []);

 const loadVoices = useCallback((): Promise<TTSVoice[]> => {
  if (voices.length > 0) return Promise.resolve(voices);
  const pending = voiceLoadPromiseRef.current;
  if (pending !== null) return pending;

  const controller = new AbortController();
  voiceLoadControllerRef.current = controller;
  const promise = (async () => {
   try {
    const response = await fetch("/api/tts", { signal: controller.signal });
    if (!response.ok) throw new Error(`TTS voices API ${response.status}`);

    const voicePayload: JsonFieldValue = await response.json();
    const nextVoices = TTSVoiceListSchema.parse(voicePayload);
    setVoices(nextVoices);
    setSelectedVoiceName((current) =>
     nextVoices.some((voice) => voice.shortName === current)
      ? current
      : (nextVoices[0]?.shortName ?? ""),
    );
    setState((current) => ({ ...current, error: null }));
    return nextVoices;
   } catch (error) {
    if (controller.signal.aborted) return [];
    setState((current) => ({
     ...current,
     error: error instanceof Error ? error.message : "Không tải được giọng Mandarin zh-CN",
    }));
    return [];
   }
  })();
  voiceLoadPromiseRef.current = promise;
  void promise.then(
   () => {
    if (voiceLoadPromiseRef.current === promise) voiceLoadPromiseRef.current = null;
   },
   () => {
    if (voiceLoadPromiseRef.current === promise) voiceLoadPromiseRef.current = null;
   },
  );
  return promise;
 }, [voices]);

 useEffect(() => {
  return () => {
   voiceLoadControllerRef.current?.abort();
   playbackRunRef.current += 1;
   abortControllerRef.current?.abort();
   generationAbortControllerRef.current?.abort();
   cleanupAudio();
  };
 }, [cleanupAudio]);

 const playBlob = useCallback(
  (blob: Blob, runId: number, text: string, onComplete?: () => void) => {
   if (playbackRunRef.current !== runId) return;

   const url = URL.createObjectURL(blob);
   objectUrlRef.current = url;
   const audio = new Audio(url);
   audioRef.current = audio;
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
    setSpeakingText(null);
    setSpeakingRequestText(null);
    setProgress(0);
    setCurrentTimeSeconds(0);
    setDurationSeconds(0);
    sequenceSegmentsRef.current = [];
    sequenceIndexRef.current = 0;
    setState({
     isSpeaking: false,
     isPaused: false,
     isLoading: false,
     error: "Không thể phát audio từ Microsoft Edge Read Aloud.",
    });
    settlePlayback();
   };
   const syncTiming = () => {
    if (playbackRunRef.current !== runId) return;
    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    const currentTime = Number.isFinite(audio.currentTime) ? Math.max(0, audio.currentTime) : 0;
    setCurrentTimeSeconds(currentTime);
    setDurationSeconds(duration);
    if (duration > 0) setProgress(Math.min(1, Math.max(0, currentTime / duration)));
   };
   audio.onloadedmetadata = syncTiming;
   audio.ontimeupdate = syncTiming;
   setSpeakingText(text);
   setProgress(0);
   audio.onplay = () => {
    if (playbackRunRef.current !== runId) return;
    setState((current) => ({ ...current, isSpeaking: true, isPaused: false, error: null }));
   };
   audio.onpause = () => {
    if (playbackRunRef.current !== runId || audio.ended) return;
    setState((current) => ({ ...current, isSpeaking: false, isPaused: true }));
   };
   setState({ isSpeaking: true, isPaused: false, isLoading: false, error: null });
   void audio.play().catch(() => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    setSpeakingText(null);
    setSpeakingRequestText(null);
    setProgress(0);
    setCurrentTimeSeconds(0);
    setDurationSeconds(0);
    sequenceSegmentsRef.current = [];
    sequenceIndexRef.current = 0;
    setState({
     isSpeaking: false,
     isPaused: false,
     isLoading: false,
     error: "Trình duyệt đã chặn phát audio. Hãy chạm lại nút đọc.",
    });
    settlePlayback();
   });
  },
  [cleanupAudio, settlePlayback],
 );

 const loadAndPlay = useCallback(
  async (text: string, runId: number, onComplete?: () => void, voiceName = selectedVoiceName) => {
   const cacheKey = buildCacheKey(text, voiceName, rate);
   const cached = await getCachedAudio(cacheKey);
   if (playbackRunRef.current !== runId) return;
   if (cached) {
    playBlob(cached, runId, text, onComplete);
    return;
   }

   const controller = new AbortController();
   abortControllerRef.current = controller;

   try {
    const response = await fetch("/api/tts", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
      text,
      voice: voiceName,
      rate,
     }),
     signal: controller.signal,
    });
    if (!response.ok) throw new Error(`TTS API ${response.status}`);

    const blob = await response.blob();
    if (playbackRunRef.current !== runId) return;
    void setCachedAudio(cacheKey, blob);
    playBlob(blob, runId, text, onComplete);
   } catch (error) {
    if (controller.signal.aborted || playbackRunRef.current !== runId) return;
    setSpeakingText(null);
    setSpeakingRequestText(null);
    setProgress(0);
    setCurrentTimeSeconds(0);
    setDurationSeconds(0);
    sequenceSegmentsRef.current = [];
    sequenceIndexRef.current = 0;
    setState({
     isSpeaking: false,
     isPaused: false,
     isLoading: false,
     error: error instanceof Error ? error.message : "Microsoft Edge Read Aloud không khả dụng.",
    });
    settlePlayback();
   } finally {
    if (abortControllerRef.current === controller) abortControllerRef.current = null;
   }
  },
  [playBlob, rate, selectedVoiceName, settlePlayback],
 );

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
   const runId = playbackRunRef.current;
   abortControllerRef.current?.abort();
   cleanupAudio();

   const availableVoices = await loadVoices();
   if (playbackRunRef.current !== runId) return;
   const voiceName = selectedVoiceName || availableVoices[0]?.shortName || "";
   if (!voiceName) return;

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
  [cleanupAudio, loadAndPlay, loadVoices, selectedVoiceName, settlePlayback],
 );

 const generateAudio = useCallback(
  async (text: string): Promise<Blob | null> => {
   const normalizedText = text.trim();
   if (!normalizedText) {
    setState((current) => ({
     ...current,
     error: null,
    }));
    return null;
   }

   const availableVoices = await loadVoices();
   const voiceName = selectedVoiceName || availableVoices[0]?.shortName || "";
   if (!voiceName) return null;

   const cacheKey = buildCacheKey(normalizedText, voiceName, rate);
   const cached = await getCachedAudio(cacheKey);
   if (cached) return cached;

   generationAbortControllerRef.current?.abort();
   const controller = new AbortController();
   generationAbortControllerRef.current = controller;

   try {
    const response = await fetch("/api/tts", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
      text: normalizedText,
      voice: voiceName,
      rate,
     }),
     signal: controller.signal,
    });
    if (!response.ok) throw new Error(`TTS API ${response.status}`);

    const blob = await response.blob();
    if (controller.signal.aborted) return null;
    await setCachedAudio(cacheKey, blob);
    setState((current) => ({ ...current, error: null }));
    return blob;
   } catch (error) {
    if (controller.signal.aborted) return null;
    setState((current) => ({
     ...current,
     error: error instanceof Error ? error.message : "Không tạo được audio Mandarin.",
    }));
    return null;
   } finally {
    if (generationAbortControllerRef.current === controller) {
     generationAbortControllerRef.current = null;
    }
   }
  },
  [loadVoices, rate, selectedVoiceName],
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
  [settlePlayback],
 );

 const playNextSequenceSegment = useCallback(
  async (runId: number, voiceName: string) => {
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
     void playNextSequenceSegment(runId, voiceName);
    },
    voiceName,
   );
  },
  [finishSequence, loadAndPlay],
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
   const runId = playbackRunRef.current;
   abortControllerRef.current?.abort();
   cleanupAudio();

   void loadVoices().then((availableVoices) => {
    if (playbackRunRef.current !== runId) return;
    const voiceName = selectedVoiceName || availableVoices[0]?.shortName || "";
    if (!voiceName) return;

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
  [cleanupAudio, loadVoices, playNextSequenceSegment, selectedVoiceName, stop],
 );

 const selectedVoice =
  voices.find((voice) => voice.shortName === selectedVoiceName) ?? voices[0] ?? null;

 return {
  voices,
  loadVoices,
  selectedVoice,
  selectedVoiceName,
  setSelectedVoiceName,
  rate,
  setRate,
  speak,
  speakSequence,
  pause,
  resume,
  generateAudio,
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
