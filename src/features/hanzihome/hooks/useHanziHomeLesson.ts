"use client";

import { useMemo } from "react";
import type { HanziHomeData } from "@/features/hanzihome/types";

export function useHanziHomeLesson(data: HanziHomeData, lessonId: string | null) {
 return useMemo(() => {
  return data.lessons.find((lesson) => lesson.id === lessonId) || data.lessons[0] || null;
 }, [data.lessons, lessonId]);
}
