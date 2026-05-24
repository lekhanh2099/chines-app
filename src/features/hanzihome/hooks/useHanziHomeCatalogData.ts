"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import {
  bookSchema,
  catalogCourseSchema,
  lessonSchema,
} from "@/features/hanzihome/hanzihome-api.schemas";
import { getHanziHomeCatalogSummary } from "@/features/hanzihome/static-data";
import type { HanziHomeCatalogData } from "@/features/hanzihome/types";

const catalogResponseSchema = z.object({
  source: z.enum(["db", "empty"]),
  courses: z.array(catalogCourseSchema),
  books: z.array(bookSchema),
  lessons: z.array(lessonSchema).optional(),
});

async function fetchCatalogData({
  includeLessons,
  fallback,
}: {
  includeLessons: boolean;
  fallback: HanziHomeCatalogData;
}): Promise<HanziHomeCatalogData> {
  const params = new URLSearchParams();

  if (includeLessons) {
    params.set("includeLessons", "1");
  }

  const response = await fetch(
    `/api/hanzihome/catalog${params.size > 0 ? `?${params.toString()}` : ""}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Could not load HanziHome catalog");
  }

  const json: unknown = await response.json();
  const parsed = catalogResponseSchema.parse(json);

  return {
    source: parsed.source,
    courses: parsed.courses,
    books: parsed.books,
    lessons: parsed.lessons ?? [],
    radicals: fallback.radicals,
    meta: fallback.meta,
  };
}

export function useHanziHomeCatalogData({
  includeLessons = false,
}: {
  includeLessons?: boolean;
} = {}) {
  const fallback = useMemo(
    () => getHanziHomeCatalogSummary(includeLessons),
    [includeLessons],
  );
  const query = useQuery({
    queryKey: ["hanzihome", "catalog", { includeLessons }],
    queryFn: () => fetchCatalogData({ includeLessons, fallback }),
    placeholderData: fallback,
    staleTime: 0,
  });

  return query.data && query.data.courses.length > 0 ? query.data : fallback;
}
