"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 combineReviewLessons,
 formatSelectedLessonsLabel,
} from "@/features/hanzihome/components/aggregate-library/aggregate-utils";
import { VocabReviewPanel } from "@/features/hanzihome/components/VocabReviewPanel";
import { VocabReviewSkeleton } from "@/features/hanzihome/components/VocabReviewSkeleton";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { fetchHanziHomeLessonDetail } from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import type { HanziHomeLesson, ReviewResult } from "@/features/hanzihome/types";
import {
 parseReviewLessonTokensParam,
 resolveReviewLessonTokens,
} from "@/features/hanzihome/utils/review-selection-route";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";

export function HanziHomeVocabReviewPage({
 reviewLessonsParam,
}: {
 reviewLessonsParam: string | null;
}) {
 const catalog = useHanziHomeCatalogData({ includeLessons: true });
 const lessonTokens = useMemo(
  () => parseReviewLessonTokensParam(reviewLessonsParam),
  [reviewLessonsParam],
 );
 const lessonIds = useMemo(
  () => resolveReviewLessonTokens(lessonTokens, catalog.lessons),
  [catalog.lessons, lessonTokens],
 );
 const learning = useLearningState();

 const lessonQueries = useQueries({
  queries: lessonIds.map((lessonId) => ({
   queryKey: ["hanzihome", "lesson-detail", lessonId] as const,
   queryFn: () => fetchHanziHomeLessonDetail(lessonId),
   enabled: Boolean(lessonId),
   staleTime: Infinity,
  })),
 });

 const lessons = lessonQueries
  .map((query) => query.data)
  .filter((lesson): lesson is HanziHomeLesson => Boolean(lesson));
 const isLoading = lessonIds.length > 0 && lessonQueries.some((query) => query.isLoading);
 const error = lessonQueries.find((query) => query.isError)?.error;
 const combinedReviewLesson = useMemo(
  () => (lessons.length > 0 ? combineReviewLessons(lessons, "vocab") : null),
  [lessons],
 );
 const activeReviewTitle = formatSelectedLessonsLabel(
  lessons.map((lesson) => ({
   id: lesson.id,
   title: lesson.title || lesson.titleZh || "Bài học",
   titleZh: lesson.titleZh,
   lessonNumber: lesson.lessonNumber,
  })),
 );

 const lessonByReviewItemId = useMemo(() => {
  const byId = new Map<string, HanziHomeLesson>();

  for (const lesson of lessons) {
   for (const word of lesson.vocab) {
    byId.set(`vocab:${getVocabItemKey(word)}`, lesson);
   }
   for (const point of lesson.grammar) byId.set(`grammar:${point.id}`, lesson);
  }

  return byId;
 }, [lessons]);

 const answerReview = (
  item: { type: "vocab" | "grammar" | "radical"; id: string },
  result: ReviewResult,
 ) => {
  learning.appendReviewHistory(item, result);

  if (item.type === "vocab") {
   learning.updateVocabProgress(
    item.id,
    result === "known" ? "known" : result === "hard" ? "hard" : "learning",
   );
  }
 };

 return (
  <main className="hanzihome-static-page">
   <div className="grid gap-4">
    <Card className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="grid gap-1">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">Ôn tập</p>
       <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
        Ôn từ vựng
       </h1>
       <p className="font-semibold text-text-muted">
        {activeReviewTitle || "Chọn bài ở màn tổng hợp từ để bắt đầu ôn."}
       </p>
      </div>

      <Button asChild variant="outline">
       <Link href="/hanzihome/vocab">
        <ArrowLeft className="h-4 w-4" />
        Về tổng hợp từ
       </Link>
      </Button>
     </div>
    </Card>

    {lessonIds.length === 0 && (
     <Card
      padding="lg"
      className="rounded-xl border border-dashed border-border-default bg-bg-primary text-center shadow-theme-sm"
     >
      <div className="grid gap-3">
       <h2 className="text-xl font-black text-text-primary">Chưa chọn bài để ôn</h2>
       <p className="font-semibold text-text-muted">
        Về màn tổng hợp từ, tick một hoặc nhiều bài rồi bấm bắt đầu ôn.
       </p>
       <div>
        <Button asChild>
         <Link href="/hanzihome/vocab">Chọn bài ôn</Link>
        </Button>
       </div>
      </div>
     </Card>
    )}

    {error instanceof Error && (
     <p role="alert" className="rounded-xl bg-danger-subtle p-4 font-bold text-danger-text">
      {error.message}
     </p>
    )}

    {isLoading && <VocabReviewSkeleton />}

    {!isLoading && lessonIds.length > 0 && combinedReviewLesson && (
     <VocabReviewPanel
      lesson={combinedReviewLesson}
      learningState={learning.state}
      initialMode="vocab"
      availableModes={["vocab"]}
      title="Ôn flashcard từ vựng"
      description={activeReviewTitle || "Bài đang chọn"}
      onAnswer={answerReview}
      onToggleBookmark={(scope, id) => learning.toggleBookmark(scope, id)}
      getItemLesson={(item) => lessonByReviewItemId.get(`${item.type}:${item.id}`) ?? null}
     />
    )}
   </div>
  </main>
 );
}
