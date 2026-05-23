"use client";

import { VocabReviewPanel } from "@/features/hanzihome/components/VocabReviewPanel";
import type {
 HanziHomeLesson,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";

type ReviewWorkspaceProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 onAnswer: (item: { type: "vocab" | "grammar" | "radical"; id: string }, result: ReviewResult) => void;
};

export function ReviewWorkspace({
 lesson,
 learningState,
 onAnswer,
}: ReviewWorkspaceProps) {
 return (
  <VocabReviewPanel
   lesson={lesson}
   learningState={learningState}
   onAnswer={onAnswer}
  />
 );
}
