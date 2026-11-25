"use client";

import { useCallback, useMemo, useState } from "react";

import { calculateChineseAccuracy } from "@/features/hanzihome/practice/text-comparison";

import {
 findResultIndex,
 scoresBySegment,
 summarizeResults,
 upsertResult,
 type VideoDictationResult,
} from "../model/dictation-results";
import type { TranscriptSegment } from "../model/youtube-transcript.schemas";

export function useVideoDictation({
 segments,
 playSegment,
 cancelAutoStop,
}: {
 segments: TranscriptSegment[];
 playSegment: (index: number) => void;
 cancelAutoStop: () => void;
}) {
 const [currentIndex, setCurrentIndex] = useState(0);
 const [draft, setDraft] = useState("");
 const [checked, setChecked] = useState(false);
 const [results, setResults] = useState<VideoDictationResult[]>([]);

 const safeIndex = segments.length > 0 ? Math.min(currentIndex, segments.length - 1) : 0;
 const currentSegment = segments[safeIndex];

 const scores = useMemo(
  () => scoresBySegment(results, segments.length),
  [results, segments.length],
 );
 const summary = useMemo(() => summarizeResults(results), [results]);

 const currentResultIndex = findResultIndex(results, safeIndex);
 const currentResult = currentResultIndex >= 0 ? results[currentResultIndex] : undefined;

 const check = useCallback(() => {
  const segment = segments[safeIndex];
  if (!segment) return;
  if (draft.trim().length === 0) return;

  const score = calculateChineseAccuracy(segment.text, draft);
  setResults((previous) =>
   upsertResult(previous, {
    segmentIndex: safeIndex,
    answer: draft,
    score,
   }),
  );
  setChecked(true);
 }, [draft, safeIndex, segments]);

 const retry = useCallback(() => {
  setChecked(false);
 }, []);

 const goTo = useCallback(
  (index: number) => {
   if (segments.length === 0) return;
   const clamped = Math.max(0, Math.min(segments.length - 1, index));
   cancelAutoStop();
   setCurrentIndex(clamped);
   const existingIndex = findResultIndex(results, clamped);
   const existing = existingIndex >= 0 ? results[existingIndex] : undefined;
   if (existing) {
    setDraft(existing.answer);
    setChecked(true);
   } else {
    setDraft("");
    setChecked(false);
   }
  },
  [cancelAutoStop, results, segments.length],
 );

 const next = useCallback(() => {
  if (safeIndex >= segments.length - 1) return;
  goTo(safeIndex + 1);
 }, [goTo, safeIndex, segments.length]);

 const previous = useCallback(() => {
  if (safeIndex <= 0) return;
  goTo(safeIndex - 1);
 }, [goTo, safeIndex]);

 const listen = useCallback(() => {
  if (segments.length === 0) return;
  playSegment(safeIndex);
 }, [playSegment, safeIndex, segments.length]);

 const reset = useCallback(() => {
  cancelAutoStop();
  setCurrentIndex(0);
  setDraft("");
  setChecked(false);
  setResults([]);
 }, [cancelAutoStop]);

 return {
  currentIndex: safeIndex,
  currentSegment,
  draft,
  checked,
  results,
  scores,
  summary,
  currentResult,
  setDraft,
  check,
  retry,
  goTo,
  next,
  previous,
  listen,
  reset,
 };
}
