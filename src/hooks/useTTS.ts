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
 const [voices, setVoices] = useState<TTSVoice[]>([]);
 const [selectedVoiceName, setSelectedVoiceName] = useState("");
 const [rate, setRate] = useState(DEFAULT_RATE);
 const [speakingText, setSpeakingText] = useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const audioRef = useRef<HTMLAudioElement>(null);
 const objectUrlRef = useRef<string>(null);
 const abortControllerRef = useRef<AbortController>(null);
 const playbackRunRef = useRef(0);

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

 const stop = useCallback(() => {
  playbackRunRef.current += 1;
  abortControllerRef.current?.abort();
  abortControllerRef.current = null;
  cleanupAudio();
  setSpeakingText(null);
  setState({ isSpeaking: false, isLoading: false, error: null });
 }, [cleanupAudio]);

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
  (blob: Blob, runId: number, text: string) => {
   if (playbackRunRef.current !== runId) return;

   const url = URL.createObjectURL(blob);
   objectUrlRef.current = url;
   const audio = new Audio(url);
   audioRef.current = audio;
   const finish = () => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    setSpeakingText(null);
    setState({ isSpeaking: false, isLoading: false, error: null });
   };
   audio.onended = finish;
   audio.onerror = () => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    setSpeakingText(null);
    setState({
     isSpeaking: false,
     isLoading: false,
     error: "Không thể phát audio từ Microsoft Edge Read Aloud.",
    });
   };
   setSpeakingText(text);
   setState({ isSpeaking: true, isLoading: false, error: null });
   void audio.play().catch(() => {
    if (playbackRunRef.current !== runId) return;
    cleanupAudio();
    setSpeakingText(null);
    setState({
     isSpeaking: false,
     isLoading: false,
     error: "Trình duyệt đã chặn phát audio. Hãy chạm lại nút đọc.",
    });
   });
  },
  [cleanupAudio],
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
   setSpeakingText(null);
   setState({ isSpeaking: false, isLoading: true, error: null });

   const cacheKey = buildCacheKey(normalizedText, selectedVoiceName, rate);
   const cached = await getCachedAudio(cacheKey);
   if (playbackRunRef.current !== runId) return;
   if (cached) {
    playBlob(cached, runId, normalizedText);
    return;
   }

   const controller = new AbortController();
   abortControllerRef.current = controller;

   try {
    const response = await fetch("/api/tts", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
      text: normalizedText,
      voice: selectedVoiceName,
      rate,
     }),
     signal: controller.signal,
    });
    if (!response.ok) throw new Error(`TTS API ${response.status}`);

    const blob = await response.blob();
    if (playbackRunRef.current !== runId) return;
    void setCachedAudio(cacheKey, blob);
    playBlob(blob, runId, normalizedText);
   } catch (error) {
    if (controller.signal.aborted || playbackRunRef.current !== runId) return;
    setSpeakingText(null);
    setState({
     isSpeaking: false,
     isLoading: false,
     error: error instanceof Error ? error.message : "Microsoft Edge Read Aloud không khả dụng.",
    });
   } finally {
    if (abortControllerRef.current === controller) abortControllerRef.current = null;
   }
  },
  [cleanupAudio, playBlob, rate, selectedVoiceName],
 );

 const selectedVoice =
  voices.find((voice) => voice.shortName === selectedVoiceName) ?? voices[0] ?? null;
 const speakSequence = useCallback(
  (segments: string[]) =>
   speak(
    segments
     .map((segment) => segment.trim())
     .filter(Boolean)
     .join("\n"),
   ),
  [speak],
 );

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
  isLoading: state.isLoading,
  error: state.error,
 };
}
