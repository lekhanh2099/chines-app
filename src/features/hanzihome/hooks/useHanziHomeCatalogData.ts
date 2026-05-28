"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import {
 bookSchema,
 catalogCourseSchema,
 lessonSchema,
} from "@/features/hanzihome/hanzihome-api.schemas";
import type { HanziHomeCatalogData } from "@/features/hanzihome/types";

const catalogResponseSchema = z.object({
 source: z.enum(["db", "empty"]),
 courses: z.array(catalogCourseSchema),
 books: z.array(bookSchema),
 lessons: z.array(lessonSchema).optional(),
});

const emptyCatalogData: HanziHomeCatalogData = {
 source: "empty",
 courses: [],
 books: [],
 lessons: [],
 radicals: [],
 meta: {
  app: "hanzihome",
  dataset: "db",
  version: "0",
  generatedAt: "",
  counts: {
   lessons: 0,
   vocab: 0,
   grammarPoints: 0,
  },
 } as HanziHomeCatalogData["meta"],
};

async function fetchCatalogData({
 includeLessons,
}: {
 includeLessons: boolean;
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
  radicals: [],
  meta: emptyCatalogData.meta,
 };
}

export function useHanziHomeCatalogData({
 includeLessons = false,
}: {
 includeLessons?: boolean;
} = {}) {
 const query = useQuery({
  queryKey: ["hanzihome", "catalog", { includeLessons }],
  queryFn: () => fetchCatalogData({ includeLessons }),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
 });

 return query.data ?? emptyCatalogData;
}
