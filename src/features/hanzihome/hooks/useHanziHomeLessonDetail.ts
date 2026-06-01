"use client";

import { useQuery } from "@tanstack/react-query";

import { getHanziHomeLessonDetail } from "@/features/hanzihome/static-data";

export const hanzihomeLessonDetailQueryKey = (lessonId: string | null) =>
 ["hanzihome", "lesson-detail", lessonId] as const;

export function useHanziHomeLessonDetailQuery(lessonId: string | null) {
 return useQuery({
  queryKey: hanzihomeLessonDetailQueryKey(lessonId),
  queryFn: () => Promise.resolve(getHanziHomeLessonDetail(lessonId)),
  enabled: Boolean(lessonId),
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
 });
}

export function useHanziHomeLessonDetail(lessonId: string | null) {
 const query = useHanziHomeLessonDetailQuery(lessonId);

 return query.data ?? null;
}
