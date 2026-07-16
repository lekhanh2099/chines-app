"use client";

import { useQuery } from "@tanstack/react-query";

import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { fetchHanziHomeCourseLessons } from "@/features/hanzihome/repositories/hanzihome-content-api-client";

const courseLessonsStaleTime = Infinity;

export function useHanziHomeCourseLessons(
 courseId: string,
 { enabled = true }: { enabled?: boolean } = {},
) {
 const query = useQuery({
  queryKey: hanzihomeQueryKeys.courseLessons(courseId),
  queryFn: () => fetchHanziHomeCourseLessons(courseId),
  staleTime: courseLessonsStaleTime,
  enabled: enabled && Boolean(courseId),
 });

 return {
  ...query,
  lessons: query.data ?? [],
  isLoading: query.isLoading,
  isError: query.isError,
 };
}
