"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Typography } from "@/components/ui/typography";
import {
 combineReviewLessons,
 formatSelectedLessonsLabel,
} from "@/features/hanzihome/components/aggregate-library/aggregate-utils";
import { VocabReviewPanel } from "@/features/hanzihome/components/VocabReviewPanel";
import { VocabReviewSkeleton } from "@/features/hanzihome/components/VocabReviewSkeleton";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { fetchHanziHomeLessonDetail } from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import type { HanziHomeLesson, ReviewResult, UserLearningState } from "@/features/hanzihome/types";
import {
 parseReviewLessonTokensParam,
 resolveReviewLessonTokens,
} from "@/features/hanzihome/utils/review-selection-route";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";

export function HanziHomeVocabReviewPage({
 reviewLessonsParam,
}: {
 reviewLessonsParam: z.infer<z.ZodNullable<z.ZodString>>;
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
   queryKey: hanzihomeQueryKeys.lessonDetail(lessonId),
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
  item: {
   type: UserLearningState["reviewHistory"][number]["type"];
   id: string;
  },
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
  <main className="hanzihome-static-page min-w-0">
   <div className="grid min-w-0 gap-4">
    <PageHeader
     eyebrow="Ôn tập"
     title="Ôn từ vựng"
     description={activeReviewTitle || "Chọn bài ở màn tổng hợp từ để bắt đầu ôn."}
     actions={
      <Button asChild variant="outline">
       <Link href="/vocab">
        <ArrowLeft data-icon="inline-start" />
        Về tổng hợp từ
       </Link>
      </Button>
     }
    />

    {lessonIds.length === 0 ? (
     <EmptyState
      title="Chưa chọn bài để ôn"
      description="Về màn tổng hợp từ, tick một hoặc nhiều bài rồi bấm bắt đầu ôn."
      actions={
       <Button asChild>
        <Link href="/vocab">Chọn bài ôn</Link>
       </Button>
      }
     />
    ) : null}

    {error instanceof Error ? (
     <Card variant="subtle" padding="md" role="alert">
      <Typography as="p" variant="bodySmall" tone="danger" weight="bold">
       {error.message}
      </Typography>
     </Card>
    ) : null}

    {isLoading ? <VocabReviewSkeleton /> : null}

    {!isLoading && lessonIds.length > 0 && combinedReviewLesson ? (
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
    ) : null}
   </div>
  </main>
 );
}
