"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { useDebounce } from "@/hooks/useDebounce";

import {
 HanziHomeSearchResponseSchema,
 type HanziHomeSearchCategory,
 type HanziHomeSearchRequest,
} from "./types";

export const SEARCH_INPUT_DEBOUNCE_MS = 150;
const SEARCH_RESULTS_STALE_TIME = 60 * 1000;

type SearchParams = Pick<HanziHomeSearchRequest, "q" | "category" | "courseId" | "lessonId">;

export async function fetchHanziHomeSearch(params: SearchParams, signal?: AbortSignal) {
 const searchParams = new URLSearchParams({ q: params.q, category: params.category });
 if (params.courseId) searchParams.set("courseId", params.courseId);
 if (params.lessonId) searchParams.set("lessonId", params.lessonId);
 const response = await fetch(`/api/hanzihome/search?${searchParams.toString()}`, { signal });
 if (!response.ok) throw new Error(`HanziHome search failed with status ${response.status}`);
 return HanziHomeSearchResponseSchema.parse(await response.json());
}

export function useHanziHomeSearch({
 enabled,
 query,
 category,
 courseId,
 lessonId,
}: {
 enabled: boolean;
 query: string;
 category: HanziHomeSearchCategory;
 courseId?: string;
 lessonId?: string;
}) {
 const { userId } = useClientSession();
 const debouncedQuery = useDebounce(query.trim(), SEARCH_INPUT_DEBOUNCE_MS);
 const params: SearchParams = { q: debouncedQuery, category, courseId, lessonId };
 const search = useQuery({
  queryKey: hanzihomeQueryKeys.search(userId, params),
  queryFn: ({ signal }) => fetchHanziHomeSearch(params, signal),
  enabled: enabled && Boolean(userId) && debouncedQuery.length > 0,
  placeholderData: keepPreviousData,
  staleTime: SEARCH_RESULTS_STALE_TIME,
  refetchOnWindowFocus: false,
 });

 const isSettled = query.trim() === debouncedQuery;
 return {
  data: search.data,
  isError: search.isError,
  refetch: search.refetch,
  /** Typing has not settled yet or the settled query is still being fetched. */
  isUpdating: !isSettled || search.isFetching,
  /** The visible data answers the current input (not a kept previous result). */
  isCurrent: isSettled && search.isSuccess && !search.isPlaceholderData,
 };
}
