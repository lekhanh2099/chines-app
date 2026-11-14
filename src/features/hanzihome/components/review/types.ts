import type { ReviewItem as ReviewSessionItem } from "@/features/hanzihome/hooks/useVocabReviewSession";
import type { ReviewItem } from "@/features/hanzihome/context/types";
import type { HanziHomeLesson, ReviewResult, UserLearningState } from "@/features/hanzihome/types";

export type ReviewAnswerHandler = (item: ReviewItem, result: ReviewResult) => void;

export type ReviewBookmarkHandler = (
 scope: keyof UserLearningState["bookmarks"],
 id: string,
) => void;

export type FlashcardDetailDialogProps = {
 item: ReviewSessionItem;
 open: boolean;
 onOpenChange: (open: boolean) => void;
 learningState: UserLearningState;
 lesson: HanziHomeLesson;
 onAnswer: ReviewAnswerHandler;
 onToggleBookmark?: ReviewBookmarkHandler;
 itemLesson: HanziHomeLesson;
};
