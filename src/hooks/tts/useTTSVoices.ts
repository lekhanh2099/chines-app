"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { JsonFieldValue } from "@/types/json";
import {
 DEFAULT_MANDARIN_VOICE,
 MANDARIN_VOICE_STORAGE_KEY,
 TTS_AUTH_ERROR_MESSAGE,
 TTSVoiceListSchema,
} from "./tts-contract";
import type { TTSState, TTSVoice } from "./tts-contract";

/** Restores a saved zh-CN voice preference after mount, unless a voice is already selected. */
function useStoredVoicePreference(setSelectedVoiceName: Dispatch<SetStateAction<string>>) {
 useEffect(() => {
  if (typeof window === "undefined") return;
  try {
   const saved = window.localStorage.getItem(MANDARIN_VOICE_STORAGE_KEY);
   if (saved && typeof saved === "string" && saved.startsWith("zh-CN-")) {
    setSelectedVoiceName((current) => current || saved);
   }
  } catch {
   // Ignore storage errors in restricted contexts
  }
 }, [setSelectedVoiceName]);
}

/** Mandarin voice list (fetched once, de-duplicated) and the persisted voice preference. */
export function useTTSVoices(setState: Dispatch<SetStateAction<TTSState>>) {
 const [voices, setVoices] = useState<TTSVoice[]>([]);
 const [selectedVoiceName, setSelectedVoiceName] = useState("");
 const voiceLoadControllerRef = useRef<AbortController>(null);
 const voiceLoadPromiseRef = useRef<Promise<TTSVoice[]> | null>(null);
 const voiceLoadErrorRef = useRef<Error>(null);

 useStoredVoicePreference(setSelectedVoiceName);

 const loadVoices = useCallback((): Promise<TTSVoice[]> => {
  if (voices.length > 0) return Promise.resolve(voices);
  const pending = voiceLoadPromiseRef.current;
  if (pending !== null) return pending;

  const controller = new AbortController();
  voiceLoadControllerRef.current = controller;
  voiceLoadErrorRef.current = null;
  const promise = (async () => {
   try {
    const response = await fetch("/api/tts", { signal: controller.signal });
    if (response.status === 401) throw new Error(TTS_AUTH_ERROR_MESSAGE);
    if (!response.ok) throw new Error(`TTS voices API ${response.status}`);

    const voicePayload: JsonFieldValue = await response.json();
    const nextVoices = TTSVoiceListSchema.parse(voicePayload);
    setVoices(nextVoices);
    setSelectedVoiceName((current) => {
     let preferred = current;
     if (!preferred && typeof window !== "undefined") {
      try {
       const saved = window.localStorage.getItem(MANDARIN_VOICE_STORAGE_KEY);
       if (saved && typeof saved === "string") preferred = saved;
      } catch {
       // Ignore storage error
      }
     }
     return nextVoices.some((voice) => voice.shortName === preferred)
      ? preferred
      : (nextVoices[0]?.shortName ?? DEFAULT_MANDARIN_VOICE);
    });
    setState((current) => ({ ...current, error: null }));
    return nextVoices;
   } catch (error) {
    if (controller.signal.aborted) return [];
    const failure =
     error instanceof Error ? error : new Error("Không tải được giọng Mandarin zh-CN");
    voiceLoadErrorRef.current = failure;
    setState((current) => ({
     ...current,
     error: failure.message,
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
 }, [setState, voices]);

 const handleSetSelectedVoiceName = useCallback(
  (nextVoice: string | ((current: string) => string)) => {
   setSelectedVoiceName((current) => {
    const resolved = typeof nextVoice === "function" ? nextVoice(current) : nextVoice;
    if (typeof window !== "undefined" && resolved) {
     try {
      window.localStorage.setItem(MANDARIN_VOICE_STORAGE_KEY, resolved);
     } catch {
      // Ignore storage errors
     }
    }
    return resolved;
   });
  },
  [],
 );

 const abortVoiceLoad = useCallback(() => {
  voiceLoadControllerRef.current?.abort();
 }, []);

 const selectedVoice =
  voices.find((voice) => voice.shortName === selectedVoiceName) ?? voices[0] ?? null;

 return {
  voices,
  selectedVoice,
  selectedVoiceName,
  setSelectedVoiceName: handleSetSelectedVoiceName,
  loadVoices,
  abortVoiceLoad,
  voiceLoadErrorRef,
 };
}
