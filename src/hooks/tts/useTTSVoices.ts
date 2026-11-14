"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { JsonFieldValue } from "@/types/json";
import {
 DEFAULT_MANDARIN_VOICE,
 MANDARIN_VOICE_STORAGE_KEY,
 TTS_AUTH_ERROR_MESSAGE,
 TTSVoiceListSchema,
} from "./tts-contract";
import type { TTSState, TTSVoice } from "./tts-contract";

function readStoredVoiceName() {
 try {
  return window.localStorage.getItem(MANDARIN_VOICE_STORAGE_KEY) ?? "";
 } catch {
  // Ignore storage errors in restricted contexts
  return "";
 }
}

function subscribeStoredVoice(onChange: () => void) {
 window.addEventListener("storage", onChange);
 return () => window.removeEventListener("storage", onChange);
}

/** Saved zh-CN voice preference; empty during server render and hydration. */
function getStoredMandarinVoiceSnapshot() {
 const saved = readStoredVoiceName();
 return saved.startsWith("zh-CN-") ? saved : "";
}

function getServerStoredVoiceSnapshot() {
 return "";
}

/** Mandarin voice list (fetched once, de-duplicated) and the persisted voice preference. */
export function useTTSVoices(setState: Dispatch<SetStateAction<TTSState>>) {
 const [voices, setVoices] = useState<TTSVoice[]>([]);
 // An explicit or resolved choice wins over the saved preference.
 const [chosenVoiceName, setChosenVoiceName] = useState("");
 const storedVoiceName = useSyncExternalStore(
  subscribeStoredVoice,
  getStoredMandarinVoiceSnapshot,
  getServerStoredVoiceSnapshot,
 );
 const selectedVoiceName = chosenVoiceName || storedVoiceName;
 const voiceLoadControllerRef = useRef<AbortController>(null);
 const voiceLoadPromiseRef = useRef<Promise<TTSVoice[]> | null>(null);
 const voiceLoadErrorRef = useRef<Error>(null);

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
    setChosenVoiceName((current) => {
     const preferred = current || readStoredVoiceName();
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
   setChosenVoiceName((chosen) => {
    const current = chosen || getStoredMandarinVoiceSnapshot();
    const resolved = typeof nextVoice === "function" ? nextVoice(current) : nextVoice;
    if (resolved) {
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
