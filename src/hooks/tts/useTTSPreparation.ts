"use client";

import { useCallback, useRef } from "react";

import { buildCacheKey } from "@/lib/audio/tts-cache";
import { loadTTSAudio } from "./tts-audio-request";
import type { TTSPreparedAudio } from "./tts-contract";
import { splitSpeechSegments } from "./tts-text";
import type { useTTSVoices } from "./useTTSVoices";

type TTSVoices = ReturnType<typeof useTTSVoices>;

/** Prefetches one segment's audio so the next playback with the same key can reuse it. */
export function useTTSPreparation({
 loadVoices,
 selectedVoiceName,
 voiceLoadErrorRef,
}: {
 loadVoices: TTSVoices["loadVoices"];
 selectedVoiceName: TTSVoices["selectedVoiceName"];
 voiceLoadErrorRef: TTSVoices["voiceLoadErrorRef"];
}) {
 const preparedAudioRef = useRef<TTSPreparedAudio>(null);
 const preparationRunRef = useRef(0);

 const cancelPreparation = useCallback(() => {
  preparationRunRef.current += 1;
  preparedAudioRef.current?.controller.abort();
  preparedAudioRef.current = null;
 }, []);

 const prepareAudio = useCallback(
  async (text: string, synthesisRate: number): Promise<void> => {
   const normalizedText = splitSpeechSegments([text])[0];
   if (!normalizedText) return;
   const runId = preparationRunRef.current;
   const availableVoices = await loadVoices();
   if (runId !== preparationRunRef.current) return;
   const voiceName = selectedVoiceName || availableVoices[0]?.shortName;
   if (!voiceName)
    throw voiceLoadErrorRef.current ?? new Error("Không tải được giọng Mandarin zh-CN");
   const key = buildCacheKey(normalizedText, voiceName, synthesisRate);
   let preparation = preparedAudioRef.current;
   if (preparation?.key !== key) {
    preparation?.controller.abort();
    const controller = new AbortController();
    preparation = {
     key,
     controller,
     promise: loadTTSAudio(normalizedText, voiceName, synthesisRate, controller),
    };
    preparedAudioRef.current = preparation;
   }
   await preparation.promise;
  },
  [loadVoices, selectedVoiceName, voiceLoadErrorRef],
 );

 return { preparedAudioRef, cancelPreparation, prepareAudio };
}
