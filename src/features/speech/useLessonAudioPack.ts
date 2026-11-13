"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MANDARIN_VOICE } from "@/hooks/useTTS";
import { buildCacheKey, checkAudioKeysCached } from "@/lib/audio/tts-cache";
import {
 fetchMandarinAudioBlob,
 normalizeSpeechRate,
 sanitizeSpeechTextForVoice,
} from "@/features/hanzihome/hooks/useFastMandarinSpeech";
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

const LESSON_AUDIO_PACK_RATE = 1.0;

type LessonAudioPackEntry = { text: string; cacheKey: string };

/**
 * Mirrors fetchMandarinAudioBlob: audio is cached under the sanitized text and
 * normalized rate, so cache lookups must use the same key. Texts that sanitize
 * to nothing are never synthesized and do not count toward the pack.
 */
export function lessonAudioPackEntries(
 texts: readonly string[],
 voice: string,
): LessonAudioPackEntry[] {
 const rate = normalizeSpeechRate(LESSON_AUDIO_PACK_RATE);
 const seenKeys = new Set<string>();
 return texts.flatMap((text) => {
  const sanitized = sanitizeSpeechTextForVoice(text, voice);
  if (!sanitized) return [];
  const cacheKey = buildCacheKey(sanitized, voice, rate);
  if (seenKeys.has(cacheKey)) return [];
  seenKeys.add(cacheKey);
  return [{ text, cacheKey }];
 });
}

const NO_ENTRIES: LessonAudioPackEntry[] = [];

type CacheCheck = { entries: LessonAudioPackEntry[]; cachedCount: number };
type ActivityState = { entries: LessonAudioPackEntry[]; status: LessonAudioPackStatus };

export function useLessonAudioPack(
 lesson: TextbookLesson | null | undefined,
 voiceName: string = DEFAULT_MANDARIN_VOICE,
) {
 // Download lifecycle only; checking/ready are derived from the cache check.
 // It is tied to the entries it describes, so another lesson starts idle.
 const [activityState, setActivityState] = useState<ActivityState>({
  entries: NO_ENTRIES,
  status: "idle",
 });
 const [check, setCheck] = useState<CacheCheck>({ entries: NO_ENTRIES, cachedCount: 0 });
 const [errorMessage, setErrorMessage] = useState<string | null>(null);

 const abortControllerRef = useRef<AbortController | null>(null);
 const texts = useMemo(() => extractLessonMandarinTexts(lesson), [lesson]);
 const targetVoice = voiceName || DEFAULT_MANDARIN_VOICE;
 const entries = useMemo(() => lessonAudioPackEntries(texts, targetVoice), [targetVoice, texts]);

 const activity = activityState.entries === entries ? activityState.status : "idle";
 const visibleErrorMessage = activity === "error" ? errorMessage : null;
 const totalCount = entries.length;
 const isChecked = check.entries === entries;
 const cachedCount = isChecked ? check.cachedCount : 0;
 const isFullyCached = totalCount > 0 && cachedCount >= totalCount;
 const status: LessonAudioPackStatus =
  totalCount === 0
   ? "idle"
   : activity !== "idle"
     ? activity
     : !isChecked
       ? "checking"
       : isFullyCached
         ? "ready"
         : "idle";

 const checkCacheStatus = useCallback(async () => {
  if (entries.length === 0) return 0;
  const cachedKeys = await checkAudioKeysCached(entries.map((entry) => entry.cacheKey));
  setCheck({ entries, cachedCount: cachedKeys.size });
  return cachedKeys.size;
 }, [entries]);

 useEffect(() => {
  if (entries.length === 0) return;
  let isMounted = true;
  void checkAudioKeysCached(entries.map((entry) => entry.cacheKey)).then((cachedKeys) => {
   if (isMounted) setCheck({ entries, cachedCount: cachedKeys.size });
  });
  return () => {
   isMounted = false;
  };
 }, [entries]);

 useEffect(
  () => () => {
   abortControllerRef.current?.abort();
   abortControllerRef.current = null;
  },
  [entries],
 );

 const downloadLessonAudio = useCallback(async () => {
  if (entries.length === 0) return;

  abortControllerRef.current?.abort();
  const controller = new AbortController();
  abortControllerRef.current = controller;
  // A superseded download must not overwrite the status of the one replacing it.
  const setActivity = (status: LessonAudioPackStatus) => {
   if (abortControllerRef.current === controller) setActivityState({ entries, status });
  };

  setActivity("downloading");
  setErrorMessage(null);

  const cachedKeys = await checkAudioKeysCached(entries.map((entry) => entry.cacheKey));
  if (controller.signal.aborted) return;
  let currentCached = cachedKeys.size;
  setCheck({ entries, cachedCount: currentCached });

  const missingEntries = entries.filter((entry) => !cachedKeys.has(entry.cacheKey));
  let failedCount = 0;

  // Concurrency pool of 3 to avoid overwhelming server while maintaining high speed
  const concurrency = 3;
  let index = 0;

  async function downloadNext(): Promise<void> {
   while (index < missingEntries.length) {
    if (controller.signal.aborted) return;
    const entry = missingEntries[index];
    index += 1;
    if (!entry) continue;

    try {
     const blob = await fetchMandarinAudioBlob(
      entry.text,
      targetVoice,
      LESSON_AUDIO_PACK_RATE,
      controller.signal,
     );
     if (controller.signal.aborted) return;
     if (blob) {
      currentCached += 1;
      setCheck({ entries, cachedCount: currentCached });
     } else {
      failedCount += 1;
     }
    } catch {
     failedCount += 1;
    }
   }
  }

  const workers = Array.from({ length: Math.min(concurrency, missingEntries.length) }, () =>
   downloadNext(),
  );

  await Promise.all(workers);

  if (controller.signal.aborted) return;

  const finalCachedKeys = await checkAudioKeysCached(entries.map((entry) => entry.cacheKey));
  if (controller.signal.aborted) return;
  const finalCached = finalCachedKeys.size;
  setCheck({ entries, cachedCount: finalCached });
  if (failedCount > 0 && finalCached < entries.length) {
   setActivity("error");
   setErrorMessage(`Không tải được ${failedCount} đoạn audio. Hãy kiểm tra kết nối rồi thử lại.`);
   return;
  }
  setActivity("idle");
 }, [entries, targetVoice]);

 const cancelDownload = useCallback(() => {
  if (abortControllerRef.current !== null) {
   abortControllerRef.current.abort();
   abortControllerRef.current = null;
  }
  setActivityState({ entries, status: "idle" });
 }, [entries]);

 const progressPercent =
  totalCount > 0 ? Math.min(100, Math.round((cachedCount / totalCount) * 100)) : 0;

 return {
  status,
  cachedCount,
  totalCount,
  progressPercent,
  isFullyCached,
  isDownloading: status === "downloading",
  errorMessage: visibleErrorMessage,
  downloadLessonAudio,
  cancelDownload,
  refreshStatus: checkCacheStatus,
 };
}
