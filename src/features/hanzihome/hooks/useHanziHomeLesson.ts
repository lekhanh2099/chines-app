"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHanziHomeLessonDetail } from "@/features/hanzihome/repositories/hanzihome-content-api-client";

const lessonDetailStaleTime = Infinity;

export function useHanziHomeLesson(lessonId: string | null) {
 const query = useQuery({
  queryKey: ["hanzihome", "lesson-detail", lessonId],
  queryFn: () => fetchHanziHomeLessonDetail(lessonId ?? ""),
  staleTime: lessonDetailStaleTime,
  enabled: Boolean(lessonId),
 });

 return query.data ?? null;
}
