"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHanziHomeCatalog } from "@/features/hanzihome/repositories/hanzihome-content-api-client";

const courseLessonsStaleTime = Infinity;

export function useHanziHomeCourseLessons(courseId: string) {
 const query = useQuery({
  queryKey: ["hanzihome", "course-lessons", courseId],
  queryFn: async () => {
   const catalog = await fetchHanziHomeCatalog({ includeLessons: true });

   return catalog.lessons.filter((lesson) => lesson.courseId === courseId);
  },
  staleTime: courseLessonsStaleTime,
 });

 return {
  lessons: query.data ?? [],
  isLoading: query.isLoading,
  isError: query.isError,
 };
}
