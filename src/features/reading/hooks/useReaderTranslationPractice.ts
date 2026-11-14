"use client";

import { useMemo, useState } from "react";

import { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-api";
import {
 createTranslationAttempt,
 scoreTranslationAttempt,
 translationReferenceText,
 type TranslationDirection,
} from "@/features/hanzihome/practice/translation-practice";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type { useReaderCommands } from "@/features/reader/runtime/reader-context";
import { buildReaderTranslationSegments } from "@/features/reading/workspaces/reader-document-study-model";

/** Owns the Reader translation drafts, checks and timing, keyed by `<segmentId>:<direction>`. */
export function useReaderTranslationPractice({
 paragraphs,
 activeSegmentId,
 commands,
 setSaveError,
}: {
 paragraphs: ReaderDocumentResource["paragraphs"];
 activeSegmentId?: string;
 commands: ReturnType<typeof useReaderCommands>;
 setSaveError: (error: string) => void;
}) {
 const [translationDirection, setTranslationDirection] = useState<TranslationDirection>("zh-vi");
 const [translationDrafts, setTranslationDrafts] = useState<Record<string, string>>({});
 const [translationChecked, setTranslationChecked] = useState<Record<string, boolean>>({});
 const [translationStartedAt, setTranslationStartedAt] = useState<Record<string, number>>({});
 const translationSegments = useMemo(
  () => buildReaderTranslationSegments(paragraphs),
  [paragraphs],
 );
 const translationActiveIndex = Math.max(
  0,
  translationSegments.findIndex((segment) => segment.id === activeSegmentId),
 );
 const translationSegment = translationSegments[translationActiveIndex] ?? translationSegments[0];
 const translationKey = translationSegment
  ? `${translationSegment.id}:${translationDirection}`
  : "";
 const translationDraft = translationKey ? (translationDrafts[translationKey] ?? "") : "";
 const translationIsChecked = translationKey ? translationChecked[translationKey] === true : false;
 const translationScore =
  translationSegment && translationIsChecked
   ? scoreTranslationAttempt(translationSegment, translationDirection, translationDraft)
   : null;
 const hasUncheckedDraft = Object.entries(translationDrafts).some(
  ([key, value]) => value.trim().length > 0 && translationChecked[key] !== true,
 );

 const checkTranslation = () => {
  if (!translationSegment || !translationKey || !translationDraft.trim()) return;
  const startedAt = translationStartedAt[translationKey];
  const responseMs = startedAt === undefined ? null : Math.max(0, Date.now() - startedAt);
  const attempt = createTranslationAttempt(
   translationSegment,
   translationDirection,
   translationDraft,
   responseMs,
  );
  setTranslationStartedAt((current) => {
   const next = { ...current };
   delete next[translationKey];
   return next;
  });
  setTranslationChecked((current) => ({ ...current, [translationKey]: true }));
  void savePracticeAttempt({
   surface: "translation",
   contentId: translationSegment.id,
   direction: translationDirection,
   answer: {
    answer: attempt.answer,
    reference: translationReferenceText(translationSegment, translationDirection),
   },
   scorePercent: attempt.score,
   responseMs: attempt.responseMs,
  }).catch((error: Error) => setSaveError(error.message));
 };
 const updateTranslationDraft = (value: string) => {
  if (!translationKey) return;
  if (value.trim() && translationStartedAt[translationKey] === undefined) {
   setTranslationStartedAt((current) => ({
    ...current,
    [translationKey]: Date.now(),
   }));
  }
  setTranslationDrafts((current) => ({ ...current, [translationKey]: value }));
  setTranslationChecked((current) => ({ ...current, [translationKey]: false }));
 };
 const selectTranslationSegment = (segmentId: string) => {
  commands.selectSegment(segmentId);
 };
 const moveTranslation = (offset: number) => {
  const next = translationSegments[translationActiveIndex + offset];
  if (next) selectTranslationSegment(next.id);
 };

 return {
  translationDirection,
  setTranslationDirection,
  translationChecked,
  translationSegments,
  translationActiveIndex,
  translationSegment,
  translationDraft,
  translationIsChecked,
  translationScore,
  hasUncheckedDraft,
  checkTranslation,
  updateTranslationDraft,
  selectTranslationSegment,
  moveTranslation,
 };
}
