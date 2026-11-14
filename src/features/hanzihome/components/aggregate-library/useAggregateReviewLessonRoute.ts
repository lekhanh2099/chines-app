"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import {
 buildReviewLessonsQueryFromLessons,
 parseReviewLessonTokensParam,
 resolveReviewLessonTokens,
 REVIEW_LESSONS_QUERY_KEY,
} from "@/features/hanzihome/utils/review-selection-route";

export function useAggregateReviewLessonRoute(
 reviewLessonOptions: ReturnType<typeof useHanziHomeCatalogData>["lessons"],
) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const routeReviewLessonTokens = useMemo(
  () => parseReviewLessonTokensParam(searchParams.get(REVIEW_LESSONS_QUERY_KEY)),
  [searchParams],
 );

 const routeSelectedReviewLessonIds = useMemo(
  () => resolveReviewLessonTokens(routeReviewLessonTokens, reviewLessonOptions),
  [reviewLessonOptions, routeReviewLessonTokens],
 );

 const availableReviewLessonIds = new Set(reviewLessonOptions.map((lesson) => lesson.id));
 const selectedAvailableReviewLessonIds = routeSelectedReviewLessonIds.filter((id) =>
  availableReviewLessonIds.has(id),
 );
 const syncSelectedLessonsToUrl = (lessonIds: string[]) => {
  const nextLessonIds = Array.from(new Set(lessonIds.filter(Boolean)));
  const nextLessons = reviewLessonOptions.filter((lesson) => nextLessonIds.includes(lesson.id));
  const nextParams = new URLSearchParams(searchParams.toString());
  const queryString = buildReviewLessonsQueryFromLessons(nextLessons);

  if (queryString) {
   const reviewParams = new URLSearchParams(queryString);
   nextParams.set(REVIEW_LESSONS_QUERY_KEY, reviewParams.get(REVIEW_LESSONS_QUERY_KEY) || "");
  } else {
   nextParams.delete(REVIEW_LESSONS_QUERY_KEY);
  }

  router.replace(nextParams.toString() ? `?${nextParams.toString()}` : "?", { scroll: false });
 };

 const updateReviewLessonSelection = (lessonIds: string[]) => {
  const nextLessonIds = Array.from(
   new Set(lessonIds.filter((lessonId) => availableReviewLessonIds.has(lessonId))),
  );
  syncSelectedLessonsToUrl(nextLessonIds);
 };

 const toggleReviewLesson = (lessonId: string) => {
  if (selectedAvailableReviewLessonIds.includes(lessonId)) {
   updateReviewLessonSelection(selectedAvailableReviewLessonIds.filter((id) => id !== lessonId));
   return;
  }

  updateReviewLessonSelection([...selectedAvailableReviewLessonIds, lessonId]);
 };

 return {
  availableReviewLessonIds,
  selectedAvailableReviewLessonIds,
  toggleReviewLesson,
  updateReviewLessonSelection,
 };
}
