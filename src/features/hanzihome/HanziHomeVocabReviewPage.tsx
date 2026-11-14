"use client";

import Link from "next/link";
import { useMemo } from "react";
import { type UseQueryResult, useQueries, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { useClientSession } from "@/components/providers/QueryProvider";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { PageHeader } from "@/components/ui/layout/page-header";
import { Typography } from "@/components/ui/display/typography";
import {
 combineReviewLessons,
 formatSelectedLessonsLabel,
} from "@/features/hanzihome/components/aggregate-library/aggregate-utils";
import { VocabReviewPanel } from "@/features/hanzihome/components/VocabReviewPanel";
import { VocabReviewSkeleton } from "@/features/hanzihome/components/VocabReviewSkeleton";
import { UnifiedVocabStudyHub } from "@/features/hanzihome/components/review/UnifiedVocabStudyHub";
import type { ReviewItem } from "@/features/hanzihome/context/types";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import {
 lessonDetailQueryOptions,
 lessonVocabularyQueryOptions,
} from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { attachLessonVocabularyResource } from "@/features/hanzihome/repositories/hanzihome-content-resources";
import type { HanziHomeLesson, ReviewResult } from "@/features/hanzihome/types";
import {
 parseReviewLessonTokensParam,
 resolveReviewLessonTokens,
} from "@/features/hanzihome/utils/review-selection-route";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";

// Stable reference so useQueries memoizes the combined result between renders.
function combineLessonResourceQueries<TData>(results: UseQueryResult<TData, Error>[]) {
 return {
  data: results.map((result) => result.data),
  isLoading: results.some((result) => result.isLoading),
  error: results.find((result) => result.isError)?.error ?? null,
 };
}

export function HanziHomeVocabReviewPage({
 reviewLessonsParam,
}: {
 reviewLessonsParam: string | null;
}) {
 const t = useTranslations("Dictionary.vocabReview");
 const tLibrary = useTranslations("Common.library");
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
 const queryClient = useQueryClient();
 const { user } = useClientSession();
 const ownerId = user?.id ?? "anonymous";

 // Lesson detail never carries vocabulary; the canonical vocabulary resource
 // (hanzihome_vocab_items) is attached exactly as the lesson workspace does.
 const details = useQueries({
  queries: lessonIds.map((lessonId) => lessonDetailQueryOptions(queryClient, ownerId, lessonId)),
  combine: combineLessonResourceQueries,
 });
 const vocabularies = useQueries({
  queries: lessonIds.map((lessonId) =>
   lessonVocabularyQueryOptions(queryClient, ownerId, lessonId),
  ),
  combine: combineLessonResourceQueries,
 });

 const lessons = useMemo(
  () =>
   details.data.flatMap((detail, index) => {
    const vocabulary = vocabularies.data[index];
    return detail && vocabulary ? [attachLessonVocabularyResource(detail, vocabulary)] : [];
   }),
  [details.data, vocabularies.data],
 );
 const isLoading = lessonIds.length > 0 && (details.isLoading || vocabularies.isLoading);
 const error = details.error ?? vocabularies.error;
 const combinedReviewLesson = useMemo(
  () => (lessons.length > 0 ? combineReviewLessons(lessons, "vocab") : null),
  [lessons],
 );
 const activeReviewTitle = formatSelectedLessonsLabel(
  lessons.map((lesson) => ({
   id: lesson.id,
   title: lesson.title || lesson.titleZh || t("lessonFallback"),
   titleZh: lesson.titleZh,
   lessonNumber: lesson.lessonNumber,
  })),
  (number, title) => tLibrary("lessonLabel", { number, title }),
  (count) => t("reviewingCount", { count }),
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

 const answerReview = (item: ReviewItem, result: ReviewResult) => {
  learning.appendReviewHistory(item, result);

  if (item.type === "vocab") {
   learning.updateVocabProgress(
    item.id,
    result === "known" ? "known" : result === "hard" ? "hard" : "learning",
   );
  }
 };

 return (
  <div className="hanzihome-static-page min-w-0">
   <div className="grid min-w-0 gap-4">
    <PageHeader
     eyebrow={t("eyebrow")}
     title={t("title")}
     description={activeReviewTitle || t("defaultDescription")}
     actions={
      <Button asChild variant="outline">
       <Link href="/vocab">
        <ArrowLeft data-icon="inline-start" />
        {t("backToVocab")}
       </Link>
      </Button>
     }
    />

    {lessonIds.length === 0 ? (
     <div className="grid gap-4">
      <UnifiedVocabStudyHub defaultOpenInline />
      <EmptyState
       title={t("noLessonSelectedTitle")}
       description={t("noLessonSelectedDescription")}
       actions={
        <Button asChild>
         <Link href="/vocab">{t("selectLessonsAction")}</Link>
        </Button>
       }
      />
     </div>
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
      title={t("flashcardTitle")}
      description={activeReviewTitle || t("selectedLesson")}
      onAnswer={answerReview}
      onToggleBookmark={(scope, id) => learning.toggleBookmark(scope, id)}
      getItemLesson={(item) => lessonByReviewItemId.get(`${item.type}:${item.id}`) ?? null}
     />
    ) : null}
   </div>
  </div>
 );
}
