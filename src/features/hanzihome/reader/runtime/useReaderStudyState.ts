"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { analyzeContextualPronunciation } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-api";
import { hanzihomeQueryKeys } from "../../query-keys";
import { readerResourceToDocument } from "../adapters/reader-resource.adapter";
import { fetchReaderAnnotations } from "../reader-annotation-api";
import type { ReaderDocumentResource } from "../reader-content-api";
import { fetchReaderPronunciationOverrides } from "../reader-pronunciation-api";
import type { ReaderAnswerState } from "../reader.schemas";
import { useReaderProgressState, type ReaderProgressOwner } from "./useReaderProgressState";

export type { ReaderProgressOwner } from "./useReaderProgressState";
export type ReaderAnnotation = Awaited<ReturnType<typeof fetchReaderAnnotations>>[number];
export type ReaderPronunciationOverride = Awaited<
 ReturnType<typeof fetchReaderPronunciationOverrides>
>[number];
export type ReaderPronunciationAnalysis = ReturnType<typeof analyzeContextualPronunciation>;

export function useReaderStudyState(
 resource: ReaderDocumentResource,
 stateOwner: ReaderProgressOwner,
) {
 const progress = useReaderProgressState(resource, stateOwner);
 const { featureState, setFeatureState, hasSession, pending, error, saveError, setSaveError } =
  progress;
 const annotationsQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerAnnotations(resource.document.id),
  queryFn: () => fetchReaderAnnotations(resource.document.id),
  enabled: hasSession && stateOwner !== "reader",
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const pronunciationQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerPronunciationOverrides(resource.document.id),
  queryFn: () => fetchReaderPronunciationOverrides(resource.document.id),
  enabled: hasSession && stateOwner !== "reader",
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const annotations: readonly ReaderAnnotation[] =
  stateOwner === "reader"
   ? (progress.readerState?.annotations ?? [])
   : (annotationsQuery.data ?? []);
 const pronunciationOverrides = useMemo<readonly ReaderPronunciationOverride[]>(
  () =>
   stateOwner === "reader"
    ? (progress.readerState?.overrides ?? [])
    : (pronunciationQuery.data ?? []),
  [progress.readerState, pronunciationQuery.data, stateOwner],
 );
 const pronunciationDictionary = useMemo(
  () =>
   resource.vocabulary.map((item, index) => ({
    id: item.id,
    text: item.word,
    pinyin: item.pinyin,
    priority: resource.vocabulary.length - index,
   })),
  [resource.vocabulary],
 );
 const overridesByParagraph = useMemo(() => {
  const grouped = new Map<string, ReaderPronunciationOverride[]>();
  for (const override of pronunciationOverrides) {
   const current = grouped.get(override.paragraph_id);
   if (current) current.push(override);
   else grouped.set(override.paragraph_id, [override]);
  }
  return grouped;
 }, [pronunciationOverrides]);
 const analysisBySegmentId = useMemo<ReadonlyMap<string, ReaderPronunciationAnalysis>>(() => {
  const next = new Map<string, ReaderPronunciationAnalysis>();

  for (const paragraph of resource.paragraphs) {
   const paragraphOverrides = overridesByParagraph.get(paragraph.id) ?? [];
   const analysis = analyzeContextualPronunciation(
    {
     text: paragraph.zh,
     sourcePinyin: paragraph.pinyin || null,
     overrides: paragraphOverrides.map((override) => ({
      id: override.id,
      text: override.text,
      readings: override.readings,
      scope: override.scope,
      sentenceText: override.sentence_text,
      start: override.start_offset,
      end: override.end_offset,
      updatedAt: override.updated_at,
     })),
    },
    pronunciationDictionary,
   );
   next.set(paragraph.id, analysis);
  }

  return next;
 }, [overridesByParagraph, pronunciationDictionary, resource.paragraphs]);
 const documentModel = useMemo(() => readerResourceToDocument(resource), [resource]);
 const markCompleted = useCallback(() => {
  if (featureState.completed) return;
  setFeatureState((current) => ({ ...current, completed: true }));
 }, [featureState.completed, setFeatureState]);
 const saveExerciseAnswer = useCallback(
  (itemId: string, answer: ReaderAnswerState) => {
   setFeatureState((current) => ({
    ...current,
    answers: { ...current.answers, [itemId]: answer },
   }));
   if (stateOwner !== "personal") return;
   void savePracticeAttempt({
    surface: "personal-learning",
    contentId: itemId,
    direction: null,
    answer: { answer: answer.answer, completed: answer.completed },
    scorePercent: answer.score === null ? null : Math.round(answer.score * 100),
    responseMs: answer.responseMs,
   }).catch((practiceError: Error) => setSaveError(practiceError.message));
  },
  [setFeatureState, setSaveError, stateOwner],
 );

 return {
  documentModel,
  featureState,
  pending,
  error,
  annotations,
  pronunciationOverrides,
  analysisBySegmentId,
  saveError,
  setSaveError,
  saveExerciseAnswer,
  markCompleted,
 };
}
