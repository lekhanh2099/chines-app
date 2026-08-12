"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { VocabReviewPanel } from "./VocabReviewPanel";
import { useHanziHomeLessonVocabulary } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LessonVocabReviewPanel() {
 const runtime = useHanziHomeRuntime();
 const vocabularyQuery = useHanziHomeLessonVocabulary(runtime.lesson.id);

 if (vocabularyQuery.isPending) {
  return (
   <div className="h-72 animate-pulse rounded-xl bg-bg-subtle" aria-label="Đang tải bộ ôn tập" />
  );
 }

 if (vocabularyQuery.isError) {
  return (
   <Card padding="lg" className="grid justify-items-start gap-3">
    <StudyInstructionText tone="default" weight="semibold">
     Không tải được bộ ôn tập.
    </StudyInstructionText>
    <Button type="button" variant="outline" onClick={() => vocabularyQuery.refetch()}>
     Thử lại
    </Button>
   </Card>
  );
 }

 const lesson = {
  ...runtime.lesson,
  vocab: vocabularyQuery.data?.items ?? [],
 };

 return (
  <VocabReviewPanel
   lesson={lesson}
   learningState={runtime.learningState}
   onAnswer={runtime.answerReview}
   onToggleBookmark={(scope, id) =>
    scope === "vocab" ? runtime.bookmarkVocab(id) : runtime.bookmarkGrammar(id)
   }
  />
 );
}
