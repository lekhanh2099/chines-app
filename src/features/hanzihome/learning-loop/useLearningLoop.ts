"use client";

import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import type { ReviewRating } from "@/features/hanzihome/learning-loop/learning-loop.schemas";

export function useLatestLearningSession() {
 const learning = useLearningState();

 return {
  error: learning.isError,
  loading: learning.isLoading,
  session: learning.state.progress.learningLoop.latestSession,
 };
}

export function useReviewQueue() {
 const learning = useLearningState();

 return {
  error: learning.isError,
  items: learning.state.progress.learningLoop.reviewItems,
  loading: learning.isLoading,
  rate: (id: string, rating: ReviewRating) => learning.rateLearningReviewItem(id, rating),
 };
}
