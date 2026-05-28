"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { lessonSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

const lessonDetailResponseSchema = z.object({
 source: z.enum(["db", "empty"]),
 lesson: lessonSchema.nullable(),
});

export const hanzihomeLessonDetailQueryKey = (lessonId: string | null) =>
 ["hanzihome", "lesson-detail", lessonId] as const;

async function fetchLessonDetail(
 lessonId: string,
): Promise<HanziHomeLesson | null> {
 const response = await fetch(
  `/api/hanzihome/lessons/${encodeURIComponent(lessonId)}`,
  {
   method: "GET",
   cache: "no-store",
   headers: {
    Accept: "application/json",
   },
  },
 );

 if (!response.ok) {
  throw new Error("Could not load HanziHome lesson detail");
 }

 const json: unknown = await response.json();
 const parsed = lessonDetailResponseSchema.parse(json);

 return parsed.lesson;
}

export function useHanziHomeLessonDetail(lessonId: string | null) {
 const query = useQuery({
  queryKey: hanzihomeLessonDetailQueryKey(lessonId),
  queryFn: () => {
   if (!lessonId) {
    throw new Error("Missing HanziHome lesson id");
   }

   return fetchLessonDetail(lessonId);
  },
  enabled: Boolean(lessonId),
  staleTime: 0,
 });

 return query.data ?? null;
}
