"use client";

import { useMemo } from "react";

import { lessonDisplaySettings } from "@/features/hanzihome/utils/learning-state";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";

import { LessonTranslationWorkspace } from "./LessonTranslationWorkspace";
import { translationSegmentsFromLesson } from "./translation-practice";

export function TranslationPracticeWorkspace() {
 const runtime = useHanziHomeRuntime();
 const displayMode = lessonDisplaySettings(runtime.learningState, runtime.lesson);
 const segments = useMemo(
  () => translationSegmentsFromLesson(runtime.lesson.sourceLesson),
  [runtime.lesson.sourceLesson],
 );

 return <LessonTranslationWorkspace segments={segments} displayMode={displayMode} />;
}
