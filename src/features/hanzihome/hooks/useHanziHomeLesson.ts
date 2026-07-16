"use client";

import { useQuery } from "@tanstack/react-query";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { fetchHanziHomeLessonDetail } from "@/features/hanzihome/repositories/hanzihome-content-api-client";

const lessonDetailStaleTime = Infinity;

export function useHanziHomeLesson(lessonId: string | null) {
 const query = useQuery({
  queryKey: hanzihomeQueryKeys.lessonDetail(lessonId),
  queryFn: () => fetchHanziHomeLessonDetail(lessonId ?? ""),
  staleTime: lessonDetailStaleTime,
  enabled: Boolean(lessonId),
 });

 return {
  ...query,
  lesson: query.data ?? null,
  isLoading: Boolean(lessonId) && query.isPending,
  isError: query.isError,
 };
}
