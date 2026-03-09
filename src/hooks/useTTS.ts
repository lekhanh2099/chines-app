"use client";

import { useCallback, useRef, useState } from "react";
import { buildCacheKey, getCachedAudio, setCachedAudio } from "@/lib/tts-cache";

export type TTSOptions = {
 voice?: string;
 rate?: number;
};

type TTSState = {
 isSpeaking: boolean;
 isLoading: boolean;
 error: string | null;
};

/**
 * Custom hook for TTS via ElevenLabs with browser SpeechSynthesis fallback.
 *
 * - Calls `/api/tts` server route (keeps API key server-side).
 * - Caches audio in IndexedDB to avoid repeat API calls.
 * - Falls back to browser SpeechSynthesis on error.
 */
export function useTTS() {
 const [state, setState] = useState<TTSState>({
  isSpeaking: false,
  isLoading: false,
  error: null,
 });
 const audioRef = useRef<HTMLAudioElement | null>(null);
 const objectUrlRef = useRef<string | null>(null);

 const cleanup = useCallback(() => {
  if (audioRef.current) {
   audioRef.current.pause();
   audioRef.current.removeAttribute("src");
   audioRef.current = null;
  }
  if (objectUrlRef.current) {
   URL.revokeObjectURL(objectUrlRef.current);
   objectUrlRef.current = null;
  }
 }, []);

 const fallbackSpeak = useCallback((text: string, rate: number) => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = rate;
  utterance.onend = () =>
   setState({ isSpeaking: false, isLoading: false, error: null });
  utterance.onerror = () =>
   setState({ isSpeaking: false, isLoading: false, error: null });
  window.speechSynthesis.speak(utterance);
  setState((prev) => ({ ...prev, isSpeaking: true, isLoading: false }));
 }, []);

 const speak = useCallback(
  async (text: string, options: TTSOptions = {}) => {
   if (!text.trim()) return;

   cleanup();
   window.speechSynthesis.cancel();
   setState({ isSpeaking: false, isLoading: true, error: null });

   const rate = options.rate ?? 1;
   const cacheKey = buildCacheKey(text, options.voice);

   // Try cache first
   const cached = await getCachedAudio(cacheKey);
   if (cached) {
    return playBlob(cached, () =>
     setState({ isSpeaking: false, isLoading: false, error: null }),
    );
   }

   try {
    const body = JSON.stringify({
     text: text.trim(),
     ...(options.voice ? { voice: options.voice } : {}),
    });

    const response = await fetch("/api/tts", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body,
    });

    if (!response.ok) {
     throw new Error(`TTS API ${response.status}`);
    }

    const blob = await response.blob();
    void setCachedAudio(cacheKey, blob);
    return playBlob(blob, () =>
     setState({ isSpeaking: false, isLoading: false, error: null }),
    );
   } catch {
    setState((prev) => ({
     ...prev,
     error: "ElevenLabs không khả dụng, dùng giọng trình duyệt.",
    }));
    fallbackSpeak(text, rate);
   }
  },
  [cleanup, fallbackSpeak],
 );

 const stop = useCallback(() => {
  cleanup();
  window.speechSynthesis.cancel();
  setState({ isSpeaking: false, isLoading: false, error: null });
 }, [cleanup]);

 function playBlob(blob: Blob, onEnd: () => void) {
  const url = URL.createObjectURL(blob);
  objectUrlRef.current = url;
  const audio = new Audio(url);
  audioRef.current = audio;
  audio.onended = onEnd;
  audio.onerror = onEnd;
  setState({ isSpeaking: true, isLoading: false, error: null });
  void audio.play();
 }

 return {
  speak,
  stop,
  isSpeaking: state.isSpeaking,
  isLoading: state.isLoading,
  error: state.error,
 };
}
