"use client";

import { useCallback, useEffect, useRef } from "react";
import { DEFAULT_MANDARIN_VOICE } from "@/hooks/useTTS";
import { buildCacheKey, getCachedAudio, setCachedAudio } from "@/lib/audio/tts-cache";

export type FastSpeechOptions = {
 rate?: number;
 voice?: string;
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

export async function fetchMandarinAudioBlob(
 text: string,
 voice = DEFAULT_MANDARIN_VOICE,
 rate = 1.1,
 abortSignal?: AbortSignal,
): Promise<Blob | null> {
 const trimmed = text.trim();
 if (!trimmed) return null;

 const cacheKey = buildCacheKey(trimmed, voice, rate);
 const cached = await getCachedAudio(cacheKey);
 if (cached) {
  return cached;
 }

 if (typeof fetch === "undefined") {
  return null;
 }

 try {
  const response = await fetch("/api/tts", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ text: trimmed, voice, rate }),
   signal: abortSignal,
  });

  if (!response.ok) {
   return null;
  }

  const blob = await response.blob();
  void setCachedAudio(cacheKey, blob);
  return blob;
 } catch {
  return null;
 }
}

export function prefetchMandarinAudio(
 texts: readonly (string | undefined | null)[],
 voice = DEFAULT_MANDARIN_VOICE,
 rate = 1.1,
): void {
 if (typeof window === "undefined") return;

 for (const text of texts) {
  if (!text) continue;
  const trimmed = text.trim();
  if (!trimmed) continue;
  const cacheKey = buildCacheKey(trimmed, voice, rate);
  void getCachedAudio(cacheKey).then((cached) => {
   if (cached) return;
   void fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: trimmed, voice, rate }),
   })
    .then((res) => {
     if (res.ok) {
      void res.blob().then((blob) => setCachedAudio(cacheKey, blob));
     }
    })
    .catch(() => {
     // Ignore prefetch error
    });
  });
 }
}

export function useFastMandarinSpeech() {
 const isSpeakingRef = useRef(false);
 const currentAudioRef = useRef<HTMLAudioElement | null>(null);
 const currentObjectUrlRef = useRef<string | null>(null);
 const abortControllerRef = useRef<AbortController | null>(null);
 const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const runIdRef = useRef(0);
 const cachedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

 const cleanupAudio = useCallback(() => {
  if (timeoutRef.current !== null) {
   clearTimeout(timeoutRef.current);
   timeoutRef.current = null;
  }
  if (abortControllerRef.current !== null) {
   abortControllerRef.current.abort();
   abortControllerRef.current = null;
  }
  if (currentAudioRef.current !== null) {
   const audio = currentAudioRef.current;
   audio.onended = null;
   audio.onerror = null;
   audio.pause();
   audio.removeAttribute("src");
   currentAudioRef.current = null;
  }
  if (currentObjectUrlRef.current !== null) {
   URL.revokeObjectURL(currentObjectUrlRef.current);
   currentObjectUrlRef.current = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
   try {
    window.speechSynthesis.cancel();
   } catch {
    // Ignore cancel error
   }
  }
  isSpeakingRef.current = false;
 }, []);

 const stop = useCallback(() => {
  runIdRef.current += 1;
  cleanupAudio();
 }, [cleanupAudio]);

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

 const speak = useCallback(
  (input: string | readonly string[], options?: FastSpeechOptions) => {
   const segments = (Array.isArray(input) ? input : [input]).map((s) => s.trim()).filter(Boolean);

   if (segments.length === 0) return;

   stop();
   const runId = runIdRef.current;
   isSpeakingRef.current = true;

   const voice = options?.voice ?? DEFAULT_MANDARIN_VOICE;
   const rate = options?.rate ?? 1.1;

   const playNative = (text: string, onEnd: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
     onEnd();
     return;
    }
    try {
     const synth = window.speechSynthesis;
     synth.cancel();
     const utterance = new SpeechSynthesisUtterance(text);
     let nativeVoice = cachedVoiceRef.current;
     if (!nativeVoice) {
      nativeVoice = selectBestMandarinVoice(synth.getVoices());
      cachedVoiceRef.current = nativeVoice;
     }
     if (nativeVoice) {
      utterance.voice = nativeVoice;
      utterance.lang = nativeVoice.lang;
     } else {
      utterance.lang = "zh-CN";
     }
     utterance.rate = rate;
     utterance.onend = () => onEnd();
     utterance.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") return;
      onEnd();
     };
     synth.speak(utterance);
    } catch {
     onEnd();
    }
   };

   const playSegment = (index: number) => {
    if (runId !== runIdRef.current) return;
    if (index >= segments.length) {
     isSpeakingRef.current = false;
     options?.onFinish?.();
     return;
    }

    const currentText = segments[index];
    if (!currentText) {
     playSegment(index + 1);
     return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    void fetchMandarinAudioBlob(currentText, voice, rate, controller.signal)
     .then((blob) => {
      if (runId !== runIdRef.current) return;
      if (blob && typeof Audio !== "undefined") {
       const url = URL.createObjectURL(blob);
       currentObjectUrlRef.current = url;
       const audio = new Audio(url);
       currentAudioRef.current = audio;

       const proceedNext = () => {
        if (runId !== runIdRef.current) return;
        if (currentObjectUrlRef.current) {
         URL.revokeObjectURL(currentObjectUrlRef.current);
         currentObjectUrlRef.current = null;
        }
        currentAudioRef.current = null;

        if (index + 1 < segments.length) {
         timeoutRef.current = setTimeout(() => {
          playSegment(index + 1);
         }, 350);
        } else {
         playSegment(index + 1);
        }
       };

       audio.onended = proceedNext;
       audio.onerror = () => {
        playNative(currentText, proceedNext);
       };

       audio.play().catch(() => {
        playNative(currentText, proceedNext);
       });
      } else {
       playNative(currentText, () => {
        if (runId !== runIdRef.current) return;
        if (index + 1 < segments.length) {
         timeoutRef.current = setTimeout(() => {
          playSegment(index + 1);
         }, 350);
        } else {
         playSegment(index + 1);
        }
       });
      }
     })
     .catch(() => {
      if (runId !== runIdRef.current) return;
      playNative(currentText, () => playSegment(index + 1));
     });
   };

   playSegment(0);
  },
  [stop],
 );

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
