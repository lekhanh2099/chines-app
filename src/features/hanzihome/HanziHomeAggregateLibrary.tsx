"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { Card } from "@/components/ui/layout/card";
import { PageHeader } from "@/components/ui/layout/page-header";
import { Typography } from "@/components/ui/display/typography";
import {
 DEFAULT_SELECTED_CONTENT_MODULES,
 getOrderedLessonContentModules,
 LessonContentPreviewPanel,
 type LessonContentModule,
} from "@/features/hanzihome/components/aggregate-library/LessonContentPreviewPanel";
import { ReviewLessonMultiSelect } from "@/features/hanzihome/components/aggregate-library/ReviewLessonMultiSelect";
import {
 combineReviewLessons,
 formatSelectedLessonsLabel,
 groupByLesson,
} from "@/features/hanzihome/components/aggregate-library/aggregate-utils";
import {
 applyAggregateFilterChange,
 buildLessonByReviewItemId,
 createEmptyAggregateFilters,
} from "@/features/hanzihome/components/aggregate-library/aggregate-library-model";
import { AggregateFiltersCard } from "@/features/hanzihome/components/aggregate-library/AggregateFiltersCard";
import { useAggregateReviewLessonRoute } from "@/features/hanzihome/components/aggregate-library/useAggregateReviewLessonRoute";
import { AggregateListStatus } from "@/features/hanzihome/components/aggregate-library/AggregateListStatus";
import { AggregateLessonGroupList } from "@/features/hanzihome/components/aggregate-library/AggregateLessonGroupList";
import { VocabReviewPanel } from "@/features/hanzihome/components/VocabReviewPanel";
import { VocabReviewSkeleton } from "@/features/hanzihome/components/VocabReviewSkeleton";
import { UnifiedVocabStudyHub } from "@/features/hanzihome/components/review/UnifiedVocabStudyHub";
import type { ReviewItem } from "@/features/hanzihome/context/types";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 fetchHanziHomeAggregateItems,
 fetchHanziHomeLessonDetail,
} from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import type {
 AggregateFilters,
 AggregateKind,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import type { HanziHomeLesson, ReviewResult } from "@/features/hanzihome/types";
import { buildVocabReviewHrefFromLessons } from "@/features/hanzihome/utils/review-selection-route";

function useReviewLessons(lessonIds: string[]) {
 const queries = useQueries({
  queries: lessonIds.map((lessonId) => ({
   queryKey: hanzihomeQueryKeys.lessonDetail(lessonId),
   queryFn: () => fetchHanziHomeLessonDetail(lessonId),
   enabled: Boolean(lessonId),
   staleTime: Infinity,
  })),
 });

 return queries
  .map((query) => query.data)
  .filter((lesson): lesson is HanziHomeLesson => Boolean(lesson));
}

export function HanziHomeAggregateLibrary({ kind }: { kind: AggregateKind }) {
 const t = useTranslations("Vocab");
 const router = useRouter();
 const catalog = useHanziHomeCatalogData({ includeLessons: true });
 const learning = useLearningState();
 const [filters, setFilters] = useState<AggregateFilters>(createEmptyAggregateFilters);
 const [activeReviewLessonIds, setActiveReviewLessonIds] = useState<string[]>([]);
 const [selectedContentModules, setSelectedContentModules] = useState<LessonContentModule[]>(
  DEFAULT_SELECTED_CONTENT_MODULES,
 );

 const reviewLessons = useReviewLessons(activeReviewLessonIds);
 const aggregateCourses = catalog.courses;
 const aggregateCourseIds = useMemo(
  () => new Set(aggregateCourses.map((course) => course.id)),
  [aggregateCourses],
 );
 const aggregateBooks = useMemo(
  () => catalog.books.filter((book) => aggregateCourseIds.has(book.courseId)),
  [aggregateCourseIds, catalog.books],
 );
 const aggregateLessons = useMemo(
  () =>
   catalog.lessons.filter((lesson) => lesson.courseId && aggregateCourseIds.has(lesson.courseId)),
  [aggregateCourseIds, catalog.lessons],
 );

 const title = kind === "vocab" ? t("title.vocab") : t("title.grammar");
 const description = kind === "vocab" ? t("description.vocab") : t("description.grammar");

 const filteredBooks = useMemo(
  () =>
   filters.courseId
    ? aggregateBooks.filter((book) => book.courseId === filters.courseId)
    : aggregateBooks,
  [aggregateBooks, filters.courseId],
 );

 const filteredLessons = useMemo(
  () =>
   aggregateLessons.filter((lesson) => {
    if (filters.courseId && lesson.courseId !== filters.courseId) return false;
    if (filters.bookId && lesson.bookId !== filters.bookId) return false;
    return true;
   }),
  [aggregateLessons, filters.bookId, filters.courseId],
 );

 const query = useQuery({
  queryKey: hanzihomeQueryKeys.aggregate(kind, filters),
  queryFn: () => fetchHanziHomeAggregateItems({ kind, filters }),
  staleTime: Infinity,
 });

 const items = useMemo(() => query.data ?? [], [query.data]);
 const groupedItems = useMemo(() => groupByLesson(items), [items]);
 const reviewLessonOptions = filteredLessons;
 const {
  availableReviewLessonIds,
  selectedAvailableReviewLessonIds,
  toggleReviewLesson,
  updateReviewLessonSelection,
 } = useAggregateReviewLessonRoute(reviewLessonOptions);
 const selectedLessonDetails = useReviewLessons(selectedAvailableReviewLessonIds);
 const activeReviewLessonSummaries = activeReviewLessonIds
  .map((lessonId) => aggregateLessons.find((lesson) => lesson.id === lessonId))
  .filter((lesson): lesson is (typeof aggregateLessons)[number] => Boolean(lesson));
 const combinedReviewLesson = useMemo(
  () => (reviewLessons.length > 0 ? combineReviewLessons(reviewLessons, kind) : null),
  [kind, reviewLessons],
 );
 const lessonByReviewItemId = useMemo(
  () => buildLessonByReviewItemId(reviewLessons),
  [reviewLessons],
 );
 const isReviewActive = kind !== "vocab" && activeReviewLessonIds.length > 0;
 const activeReviewTitle = formatSelectedLessonsLabel(
  activeReviewLessonSummaries,
  (number, title) => t("filters.lessonOption", { number, title }),
  (count) => t("reviewPicker.activeCount", { count }),
 );
 const shouldShowAggregateList = !isReviewActive;
 const hasActiveFilters = Boolean(
  filters.courseId || filters.bookId || filters.lessonId || filters.q.trim(),
 );

 const updateFilter = (key: keyof AggregateFilters, value: string) => {
  setFilters((current) => applyAggregateFilterChange(current, key, value));
 };

 const resetFilters = () => {
  setFilters(createEmptyAggregateFilters());
 };

 const answerReview = (item: ReviewItem, result: ReviewResult) => {
  learning.appendReviewHistory(item, result);

  if (item.type === "vocab") {
   learning.updateVocabProgress(
    item.id,
    result === "known" ? "known" : result === "hard" ? "hard" : "learning",
   );
  }

  if (item.type === "grammar") {
   learning.updateGrammarProgress(
    item.id,
    result === "known" ? "known" : result === "hard" ? "hard" : "learning",
   );
  }
 };

 const toggleContentModule = (module: LessonContentModule) => {
  setSelectedContentModules((current) => getOrderedLessonContentModules(current, module));
 };

 const startReview = (lessonIds: string[]) => {
  const nextLessonIds = Array.from(
   new Set(lessonIds.filter((lessonId) => availableReviewLessonIds.has(lessonId))),
  );
  if (nextLessonIds.length === 0) return;

  learning.updateSettings({ lastLessonId: nextLessonIds[nextLessonIds.length - 1] });

  if (kind === "vocab") {
   const nextLessons = reviewLessonOptions.filter((lesson) => nextLessonIds.includes(lesson.id));
   router.push(buildVocabReviewHrefFromLessons(nextLessons));
   return;
  }

  setActiveReviewLessonIds(nextLessonIds);
 };

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-5">
    <PageHeader
     eyebrow={t("eyebrow")}
     title={title}
     description={description}
     meta={
      <Typography variant="caption" tone="muted" weight="bold">
       {t("showing", { count: items.length })}
      </Typography>
     }
    />

    {kind === "vocab" ? <UnifiedVocabStudyHub /> : null}

    <Card variant="section" padding="md" className="grid gap-3">
     <ReviewLessonMultiSelect
      kind={kind}
      selectedLessonIds={selectedAvailableReviewLessonIds}
      lessons={reviewLessonOptions}
      activeLessonTitle={activeReviewTitle}
      onToggleLesson={toggleReviewLesson}
      onChangeLessons={updateReviewLessonSelection}
      onStartReview={() => startReview(selectedAvailableReviewLessonIds)}
      onCloseReview={() => setActiveReviewLessonIds([])}
     />

     <LessonContentPreviewPanel
      lessons={selectedLessonDetails}
      selectedModules={selectedContentModules}
      selectedLessonCount={selectedAvailableReviewLessonIds.length}
      onToggleModule={toggleContentModule}
      onApplyPreset={setSelectedContentModules}
     />
    </Card>

    <AggregateFiltersCard
     kind={kind}
     filters={filters}
     courses={aggregateCourses}
     books={filteredBooks}
     lessons={filteredLessons}
     hasActiveFilters={hasActiveFilters}
     onFilterChange={updateFilter}
     onReset={resetFilters}
    />

    {isReviewActive ? (
     <Card variant="section" padding="md">
      {combinedReviewLesson ? (
       <VocabReviewPanel
        lesson={combinedReviewLesson}
        learningState={learning.state}
        initialMode={kind}
        availableModes={[kind]}
        title={t("review.grammarTitle")}
        description={activeReviewTitle || t("review.selectedLesson")}
        onAnswer={answerReview}
        onToggleBookmark={(scope, id) => learning.toggleBookmark(scope, id)}
        getItemLesson={(item) => lessonByReviewItemId.get(`${item.type}:${item.id}`) ?? null}
       />
      ) : (
       <VocabReviewSkeleton />
      )}
     </Card>
    ) : null}

    {shouldShowAggregateList ? (
     <AggregateListStatus
      kind={kind}
      isLoading={query.isLoading}
      isError={query.isError}
      errorMessage={query.error?.message}
      isEmpty={groupedItems.length === 0}
      hasActiveFilters={hasActiveFilters}
      onReset={resetFilters}
      onRetry={() => void query.refetch()}
     />
    ) : null}

    {shouldShowAggregateList && groupedItems.length > 0 ? (
     <AggregateLessonGroupList kind={kind} groups={groupedItems} onStartReview={startReview} />
    ) : null}
   </div>
  </PageContainer>
 );
}
