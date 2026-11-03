"use client";

import { useCallback, useRef } from "react";
import { useMandarinTtsControls } from "@/features/speech/MandarinTtsProvider";

export type FastSpeechOptions = {
 rate?: number;
 onFinish?: () => void;
};

export function useFastMandarinSpeech() {
 const fallbackTts = useMandarinTtsControls();
 const isSpeakingNativeRef = useRef(false);

 const speak = useCallback(
  (text: string, options?: FastSpeechOptions) => {
   const trimmed = text.trim();
   if (!trimmed) return;

   const rate = options?.rate ?? 1.15;

   if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
     const synth = window.speechSynthesis;
     synth.cancel();

     const utterance = new SpeechSynthesisUtterance(trimmed);
     utterance.lang = "zh-CN";
     utterance.rate = rate;

     const voices = synth.getVoices();
     const zhVoice = voices.find((v) => {
      const lower = v.lang.toLowerCase();
      return lower === "zh-cn" || lower === "zh-sg" || lower.startsWith("zh");
     });
     if (zhVoice) {
      utterance.voice = zhVoice;
     }

     utterance.onstart = () => {
      isSpeakingNativeRef.current = true;
     };
     utterance.onend = () => {
      isSpeakingNativeRef.current = false;
      options?.onFinish?.();
     };
     utterance.onerror = () => {
      isSpeakingNativeRef.current = false;
      fallbackTts.speakSequence([trimmed], options?.onFinish);
     };

     synth.speak(utterance);
     return;
    } catch {
     // Fallback to cloud TTS if Web Speech API fails
    }
   }

   fallbackTts.speakSequence([trimmed], options?.onFinish);
  },
  [fallbackTts],
 );

 const stop = useCallback(() => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
   try {
    window.speechSynthesis.cancel();
   } catch {
    // Ignore error when cancelling native speech
   }
  }
  fallbackTts.stop();
  isSpeakingNativeRef.current = false;
 }, [fallbackTts]);

 return { speak, stop };
}
