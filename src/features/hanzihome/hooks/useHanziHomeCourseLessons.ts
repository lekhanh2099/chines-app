"use client";

import { useMemo } from "react";

import { getHanziHomeCourseLessonSummaries } from "@/features/hanzihome/static-data";

export function useHanziHomeCourseLessons(courseId: string) {
 return useMemo(
  () => getHanziHomeCourseLessonSummaries(courseId),
  [courseId],
 );
}
