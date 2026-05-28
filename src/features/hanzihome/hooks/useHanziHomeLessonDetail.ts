"use client";

import { useMemo } from "react";

import { getHanziHomeLessonDetail } from "@/features/hanzihome/static-data";

export const hanzihomeLessonDetailQueryKey = (lessonId: string | null) =>
 ["hanzihome", "lesson-detail", lessonId] as const;

export function useHanziHomeLessonDetail(lessonId: string | null) {
 return useMemo(() => getHanziHomeLessonDetail(lessonId), [lessonId]);
}
