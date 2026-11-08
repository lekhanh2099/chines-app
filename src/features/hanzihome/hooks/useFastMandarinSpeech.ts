"use client";

import { useCallback, useEffect, useRef } from "react";
import { DEFAULT_MANDARIN_VOICE } from "@/hooks/useTTS";
import { buildCacheKey, getCachedAudio, setCachedAudio } from "@/lib/audio/tts-cache";

export const DEFAULT_VIETNAMESE_VOICE = "vi-VN-HoaiMyNeural";

const SUPPORTED_TTS_RATES: readonly number[] = [0.75, 0.8, 0.9, 1, 1.1, 1.15, 1.2, 1.25];

export function normalizeSpeechRate(rate: number): number {
 if (!Number.isFinite(rate)) return 1;
 let bestRate = 1;
 let smallestDiff = Number.POSITIVE_INFINITY;
 for (const candidate of SUPPORTED_TTS_RATES) {
  const diff = Math.abs(candidate - rate);
  if (diff < smallestDiff) {
   smallestDiff = diff;
   bestRate = candidate;
  }
 }
 return bestRate;
}

export function cleanVietnameseSpeechText(text: string): string {
 return text
  .replace(/(?:^|(?<=[\s(,;]))VD\s*:/giu, "Ví dụ:")
  .replace(/(?:^|(?<=[\s(,;]))đt\.?(?=\s|$|[),;])/giu, "động từ")
  .replace(/(?:^|(?<=[\s(,;]))dt\.?(?=\s|$|[),;])/giu, "danh từ")
  .replace(/(?:^|(?<=[\s(,;]))tt\.?(?=\s|$|[),;])/giu, "tính từ")
  .replace(/(?:^|(?<=[\s(,;]))pt\.?(?=\s|$|[),;])/giu, "phó từ")
  .replace(/(?:^|(?<=[\s(,;]))lt\.?(?=\s|$|[),;])/giu, "lượng từ")
  .replace(/[\u4e00-\u9fff]+/gu, " ")
  .replace(/[，。！？；：、“”‘’（）【】《》〈〉]/gu, " ")
  .replace(/[_＿]{2,}/gu, ", ")
  .replace(/(?:…+|\.{2,})/gu, ", ")
  .replace(/\s*(?:\/|→|➔|=>|;)\s*/gu, ", ")
  .replace(/\(\s*[,;.]*\s*\)/gu, "")
  .replace(/\[\s*[,;.]*\s*\]/gu, "")
  .replace(/\s+,/gu, ",")
  .replace(/(?:,\s*){2,}/gu, ", ")
  .replace(/^\s*[,;.]+\s*|\s*[,;]+\s*$/gu, "")
  .replace(/\s+/gu, " ")
  .trim();
}

export function cleanMandarinSpeechText(text: string): string {
 const withoutNumbering = text
  .replace(/^\s*(?:\([0-9一二三四五六七八九十]+\)|[①②③④⑤⑥⑦⑧⑨⑩]|\d+[.、)）])\s*/u, "")
  .replace(/[_＿]{2,}/gu, "，")
  .replace(/…+/gu, "，")
  .replace(/\([^()\u4e00-\u9fff]*[A-Za-zÀ-ỹ][^()\u4e00-\u9fff]*\)/gu, "")
  .replace(/（[^（）\u4e00-\u9fff]*[A-Za-zÀ-ỹ][^（）\u4e00-\u9fff]*）/gu, "")
  .replace(/\[[^[\]\u4e00-\u9fff]*[A-Za-zÀ-ỹ][^[\]\u4e00-\u9fff]*\]/gu, "")
  .trim();

 if (/[\u4e00-\u9fff]/u.test(withoutNumbering) && /[À-ỹ]/u.test(withoutNumbering)) {
  const chineseChunks = (
   withoutNumbering.match(/[\p{Script=Han}\p{Number}%％，。！？；：、“”‘’《》]+/gu) ?? []
  )
   .map((segment) => segment.trim())
   .filter((segment) => /[\u4e00-\u9fff]/u.test(segment));
  if (chineseChunks.length > 0) {
   return chineseChunks.join("，");
  }
 }

 return withoutNumbering
  .replace(/(?:，\s*){2,}/gu, "，")
  .replace(/^\s*，+\s*|\s*，+\s*$/gu, "")
  .replace(/\s+/gu, " ")
  .trim();
}

export function sanitizeSpeechTextForVoice(text: string, voice: string): string {
 const isVietnameseVoice = voice.trim().toLowerCase().startsWith("vi");
 return isVietnameseVoice ? cleanVietnameseSpeechText(text) : cleanMandarinSpeechText(text);
}

const inFlightAudioRequests = new Map<string, Promise<Blob | null>>();

export type FastSpeechOptions = {
 rate?: number;
 voice?: string;
 lang?: "zh-CN" | "vi-VN";
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

export function selectBestVietnameseVoice(
 voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
 for (const voice of voices) {
  const lang = voice.lang.toLowerCase().replace(/_/g, "-");
  if (lang === "vi-vn" || lang.startsWith("vi")) {
   return voice;
  }
 }
 return null;
}

export async function fetchMandarinAudioBlob(
 text: string,
 voice = DEFAULT_MANDARIN_VOICE,
 rate = 1.1,
 abortSignal?: AbortSignal,
): Promise<Blob | null> {
 const sanitized = sanitizeSpeechTextForVoice(text, voice);
 if (!sanitized) return null;
 if (abortSignal?.aborted) return null;

 const normalizedRate = normalizeSpeechRate(rate);
 const cacheKey = buildCacheKey(sanitized, voice, normalizedRate);
 const cached = await getCachedAudio(cacheKey);
 if (cached) {
  return cached;
 }

 if (typeof fetch === "undefined") {
  return null;
 }

 let requestPromise = inFlightAudioRequests.get(cacheKey);
 if (!requestPromise) {
  requestPromise = (async () => {
   try {
    const response = await fetch("/api/tts", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ text: sanitized, voice, rate: normalizedRate }),
    });

    if (!response.ok) {
     return null;
    }

    const blob = await response.blob();
    void setCachedAudio(cacheKey, blob);
    return blob;
   } catch {
    return null;
   } finally {
    inFlightAudioRequests.delete(cacheKey);
   }
  })();
  inFlightAudioRequests.set(cacheKey, requestPromise);
 }

 if (!abortSignal) {
  return requestPromise;
 }

 return new Promise<Blob | null>((resolve) => {
  const onAbort = () => resolve(null);
  abortSignal.addEventListener("abort", onAbort, { once: true });
  void requestPromise.then((blob) => {
   abortSignal.removeEventListener("abort", onAbort);
   resolve(abortSignal.aborted ? null : blob);
  });
 });
}

export function prefetchMandarinAudio(
 texts: readonly (string | undefined | null)[],
 voice = DEFAULT_MANDARIN_VOICE,
 rate = 1.1,
): void {
 if (typeof window === "undefined") return;

 for (const text of texts) {
  if (!text) continue;
  void fetchMandarinAudioBlob(text, voice, rate);
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
   const rawSegments = (Array.isArray(input) ? input : [input])
    .map((s) => s.trim())
    .filter(Boolean);

   if (rawSegments.length === 0) return;

   stop();
   const runId = runIdRef.current;
   isSpeakingRef.current = true;

   const explicitVietnamese =
    options?.lang === "vi-VN" || options?.voice?.startsWith("vi-") === true;
   const explicitMandarin = options?.lang === "zh-CN" || options?.voice?.startsWith("zh-") === true;
   const rate = normalizeSpeechRate(options?.rate ?? 1.1);

   const resolvedSegments = rawSegments
    .map((segment) => {
     const isSegmentVietnamese =
      explicitVietnamese ||
      (!explicitMandarin && !/[\u4e00-\u9fff]/u.test(segment) && /[A-Za-zÀ-ỹ]/u.test(segment));
     const segmentVoice =
      options?.voice ?? (isSegmentVietnamese ? DEFAULT_VIETNAMESE_VOICE : DEFAULT_MANDARIN_VOICE);
     const cleanedText = sanitizeSpeechTextForVoice(segment, segmentVoice);
     return {
      text: cleanedText,
      voice: segmentVoice,
      isVietnamese: isSegmentVietnamese,
     };
    })
    .filter((item) => item.text.length > 0);

   if (resolvedSegments.length === 0) {
    isSpeakingRef.current = false;
    options?.onFinish?.();
    return;
   }

   const playNative = (text: string, isVietnamese: boolean, onEnd: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
     onEnd();
     return;
    }
    try {
     const synth = window.speechSynthesis;
     synth.cancel();
     const utterance = new SpeechSynthesisUtterance(text);
     if (isVietnamese) {
      const viVoice = selectBestVietnameseVoice(synth.getVoices());
      if (!viVoice) {
       // Never let an English/Chinese system voice read Vietnamese text as gibberish
       onEnd();
       return;
      }
      utterance.voice = viVoice;
      utterance.lang = viVoice.lang;
     } else {
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
    if (index >= resolvedSegments.length) {
     isSpeakingRef.current = false;
     options?.onFinish?.();
     return;
    }

    const currentSegment = resolvedSegments[index];
    if (!currentSegment || !currentSegment.text) {
     playSegment(index + 1);
     return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    void fetchMandarinAudioBlob(currentSegment.text, currentSegment.voice, rate, controller.signal)
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

        if (index + 1 < resolvedSegments.length) {
         timeoutRef.current = setTimeout(() => {
          playSegment(index + 1);
         }, 350);
        } else {
         playSegment(index + 1);
        }
       };

       audio.onended = proceedNext;
       audio.onerror = () => {
        playNative(currentSegment.text, currentSegment.isVietnamese, proceedNext);
       };

       audio.play().catch(() => {
        playNative(currentSegment.text, currentSegment.isVietnamese, proceedNext);
       });
      } else {
       playNative(currentSegment.text, currentSegment.isVietnamese, () => {
        if (runId !== runIdRef.current) return;
        if (index + 1 < resolvedSegments.length) {
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
      playNative(currentSegment.text, currentSegment.isVietnamese, () => playSegment(index + 1));
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
