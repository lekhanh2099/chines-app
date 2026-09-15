"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

import { HanziHomeSearchIndexResponseSchema } from "./types";

const SEARCH_INDEX_STALE_TIME = 10 * 60 * 1000;

export async function fetchSearchIndex() {
 const response = await fetch("/api/hanzihome/search-index?v=2");
 if (!response.ok) throw new Error("Không thể tải chỉ mục tìm kiếm HanziHome.");

 const payload = HanziHomeSearchIndexResponseSchema.parse(await response.json().catch(() => null));
 return payload.items;
}

export function prefetchHanziHomeSearchIndex(queryClient: QueryClient) {
 return queryClient.prefetchQuery({
  queryKey: hanzihomeQueryKeys.searchIndex,
  queryFn: fetchSearchIndex,
  staleTime: SEARCH_INDEX_STALE_TIME,
 });
}

export function useHanziHomeSearchIndex(enabled: boolean) {
 return useQuery({
  queryKey: hanzihomeQueryKeys.searchIndex,
  queryFn: fetchSearchIndex,
  enabled,
  staleTime: SEARCH_INDEX_STALE_TIME,
  gcTime: Number.POSITIVE_INFINITY,
  refetchOnWindowFocus: false,
 });
}
