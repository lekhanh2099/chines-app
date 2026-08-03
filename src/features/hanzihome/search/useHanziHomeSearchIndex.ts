"use client";

import { useQuery } from "@tanstack/react-query";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

import { HanziHomeSearchIndexResponseSchema } from "./types";

async function fetchSearchIndex() {
 const response = await fetch("/api/hanzihome/search-index?v=2");
 if (!response.ok) throw new Error("Không thể tải chỉ mục tìm kiếm HanziHome.");

 const payload = HanziHomeSearchIndexResponseSchema.parse(await response.json().catch(() => null));
 return payload.items;
}

export function useHanziHomeSearchIndex(enabled: boolean) {
 return useQuery({
  queryKey: hanzihomeQueryKeys.searchIndex,
  queryFn: fetchSearchIndex,
  enabled,
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  refetchOnWindowFocus: false,
 });
}
