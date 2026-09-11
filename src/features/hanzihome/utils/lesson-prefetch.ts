import type { QueryClient } from "@tanstack/react-query";

import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 loadLessonDetailWithCache,
 loadLessonVocabularyWithCache,
} from "@/features/hanzihome/local/lesson-content-cache";

export const lessonResourceStaleTime = 5 * 60 * 1000;

/**
 * Opportunistically prefetches only above-the-fold destination-required lesson resources.
 * Specifically prefetching both detail and vocabulary prevents suspense/loading flashes
 * when mounting the HanziHomeWorkspace.
 */
export function prefetchHanziHomeLessonResources(
 queryClient: QueryClient,
 lessonId: string | null | undefined,
 ownerId: string = "anonymous",
): void {
 if (!lessonId) return;

 void queryClient.prefetchQuery({
  queryKey: hanzihomeQueryKeys.lessonDetail(lessonId),
  queryFn: ({ signal }) => loadLessonDetailWithCache({ queryClient, ownerId, lessonId, signal }),
  staleTime: lessonResourceStaleTime,
 });

 void queryClient.prefetchQuery({
  queryKey: hanzihomeQueryKeys.lessonResource(lessonId, "vocabulary"),
  queryFn: ({ signal }) =>
   loadLessonVocabularyWithCache({ queryClient, ownerId, lessonId, signal }),
  staleTime: lessonResourceStaleTime,
 });
}
