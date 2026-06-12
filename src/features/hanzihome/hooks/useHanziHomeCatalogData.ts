"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHanziHomeCatalog } from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import type { HanziHomeCatalogData } from "@/features/hanzihome/types";

const catalogStaleTime = Infinity;

const emptyCatalogData: HanziHomeCatalogData = {
 source: "empty",
 courses: [],
 books: [],
 lessons: [],
 radicals: [],
 meta: {
  app: "hanzihome",
  dataset: "empty",
  version: "0",
  generatedAt: "",
  sourceFiles: [],
  counts: {
   lessons: 0,
   vocab: 0,
   grammarPoints: 0,
   radicals: 0,
   flashcards: 0,
  },
 },
};

export function useHanziHomeCatalogData({
 includeLessons = false,
}: {
 includeLessons?: boolean;
} = {}) {
 const query = useQuery({
  queryKey: ["hanzihome", "catalog", { includeLessons }],
  queryFn: () => fetchHanziHomeCatalog({ includeLessons }),
  staleTime: catalogStaleTime,
 });

 return query.data ?? emptyCatalogData;
}
