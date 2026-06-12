"use client";

import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { VocabReviewPanel } from "./VocabReviewPanel";

export function LessonVocabReviewPanel() {
 const runtime = useHanziHomeRuntime();

 return (
  <VocabReviewPanel
   lesson={runtime.lesson}
   learningState={runtime.learningState}
   onAnswer={runtime.answerReview}
   onToggleBookmark={(scope, id) =>
    scope === "vocab" ? runtime.bookmarkVocab(id) : runtime.bookmarkGrammar(id)
   }
  />
 );
}
