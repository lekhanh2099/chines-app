"use client";

import { useMemo } from "react";
import { adaptAllLessonExercises } from "@/features/hanzihome/components/practice/universal-exercise-adapter";
import { adaptTextbookGrammarToPip } from "@/features/hanzihome/components/review/pip-grammar-adapter";
import {
 dictationSourcesFromTextbook,
 translationSegmentsFromTextbook,
} from "@/features/hanzihome/practice/translation-practice";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import {
 generateContextualVocabDrills,
 textbookLessonToReviewLesson,
 businessChineseContentSections,
 businessChineseSourceSections,
 businessChineseVisibleSections,
 businessChineseVocabularyTableIds,
 pairedTextbookTranslations,
} from "./business-chinese-study-utils";

/** Derives the lesson's renderable sections, paired translations and canonical vocab tables. */
export function useBusinessChineseLessonSections(lesson: TextbookLesson, activeView: string) {
 const pairedTranslations = useMemo(
  () => pairedTextbookTranslations(lesson.sections),
  [lesson.sections],
 );
 const sourceSections = useMemo(
  () => businessChineseSourceSections(lesson.sections),
  [lesson.sections],
 );
 const contentSections = useMemo(
  () => businessChineseContentSections(sourceSections),
  [sourceSections],
 );
 const canonicalVocabularyTableIds = useMemo(
  () => businessChineseVocabularyTableIds(contentSections, lesson.vocab),
  [contentSections, lesson.vocab],
 );
 const visibleSections = useMemo(
  () => businessChineseVisibleSections(contentSections, activeView),
  [activeView, contentSections],
 );
 return { pairedTranslations, contentSections, canonicalVocabularyTableIds, visibleSections };
}

/**
 * Derives the lesson's review/practice material. Interactive exercises and
 * contextual drills are only built while a surface that needs them is open.
 */
export function useBusinessChinesePracticeMaterials({
 lesson,
 isReviewView,
 needsPracticeItems,
}: {
 lesson: TextbookLesson;
 isReviewView: boolean;
 needsPracticeItems: boolean;
}) {
 const reviewLesson = useMemo(() => textbookLessonToReviewLesson(lesson), [lesson]);
 const contextualDrills = useMemo(
  () => (isReviewView ? generateContextualVocabDrills(lesson) : []),
  [isReviewView, lesson],
 );
 const translationSegments = useMemo(() => translationSegmentsFromTextbook(lesson), [lesson]);
 const dictationSources = useMemo(() => dictationSourcesFromTextbook(lesson), [lesson]);
 const universalTextbookPracticeItems = useMemo(
  () => (needsPracticeItems ? adaptAllLessonExercises(lesson) : []),
  [lesson, needsPracticeItems],
 );
 const textbookGrammarPoints = useMemo(
  () => adaptTextbookGrammarToPip(lesson.sections),
  [lesson.sections],
 );
 return {
  reviewLesson,
  contextualDrills,
  translationSegments,
  dictationSources,
  universalTextbookPracticeItems,
  textbookGrammarPoints,
 };
}
