"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHanziHomeCatalog } from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
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

export function useHanziHomeCatalogQuery({
 includeLessons = false,
 includeRadicals = false,
 enabled = true,
}: {
 includeLessons?: boolean;
 includeRadicals?: boolean;
 enabled?: boolean;
} = {}) {
 const query = useQuery({
  queryKey: hanzihomeQueryKeys.catalog(includeLessons, includeRadicals),
  queryFn: () => fetchHanziHomeCatalog({ includeLessons, includeRadicals }),
  staleTime: catalogStaleTime,
  enabled,
 });

 return {
  ...query,
  data: query.data ?? emptyCatalogData,
 };
}

export function useHanziHomeCatalogData(
 options: {
  includeLessons?: boolean;
  includeRadicals?: boolean;
  enabled?: boolean;
 } = {},
) {
 return useHanziHomeCatalogQuery(options).data;
}
