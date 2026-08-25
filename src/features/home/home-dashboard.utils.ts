import {
 reviewAttemptAnswerSchema,
 type ReviewAttemptAnswer,
} from "@/features/hanzihome/practice/review-attempt";
import type { PracticeAttemptRow } from "@/features/hanzihome/reader/reader-state.schemas";
import type { HomeRecentActivityItem } from "@/features/home/types";

export type HomeReviewEvidence = {
 key: string;
 label: string;
 kindLabel: string;
 result: "again" | "hard" | "known";
 answeredAt: string;
};

export function projectHomeReviewEvidence(
 attempts: readonly PracticeAttemptRow[],
 labels: {
  fallback: Record<ReviewAttemptAnswer["itemType"], string>;
  kind: Record<ReviewAttemptAnswer["itemType"], string>;
 },
): HomeReviewEvidence[] {
 const evidence: HomeReviewEvidence[] = [];

 for (const attempt of attempts) {
  if (attempt.surface !== "review") continue;
  const parsed = reviewAttemptAnswerSchema.safeParse(attempt.answer);
  if (!parsed.success) continue;
  const answer = parsed.data;
  evidence.push({
   key: attempt.id,
   label: answer.label?.trim() || labels.fallback[answer.itemType],
   kindLabel: labels.kind[answer.itemType],
   result: answer.result,
   answeredAt: attempt.created_at,
  });
 }

 return evidence;
}

export function buildHomeRecentActivity(
 attempts: readonly PracticeAttemptRow[],
 labels: {
  fallback: Record<ReviewAttemptAnswer["itemType"], string>;
  kind: Record<ReviewAttemptAnswer["itemType"], string>;
 },
): HomeRecentActivityItem[] {
 return projectHomeReviewEvidence(attempts, labels).slice(0, 4);
}
