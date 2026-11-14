"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHanziHomeListeningLesson } from "./listening.api";
import { listeningQueryKeys } from "./listening.query-keys";

export function useHanziHomeListeningLesson(lessonId: string) {
 return useQuery({
  queryKey: listeningQueryKeys.lesson(lessonId),
  queryFn: () => fetchHanziHomeListeningLesson(lessonId),
  enabled: Boolean(lessonId),
  staleTime: Number.POSITIVE_INFINITY,
 });
}
