"use client";

import { useMemo } from "react";

import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";

import { LessonTranslationWorkspace } from "./LessonTranslationWorkspace";
import { translationSegmentsFromLesson } from "./translation-practice";

export function TranslationPracticeWorkspace() {
 const runtime = useHanziHomeRuntime();
 const displayMode =
  runtime.learningState.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const segments = useMemo(
  () => translationSegmentsFromLesson(runtime.lesson.sourceLesson),
  [runtime.lesson.sourceLesson],
 );

 return <LessonTranslationWorkspace segments={segments} displayMode={displayMode} />;
}
