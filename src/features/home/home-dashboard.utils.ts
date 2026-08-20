import { reviewAttemptAnswerSchema } from "@/features/hanzihome/practice/review-attempt";
import type { PracticeAttemptRow } from "@/features/hanzihome/reader/reader-state.schemas";
import type { HomeRecentActivityItem } from "@/features/home/types";

const fallbackLabelByType = {
 vocab: "Từ vựng đã ôn",
 grammar: "Điểm ngữ pháp đã ôn",
 radical: "Bộ thủ đã ôn",
};

const kindLabelByType = {
 vocab: "Từ vựng",
 grammar: "Ngữ pháp",
 radical: "Bộ thủ",
};

export type HomeReviewEvidence = {
 key: string;
 label: string;
 kindLabel: string;
 result: "again" | "hard" | "known";
 answeredAt: string;
};

export function projectHomeReviewEvidence(
 attempts: readonly PracticeAttemptRow[],
): HomeReviewEvidence[] {
 const evidence: HomeReviewEvidence[] = [];

 for (const attempt of attempts) {
  if (attempt.surface !== "review") continue;
  const parsed = reviewAttemptAnswerSchema.safeParse(attempt.answer);
  if (!parsed.success) continue;
  const answer = parsed.data;
  evidence.push({
   key: attempt.id,
   label: answer.label?.trim() || fallbackLabelByType[answer.itemType],
   kindLabel: kindLabelByType[answer.itemType],
   result: answer.result,
   answeredAt: attempt.created_at,
  });
 }

 return evidence;
}

export function buildHomeRecentActivity(
 attempts: readonly PracticeAttemptRow[],
): HomeRecentActivityItem[] {
 return projectHomeReviewEvidence(attempts).slice(0, 4);
}
