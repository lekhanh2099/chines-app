"use client";

import { useCallback, useEffect, useRef } from "react";

export type FastSpeechOptions = {
 rate?: number;
 onFinish?: () => void;
};

const DISQUALIFIED_VOICE_SUBSTRINGS: readonly string[] = [
 // Apple / system cartoon / novelty / child voices that should never be used for learning
 "eddy",
 "flo",
 "grandma",
 "grandpa",
 "reed",
 "rocko",
 "sandy",
 "shelley",
 "junior",
 "bad news",
 "bahh",
 "bells",
 "boing",
 "bubbles",
 "cellos",
 "deranged",
 "good news",
 "hysterical",
 "organ",
 "princess",
 "ralph",
 "whisper",
 "zarvox",
 "albert",
 // Non-Mandarin Chinese dialects (Cantonese, Min Nan, etc.)
 "zh-hk",
 "zh_hk",
 "zh-mo",
 "zh_mo",
 "yue",
 "cantonese",
 "sinji",
 "sin-ji",
 "粤语",
 "香港",
 "澳門",
 "澳门",
];

export function scoreMandarinVoice(voice: SpeechSynthesisVoice): number {
 const name = voice.name.toLowerCase();
 const lang = voice.lang.toLowerCase().replace(/_/g, "-");

 for (const substring of DISQUALIFIED_VOICE_SUBSTRINGS) {
  if (name.includes(substring) || lang.includes(substring)) {
   return -1000;
  }
 }

 const isMandarinLang =
  lang === "zh-cn" ||
  lang === "zh-sg" ||
  lang === "cmn" ||
  lang.startsWith("cmn-hans") ||
  lang === "zh-cmn";

 const isTaiwanLang = lang === "zh-tw" || lang.startsWith("cmn-hant");
 const isChineseLang = lang.startsWith("zh") || isMandarinLang || isTaiwanLang;

 const containsChineseKeywords =
  name.includes("chinese") ||
  name.includes("mandarin") ||
  name.includes("putonghua") ||
  name.includes("普通话") ||
  name.includes("國語") ||
  name.includes("国语");

 if (!isChineseLang && !containsChineseKeywords) {
  return -500;
 }

 let score = 0;

 // 1. Google Web Speech Neural / high quality voices
 if (name.includes("google") && (isMandarinLang || name.includes("普通话"))) {
  score += 150;
 }

 // 2. Apple macOS premier standard adult Mandarin voice
 if (name.includes("tingting")) {
  score += 140;
 }

 // 3. Apple Siri Mandarin voices
 if (name.includes("li-mu") || name.includes("yu-shu")) {
  score += 130;
 }

 // 4. Microsoft Natural / Online voices
 if ((name.includes("xiaoxiao") || name.includes("yunxi")) && isMandarinLang) {
  score += 135;
 }
 if (name.includes("natural") || name.includes("online")) {
  score += 30;
 }

 // 5. Microsoft desktop voices
 if (name.includes("yaoyao") || name.includes("huihui") || name.includes("kangkang")) {
  score += 110;
 }

 // 6. Mainland Mandarin locale preferred
 if (isMandarinLang) {
  score += 50;
 } else if (isTaiwanLang) {
  score += 10;
 }

 return score;
}

export function selectBestMandarinVoice(
 voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
 let bestVoice: SpeechSynthesisVoice | null = null;
 let highestScore = 0;

 for (const voice of voices) {
  const currentScore = scoreMandarinVoice(voice);
  if (currentScore > highestScore) {
   highestScore = currentScore;
   bestVoice = voice;
  }
 }

 return bestVoice;
}

export function useFastMandarinSpeech() {
 const isSpeakingRef = useRef(false);
 const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
 const cachedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

 const stop = useCallback(() => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
   try {
    window.speechSynthesis.cancel();
   } catch {
    // Ignore error when cancelling speech
   }
  }
  isSpeakingRef.current = false;
  activeUtteranceRef.current = null;
 }, []);

 const updateCachedVoice = useCallback(() => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
   return;
  }
  try {
   const voices = window.speechSynthesis.getVoices();
   cachedVoiceRef.current = selectBestMandarinVoice(voices);
  } catch {
   // Ignore voice retrieval failure
  }
 }, []);

 const speak = useCallback((text: string, options?: FastSpeechOptions) => {
  const trimmed = text.trim();
  if (!trimmed) return;

  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
   return;
  }

  try {
   const synth = window.speechSynthesis;
   // Cancel any previous speech immediately
   synth.cancel();

   const rate = options?.rate ?? 1.15;
   const utterance = new SpeechSynthesisUtterance(trimmed);

   let voiceToUse = cachedVoiceRef.current;
   if (!voiceToUse) {
    const currentVoices = synth.getVoices();
    voiceToUse = selectBestMandarinVoice(currentVoices);
    cachedVoiceRef.current = voiceToUse;
   }

   if (voiceToUse) {
    utterance.voice = voiceToUse;
    utterance.lang = voiceToUse.lang;
   } else {
    utterance.lang = "zh-CN";
   }

   utterance.rate = rate;

   utterance.onstart = () => {
    isSpeakingRef.current = true;
   };

   utterance.onend = () => {
    isSpeakingRef.current = false;
    activeUtteranceRef.current = null;
    options?.onFinish?.();
   };

   utterance.onerror = (event) => {
    isSpeakingRef.current = false;
    activeUtteranceRef.current = null;
    // Ignore normal cancellation or interruption events
    if (event.error === "canceled" || event.error === "interrupted") {
     return;
    }
   };

   activeUtteranceRef.current = utterance;
   synth.speak(utterance);
  } catch {
   // Graceful silent fallback without affecting external providers
  }
 }, []);

 useEffect(() => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
   return;
  }

  const synth = window.speechSynthesis;
  updateCachedVoice();

  if (typeof synth.addEventListener === "function") {
   synth.addEventListener("voiceschanged", updateCachedVoice);
   return () => {
    synth.removeEventListener("voiceschanged", updateCachedVoice);
    stop();
   };
  }

  synth.onvoiceschanged = updateCachedVoice;
  return () => {
   synth.onvoiceschanged = null;
   stop();
  };
 }, [stop, updateCachedVoice]);

 return { speak, stop };
}
