import type { ReviewItem } from "@/features/hanzihome/hooks/useVocabReviewSession";
import type { HanziHomeLesson, ReviewResult, UserLearningState } from "@/features/hanzihome/types";

export type ReviewAnswerHandler = (
 item: {
  type: UserLearningState["reviewHistory"][number]["type"];
  id: string;
 },
 result: ReviewResult,
) => void;

export type ReviewBookmarkHandler = (
 scope: keyof UserLearningState["bookmarks"],
 id: string,
) => void;

export type FlashcardDetailDialogProps = {
 item: ReviewItem;
 open: boolean;
 onOpenChange: (open: boolean) => void;
 learningState: UserLearningState;
 lesson: HanziHomeLesson;
 onAnswer: ReviewAnswerHandler;
 onToggleBookmark?: ReviewBookmarkHandler;
 itemLesson: HanziHomeLesson;
};
