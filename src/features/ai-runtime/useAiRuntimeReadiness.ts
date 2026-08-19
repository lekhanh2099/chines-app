"use client";

import { useQuery } from "@tanstack/react-query";

import { aiRuntimeQueryKey, fetchAiRuntimeReadiness } from "./ai-runtime.client";

export function useAiRuntimeReadiness() {
 return useQuery({
  queryKey: aiRuntimeQueryKey,
  queryFn: fetchAiRuntimeReadiness,
  staleTime: 30_000,
 });
}
