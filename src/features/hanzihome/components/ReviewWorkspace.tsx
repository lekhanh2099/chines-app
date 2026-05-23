"use client";

import { VocabReviewPanel } from "@/features/hanzihome/components/VocabReviewPanel";
import type { HanziHomeLesson, ReviewResult } from "@/features/hanzihome/types";

type ReviewWorkspaceProps = {
 lesson: HanziHomeLesson;
 onAnswer: (item: { type: "vocab" | "grammar" | "radical"; id: string }, result: ReviewResult) => void;
};

export function ReviewWorkspace({ lesson, onAnswer }: ReviewWorkspaceProps) {
 return <VocabReviewPanel lesson={lesson} onAnswer={onAnswer} />;
}
