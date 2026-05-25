"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { lessonSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import { getHanziHomeCatalogSummary } from "@/features/hanzihome/static-data";

const courseLessonsResponseSchema = z.object({
  source: z.enum(["db", "empty"]),
  lessons: z.array(lessonSchema),
});

async function fetchCourseLessons(courseId: string) {
  const params = new URLSearchParams({
    courseId,
  });

  const response = await fetch(`/api/hanzihome/course-lessons?${params}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Could not load course lessons");
  }

  const json: unknown = await response.json();
  const parsed = courseLessonsResponseSchema.parse(json);

  return parsed.lessons;
}

export function useHanziHomeCourseLessons(courseId: string) {
  const fallback = useMemo(() => {
    if (!courseId) return [];

    return getHanziHomeCatalogSummary(true).lessons.filter(
      (lesson) => lesson.courseId === courseId,
    );
  }, [courseId]);

  const query = useQuery({
    queryKey: ["hanzihome", "course-lessons", courseId],
    queryFn: () => fetchCourseLessons(courseId),
    enabled: Boolean(courseId),
    placeholderData: fallback,
    staleTime: 0,
  });

  return query.data ?? fallback;
}
