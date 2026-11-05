"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MANDARIN_VOICE } from "@/hooks/useTTS";
import { buildCacheKey, checkAudioKeysCached } from "@/lib/audio/tts-cache";
import { fetchMandarinAudioBlob } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { dictationSourcesFromTextbook } from "@/features/hanzihome/practice/translation-practice";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

export type LessonAudioPackStatus = "idle" | "checking" | "downloading" | "ready" | "error";

export function extractLessonMandarinTexts(
 lesson: TextbookLesson | null | undefined,
): readonly string[] {
 if (!lesson) return [];

 const textSet = new Set<string>();

 // 1. Vocab items
 if (Array.isArray(lesson.vocab)) {
  for (const v of lesson.vocab) {
   const clean = v.hanzi.trim();
   if (clean) textSet.add(clean);
  }
 }

 // 2. Dictation sentences from textbook sections
 const sources = dictationSourcesFromTextbook(lesson);
 for (const source of sources) {
  for (const entry of source.entries) {
   const clean = entry.zh.trim();
   if (clean) textSet.add(clean);
  }
 }

 return Array.from(textSet);
}

export function useLessonAudioPack(lesson: TextbookLesson | null | undefined) {
 const [status, setStatus] = useState<LessonAudioPackStatus>("checking");
 const [cachedCount, setCachedCount] = useState(0);
 const [totalCount, setTotalCount] = useState(0);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);

 const abortControllerRef = useRef<AbortController | null>(null);
 const texts = useMemo(() => extractLessonMandarinTexts(lesson), [lesson]);

 const checkCacheStatus = useCallback(async () => {
  if (texts.length === 0) {
   setTotalCount(0);
   setCachedCount(0);
   setStatus("idle");
   return;
  }

  setTotalCount(texts.length);
  const keys = texts.map((t) => buildCacheKey(t, DEFAULT_MANDARIN_VOICE, 1.0));
  const cachedKeys = await checkAudioKeysCached(keys);

  setCachedCount(cachedKeys.size);
  setStatus(cachedKeys.size >= texts.length ? "ready" : "idle");
 }, [texts]);

 useEffect(() => {
  let isMounted = true;
  if (texts.length === 0) {
   return;
  }

  const keys = texts.map((t) => buildCacheKey(t, DEFAULT_MANDARIN_VOICE, 1.0));
  void (async () => {
   const cachedKeys = await checkAudioKeysCached(keys);
   if (!isMounted) return;
   setTotalCount(texts.length);
   setCachedCount(cachedKeys.size);
   setStatus(cachedKeys.size >= texts.length ? "ready" : "idle");
  })();

  return () => {
   isMounted = false;
  };
 }, [texts]);

 const downloadLessonAudio = useCallback(async () => {
  if (texts.length === 0) return;

  if (abortControllerRef.current !== null) {
   abortControllerRef.current.abort();
  }
  const controller = new AbortController();
  abortControllerRef.current = controller;

  setStatus("downloading");
  setErrorMessage(null);

  const keys = texts.map((t) => buildCacheKey(t, DEFAULT_MANDARIN_VOICE, 1.0));
  const cachedKeys = await checkAudioKeysCached(keys);
  let currentCached = cachedKeys.size;
  setCachedCount(currentCached);

  const missingTexts = texts.filter(
   (t) => !cachedKeys.has(buildCacheKey(t, DEFAULT_MANDARIN_VOICE, 1.0)),
  );

  // Concurrency pool of 3 to avoid overwhelming server while maintaining high speed
  const concurrency = 3;
  let index = 0;

  async function downloadNext(): Promise<void> {
   while (index < missingTexts.length) {
    if (controller.signal.aborted) return;
    const currentIndex = index;
    index += 1;
    const text = missingTexts[currentIndex];
    if (!text) continue;

    try {
     const blob = await fetchMandarinAudioBlob(
      text,
      DEFAULT_MANDARIN_VOICE,
      1.0,
      controller.signal,
     );
     if (blob) {
      currentCached += 1;
      setCachedCount(currentCached);
     }
    } catch {
     // Ignore individual text download error, continue next
    }
   }
  }

  const workers = Array.from({ length: Math.min(concurrency, missingTexts.length) }, () =>
   downloadNext(),
  );

  await Promise.all(workers);

  if (controller.signal.aborted) {
   setStatus("idle");
   return;
  }

  void checkCacheStatus();
 }, [checkCacheStatus, texts]);

 const cancelDownload = useCallback(() => {
  if (abortControllerRef.current !== null) {
   abortControllerRef.current.abort();
   abortControllerRef.current = null;
  }
  setStatus("idle");
 }, []);

 const progressPercent =
  totalCount > 0 ? Math.min(100, Math.round((cachedCount / totalCount) * 100)) : 0;
 const isFullyCached = totalCount > 0 && cachedCount >= totalCount;

 return {
  status,
  cachedCount,
  totalCount,
  progressPercent,
  isFullyCached,
  isDownloading: status === "downloading",
  errorMessage,
  downloadLessonAudio,
  cancelDownload,
  refreshStatus: checkCacheStatus,
 };
}
