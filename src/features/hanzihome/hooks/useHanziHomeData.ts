"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import {
  bookSchema,
  courseSchema,
  lessonSchema,
} from "@/features/hanzihome/hanzihome-api.schemas";
import { getHanziHomeData } from "@/features/hanzihome/static-data";
import type { HanziHomeData } from "@/features/hanzihome/types";

const dbDataResponseSchema = z.object({
  source: z.enum(["db", "empty"]),
  hasSeededLessons: z.boolean(),
  data: z.object({
    courses: z.array(courseSchema),
    books: z.array(bookSchema),
    lessons: z.array(lessonSchema),
  }),
});

async function fetchDbHanziHomeData(
  staticData: HanziHomeData,
): Promise<HanziHomeData> {
  const response = await fetch("/api/hanzihome/data", {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Could not load DB-backed HanziHome data");
  }

  const json: unknown = await response.json();
  const parsed = dbDataResponseSchema.parse(json);

  return {
    ...parsed.data,
    radicals: staticData.radicals,
    meta: staticData.meta,
  };
}

export function useHanziHomeData() {
  // Legacy/full-load hook kept only for temporary compatibility.
  // Dashboard and lesson workspace should use catalog/detail hooks instead.
  const staticData = useMemo(() => getHanziHomeData(), []);
  const query = useQuery({
    queryKey: ["hanzihome", "data"],
    queryFn: () => fetchDbHanziHomeData(staticData),
    placeholderData: staticData,
    staleTime: 0,
  });

  return query.data && query.data.lessons.length > 0 ? query.data : staticData;
}
