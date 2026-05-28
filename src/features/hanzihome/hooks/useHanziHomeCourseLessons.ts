"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { lessonSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

const courseLessonsResponseSchema = z.object({
 source: z.enum(["db", "empty"]),
 lessons: z.array(lessonSchema),
});

async function fetchCourseLessons(courseId: string): Promise<HanziHomeLesson[]> {
 const params = new URLSearchParams({
  courseId,
 });

 const response = await fetch(
  `/api/hanzihome/course-lessons?${params.toString()}`,
  {
   method: "GET",
   cache: "no-store",
   headers: {
    Accept: "application/json",
   },
  },
 );

 if (!response.ok) {
  throw new Error("Could not load HanziHome course lessons");
 }

 const json: unknown = await response.json();
 const parsed = courseLessonsResponseSchema.parse(json);

 return parsed.lessons;
}

export function useHanziHomeCourseLessons(courseId: string) {
 const query = useQuery({
  queryKey: ["hanzihome", "course-lessons", courseId],
  queryFn: () => fetchCourseLessons(courseId),
  enabled: Boolean(courseId),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
 });

 return query.data ?? [];
}
