"use client";

import { useMemo } from "react";

import { getHanziHomeCatalogSummary } from "@/features/hanzihome/static-data";

export function useHanziHomeCourseLessons(courseId: string) {
 return useMemo(() => {
  if (!courseId) return [];

  return getHanziHomeCatalogSummary(true).lessons.filter(
   (lesson) => lesson.courseId === courseId,
  );
 }, [courseId]);
}
