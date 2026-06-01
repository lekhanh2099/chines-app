"use client";

import { useQuery } from "@tanstack/react-query";

import { getHanziHomeCourseLessonSummaries } from "@/features/hanzihome/static-data";

export function useHanziHomeCourseLessonsQuery(courseId: string) {
 return useQuery({
  queryKey: ["hanzihome", "course-lessons", courseId],
  queryFn: () => Promise.resolve(getHanziHomeCourseLessonSummaries(courseId)),
  enabled: Boolean(courseId),
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
 });
}

export function useHanziHomeCourseLessons(courseId: string) {
 const query = useHanziHomeCourseLessonsQuery(courseId);

 return query.data ?? [];
}
