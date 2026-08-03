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
  isLoading: z.ZodBoolean;
  error: z.ZodNullable<z.ZodString>;
 }>
>;

export function useTTS() {
 const [state, setState] = useState<TTSState>({
  isSpeaking: false,
  isLoading: false,
  error: null,
 });
 const [progress, setProgress] = useState(0);
 const [voices, setVoices] = useState<TTSVoice[]>([]);
 const [selectedVoiceName, setSelectedVoiceName] = useState("");
 const [rate, setRate] = useState(DEFAULT_RATE);
 const [speakingText, setSpeakingText] = useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const [speakingRequestText, setSpeakingRequestText] =
  useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const audioRef = useRef<HTMLAudioElement>(null);
 const objectUrlRef = useRef<string>(null);
 const abortControllerRef = useRef<AbortController>(null);
 const playbackRunRef = useRef(0);
 const sequenceSegmentsRef = useRef<string[]>([]);
 const sequenceIndexRef = useRef(0);
 const settledCallbackRef = useRef<() => void>(null);

 const cleanupAudio = useCallback(() => {
  if (audioRef.current) {
   audioRef.current.pause();
   audioRef.current.removeAttribute("src");
   audioRef.current.load();
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
  abortControllerRef.current = null;
  cleanupAudio();
  setSpeakingText(null);
  setSpeakingRequestText(null);
  setProgress(0);
  sequenceSegmentsRef.current = [];
  sequenceIndexRef.current = 0;
  setState({ isSpeaking: false, isLoading: false, error: null });
  settlePlayback();
 }, [cleanupAudio, settlePlayback]);

 useEffect(() => {
  const controller = new AbortController();

  async function loadVoices() {
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
   } catch (error) {
    if (controller.signal.aborted) return;
    setState((current) => ({
     ...current,
     error: error instanceof Error ? error.message : "Không tải được giọng Mandarin zh-CN",
    }));
   }
  }

  void loadVoices();
  return () => {
   controller.abort();
   playbackRunRef.current += 1;
   abortControllerRef.current?.abort();
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
    setState({ isSpeaking: false, isLoading: false, error: null });
    settlePlayback();
   };
   audio.onended = finish;
   audio.onerror = () => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    setSpeakingText(null);
    setSpeakingRequestText(null);
    setProgress(0);
    sequenceSegmentsRef.current = [];
    sequenceIndexRef.current = 0;
    setState({
     isSpeaking: false,
     isLoading: false,
     error: "Không thể phát audio từ Microsoft Edge Read Aloud.",
    });
    settlePlayback();
   };
   audio.ontimeupdate = () => {
    if (playbackRunRef.current !== runId) return;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

    setProgress(Math.min(1, Math.max(0, audio.currentTime / audio.duration)));
   };
   setSpeakingText(text);
   setProgress(0);
   setState({ isSpeaking: true, isLoading: false, error: null });
   void audio.play().catch(() => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    setSpeakingText(null);
    setSpeakingRequestText(null);
    setProgress(0);
    sequenceSegmentsRef.current = [];
    sequenceIndexRef.current = 0;
    setState({
     isSpeaking: false,
     isLoading: false,
     error: "Trình duyệt đã chặn phát audio. Hãy chạm lại nút đọc.",
    });
    settlePlayback();
   });
  },
  [cleanupAudio, settlePlayback],
 );

 const loadAndPlay = useCallback(
  async (text: string, runId: number, onComplete?: () => void) => {
   const cacheKey = buildCacheKey(text, selectedVoiceName, rate);
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
      voice: selectedVoiceName,
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
    sequenceSegmentsRef.current = [];
    sequenceIndexRef.current = 0;
    setState({
     isSpeaking: false,
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
   if (!normalizedText || !selectedVoiceName) {
    setState((current) => ({
     ...current,
     error: normalizedText ? "Chưa có giọng Mandarin zh-CN khả dụng." : null,
    }));
    return;
   }

   playbackRunRef.current += 1;
   const runId = playbackRunRef.current;
   abortControllerRef.current?.abort();
   cleanupAudio();
   sequenceSegmentsRef.current = [];
   sequenceIndexRef.current = 0;
   setSpeakingText(null);
   setSpeakingRequestText(normalizedText);
   setProgress(0);
   setState({ isSpeaking: false, isLoading: true, error: null });

   await loadAndPlay(normalizedText, runId, () => {
    setSpeakingText(null);
    setSpeakingRequestText(null);
    setProgress(1);
    setState({ isSpeaking: false, isLoading: false, error: null });
    settlePlayback();
   });
  },
  [cleanupAudio, loadAndPlay, selectedVoiceName, settlePlayback],
 );

 const finishSequence = useCallback(
  (runId: number) => {
   if (playbackRunRef.current !== runId) return;
   sequenceSegmentsRef.current = [];
   sequenceIndexRef.current = 0;
   setSpeakingText(null);
   setSpeakingRequestText(null);
   setProgress(1);
   setState({ isSpeaking: false, isLoading: false, error: null });
   settlePlayback();
  },
  [settlePlayback],
 );

 const playNextSequenceSegment = useCallback(
  async (runId: number) => {
   if (playbackRunRef.current !== runId) return;

   const nextSegment = sequenceSegmentsRef.current[sequenceIndexRef.current];
   if (!nextSegment) {
    finishSequence(runId);
    return;
   }

   setState({ isSpeaking: false, isLoading: true, error: null });
   await loadAndPlay(nextSegment, runId, () => {
    sequenceIndexRef.current += 1;
    void playNextSequenceSegment(runId);
   });
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
   if (normalizedSegments.length === 0 || !selectedVoiceName) {
    stop();
    if (normalizedSegments.length === 0) return;
    setState((current) => ({
     ...current,
     error: "Chưa có giọng Mandarin zh-CN khả dụng.",
    }));
    return;
   }

   playbackRunRef.current += 1;
   const runId = playbackRunRef.current;
   abortControllerRef.current?.abort();
   cleanupAudio();
   sequenceSegmentsRef.current = normalizedSegments;
   sequenceIndexRef.current = 0;
   settledCallbackRef.current = onComplete ?? null;
   setSpeakingText(null);
   setSpeakingRequestText(requestedText);
   setProgress(0);
   setState({ isSpeaking: false, isLoading: true, error: null });
   void playNextSequenceSegment(runId);
  },
  [cleanupAudio, playNextSequenceSegment, selectedVoiceName, stop],
 );

 const selectedVoice =
  voices.find((voice) => voice.shortName === selectedVoiceName) ?? voices[0] ?? null;

 return {
  voices,
  selectedVoice,
  selectedVoiceName,
  setSelectedVoiceName,
  rate,
  setRate,
  speak,
  speakSequence,
  stop,
  isSpeaking: state.isSpeaking,
  speakingText,
  speakingRequestText,
  progress,
  isLoading: state.isLoading,
  error: state.error,
 };
}
