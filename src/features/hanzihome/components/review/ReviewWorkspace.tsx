"use client";

import { VocabReviewPanel } from "@/features/hanzihome/components/VocabReviewPanel";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";

export function ReviewWorkspace() {
 const runtime = useHanziHomeRuntime();

 return (
  <VocabReviewPanel
   lesson={runtime.lesson}
   learningState={runtime.learningState}
   onAnswer={runtime.answerReview}
   onToggleBookmark={(scope, id) =>
    scope === "vocab"
     ? runtime.bookmarkVocab(id)
     : runtime.bookmarkGrammar(id)
   }
  />
 );
}
