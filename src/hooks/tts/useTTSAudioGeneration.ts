"use client";

import { useCallback, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

import { buildCacheKey, getCachedAudio, setCachedAudio } from "@/lib/audio/tts-cache";
import { DEFAULT_MANDARIN_VOICE, TTS_AUTH_ERROR_MESSAGE } from "./tts-contract";
import type { TTSState } from "./tts-contract";
import type { useTTSVoices } from "./useTTSVoices";

type TTSVoices = ReturnType<typeof useTTSVoices>;

/** Synthesizes (or reads cached) audio for download/offline use without playing it. */
export function useTTSAudioGeneration({
 loadVoices,
 selectedVoiceName,
 rate,
 setState,
}: {
 loadVoices: TTSVoices["loadVoices"];
 selectedVoiceName: TTSVoices["selectedVoiceName"];
 rate: number;
 setState: Dispatch<SetStateAction<TTSState>>;
}) {
 const generationAbortControllerRef = useRef<AbortController>(null);

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
   const voiceName = selectedVoiceName || availableVoices[0]?.shortName || DEFAULT_MANDARIN_VOICE;

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
    if (response.status === 401) throw new Error(TTS_AUTH_ERROR_MESSAGE);
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
  [loadVoices, rate, selectedVoiceName, setState],
 );

 return { generateAudio, generationAbortControllerRef };
}
