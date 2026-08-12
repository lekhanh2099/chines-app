"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { QueryErrorCard } from "@/components/ui/query-error-card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { AggregateLibrarySkeleton } from "@/features/hanzihome/components/AggregateLibrarySkeleton";
import { FilterSelect } from "@/features/hanzihome/components/aggregate-library/FilterSelect";
import { GrammarAggregateRow } from "@/features/hanzihome/components/aggregate-library/GrammarAggregateRow";
import {
 DEFAULT_SELECTED_CONTENT_MODULES,
 getOrderedLessonContentModules,
 LessonContentPreviewPanel,
 type LessonContentModule,
} from "@/features/hanzihome/components/aggregate-library/LessonContentPreviewPanel";
import { ReviewLessonMultiSelect } from "@/features/hanzihome/components/aggregate-library/ReviewLessonMultiSelect";
import { VocabAggregateRow } from "@/features/hanzihome/components/aggregate-library/VocabAggregateRow";
import {
 combineReviewLessons,
 formatLessonHeading,
 formatSelectedLessonsLabel,
 groupByLesson,
 isAggregateVocabItem,
} from "@/features/hanzihome/components/aggregate-library/aggregate-utils";
import { VocabReviewPanel } from "@/features/hanzihome/components/VocabReviewPanel";
import { VocabReviewSkeleton } from "@/features/hanzihome/components/VocabReviewSkeleton";
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
import {
 buildReviewLessonsQueryFromLessons,
 buildVocabReviewHrefFromLessons,
 parseReviewLessonTokensParam,
 resolveReviewLessonTokens,
 REVIEW_LESSONS_QUERY_KEY,
} from "@/features/hanzihome/utils/review-selection-route";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";

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
 const router = useRouter();
 const searchParams = useSearchParams();
 const catalog = useHanziHomeCatalogData({ includeLessons: true });
 const learning = useLearningState();
 const [filters, setFilters] = useState<AggregateFilters>({
  courseId: "",
  bookId: "",
  lessonId: "",
  q: "",
 });
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

 const title = kind === "vocab" ? "Tổng hợp từ vựng" : "Tổng hợp ngữ pháp";
 const description =
  kind === "vocab"
   ? "Tra toàn bộ từ vựng theo giáo trình, quyển, bài học, pinyin và nghĩa."
   : "Tra toàn bộ điểm ngữ pháp theo giáo trình, quyển, bài học và nội dung cốt lõi.";

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
 const routeReviewLessonTokens = useMemo(
  () => parseReviewLessonTokensParam(searchParams.get(REVIEW_LESSONS_QUERY_KEY)),
  [searchParams],
 );

 const routeSelectedReviewLessonIds = useMemo(
  () => resolveReviewLessonTokens(routeReviewLessonTokens, reviewLessonOptions),
  [reviewLessonOptions, routeReviewLessonTokens],
 );

 const availableReviewLessonIds = new Set(reviewLessonOptions.map((lesson) => lesson.id));
 const selectedAvailableReviewLessonIds = routeSelectedReviewLessonIds.filter((id) =>
  availableReviewLessonIds.has(id),
 );
 const selectedLessonDetails = useReviewLessons(selectedAvailableReviewLessonIds);
 const activeReviewLessonSummaries = activeReviewLessonIds
  .map((lessonId) => aggregateLessons.find((lesson) => lesson.id === lessonId))
  .filter((lesson): lesson is (typeof aggregateLessons)[number] => Boolean(lesson));
 const combinedReviewLesson = useMemo(
  () => (reviewLessons.length > 0 ? combineReviewLessons(reviewLessons, kind) : null),
  [kind, reviewLessons],
 );
 const lessonByReviewItemId = useMemo(() => {
  const byId = new Map<string, HanziHomeLesson>();

  for (const lesson of reviewLessons) {
   for (const word of lesson.vocab) {
    byId.set(`vocab:${getVocabItemKey(word)}`, lesson);
   }
   for (const point of lesson.grammar) byId.set(`grammar:${point.id}`, lesson);
  }

  return byId;
 }, [reviewLessons]);
 const isReviewActive = kind !== "vocab" && activeReviewLessonIds.length > 0;
 const activeReviewTitle = formatSelectedLessonsLabel(activeReviewLessonSummaries);
 const shouldShowAggregateList = !isReviewActive;
 const hasActiveFilters = Boolean(
  filters.courseId || filters.bookId || filters.lessonId || filters.q.trim(),
 );

 const syncSelectedLessonsToUrl = (lessonIds: string[]) => {
  const nextLessonIds = Array.from(new Set(lessonIds.filter(Boolean)));
  const nextLessons = reviewLessonOptions.filter((lesson) => nextLessonIds.includes(lesson.id));
  const nextParams = new URLSearchParams(searchParams.toString());
  const queryString = buildReviewLessonsQueryFromLessons(nextLessons);

  if (queryString) {
   const reviewParams = new URLSearchParams(queryString);
   nextParams.set(REVIEW_LESSONS_QUERY_KEY, reviewParams.get(REVIEW_LESSONS_QUERY_KEY) || "");
  } else {
   nextParams.delete(REVIEW_LESSONS_QUERY_KEY);
  }

  router.replace(nextParams.toString() ? `?${nextParams.toString()}` : "?", { scroll: false });
 };

 const updateReviewLessonSelection = (lessonIds: string[]) => {
  const nextLessonIds = Array.from(
   new Set(lessonIds.filter((lessonId) => availableReviewLessonIds.has(lessonId))),
  );
  syncSelectedLessonsToUrl(nextLessonIds);
 };

 const updateFilter = (key: keyof AggregateFilters, value: string) => {
  setFilters((current) => {
   const next = {
    ...current,
    [key]: value,
   };

   if (key === "courseId") {
    next.bookId = "";
    next.lessonId = "";
   }

   if (key === "bookId") next.lessonId = "";

   return next;
  });
 };

 const resetFilters = () => {
  setFilters({
   courseId: "",
   bookId: "",
   lessonId: "",
   q: "",
  });
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

 const toggleReviewLesson = (lessonId: string) => {
  if (selectedAvailableReviewLessonIds.includes(lessonId)) {
   updateReviewLessonSelection(selectedAvailableReviewLessonIds.filter((id) => id !== lessonId));
   return;
  }

  updateReviewLessonSelection([...selectedAvailableReviewLessonIds, lessonId]);
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
   <main className="grid w-full min-w-0 gap-5">
    <PageHeader
     eyebrow="HanziHome Library"
     title={title}
     description={description}
     meta={
      <Typography variant="caption" tone="muted" weight="bold">
       {items.length} mục đang hiển thị
      </Typography>
     }
    />

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

    <Card variant="section" padding="md" className="sticky top-0 z-20">
     <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1.2fr)_repeat(3,minmax(9rem,0.8fr))_auto] xl:items-end">
      <Label variant="label" className="grid gap-1.5">
       <Typography variant="overline" tone="muted" weight="black">
        Từ khóa
       </Typography>
       <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
         value={filters.q}
         onChange={(event) => updateFilter("q", event.target.value)}
         aria-label={kind === "vocab" ? "Tìm từ vựng" : "Tìm ngữ pháp"}
         placeholder={kind === "vocab" ? "Hán tự, pinyin, nghĩa..." : "Tiêu đề, cấu trúc..."}
         adornment="start"
        />
       </div>
      </Label>

      <FilterSelect
       label="Giáo trình"
       value={filters.courseId}
       onChange={(value) => updateFilter("courseId", value)}
       options={aggregateCourses.map((course) => ({
        value: course.id,
        label: course.title,
       }))}
      />

      <FilterSelect
       label="Quyển"
       value={filters.bookId}
       onChange={(value) => updateFilter("bookId", value)}
       options={filteredBooks.map((book) => ({
        value: book.id,
        label: book.shortTitle || book.title,
       }))}
      />

      <FilterSelect
       label="Bài"
       value={filters.lessonId}
       onChange={(value) => updateFilter("lessonId", value)}
       options={filteredLessons.map((lesson) => ({
        value: lesson.id,
        label: `Bài ${lesson.lessonNumber}: ${lesson.titleZh}`,
       }))}
      />

      <Button
       type="button"
       onClick={resetFilters}
       disabled={!hasActiveFilters}
       variant="outline"
       size="toolbar"
      >
       Xóa lọc
      </Button>
     </div>
    </Card>

    {isReviewActive ? (
     <Card variant="section" padding="md">
      {combinedReviewLesson ? (
       <VocabReviewPanel
        lesson={combinedReviewLesson}
        learningState={learning.state}
        initialMode={kind}
        availableModes={[kind]}
        title="Ôn flashcard ngữ pháp"
        description={activeReviewTitle || "Bài đang chọn"}
        onAnswer={answerReview}
        onToggleBookmark={(scope, id) => learning.toggleBookmark(scope, id)}
        getItemLesson={(item) => lessonByReviewItemId.get(`${item.type}:${item.id}`) ?? null}
       />
      ) : (
       <VocabReviewSkeleton />
      )}
     </Card>
    ) : null}

    {shouldShowAggregateList && query.isLoading ? <AggregateLibrarySkeleton /> : null}

    {shouldShowAggregateList && query.isError ? (
     <QueryErrorCard
      title={`Không tải được ${kind === "vocab" ? "từ vựng" : "ngữ pháp"}`}
      description={query.error?.message ?? "Dữ liệu tổng hợp hiện không khả dụng."}
      onRetry={() => void query.refetch()}
     />
    ) : null}

    {shouldShowAggregateList && !query.isLoading && !query.isError && groupedItems.length === 0 ? (
     <EmptyState
      surface="subtle"
      title="Không tìm thấy mục phù hợp"
      description="Thử thay đổi từ khóa hoặc bộ lọc đang chọn."
      actions={
       hasActiveFilters ? (
        <Button type="button" variant="outline" size="toolbar" onClick={resetFilters}>
         Xóa bộ lọc
        </Button>
       ) : undefined
      }
     />
    ) : null}

    {shouldShowAggregateList && groupedItems.length > 0 ? (
     <Card variant="section" padding="md" className="grid gap-4">
      {groupedItems.map((group, groupIndex) => (
       <section key={group.lessonId} className="grid gap-3">
        {groupIndex > 0 ? <Separator /> : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
         <div>
          <Typography as="h2" variant="sectionTitle" weight="black">
           {formatLessonHeading(group.lessonNumber, group.lessonTitle)}
          </Typography>
          <Typography variant="caption" tone="muted" weight="bold">
           {group.items.length} mục
          </Typography>
         </div>

         <div className="flex flex-wrap gap-1.5">
          <Button asChild variant="outline" size="toolbar">
           <Link
            href={buildHanziHomeLessonHref({
             courseId: group.courseId,
             bookId: group.bookId,
             lessonNumber: group.lessonNumber,
             module: kind === "vocab" ? "vocab" : "grammar",
            })}
            prefetch={false}
           >
            Mở bài
           </Link>
          </Button>
          {kind === "vocab" ? (
           <Button asChild variant="outline" size="toolbar">
            <Link
             href={buildVocabReviewHrefFromLessons([
              {
               id: group.lessonId,
               lessonNumber: group.lessonNumber,
               courseId: group.courseId,
               title: group.lessonTitle,
               titleZh: group.lessonTitle,
              },
             ])}
             prefetch={false}
            >
             Ôn bài
            </Link>
           </Button>
          ) : (
           <Button
            type="button"
            variant="outline"
            size="toolbar"
            onClick={() => startReview([group.lessonId])}
           >
            Ôn bài
           </Button>
          )}
         </div>
        </div>

        <div className="grid gap-2">
         {group.items.map((item) => {
          if (isAggregateVocabItem(item)) {
           return <VocabAggregateRow key={item.id} item={item} />;
          }

          return <GrammarAggregateRow key={item.id} item={item} />;
         })}
        </div>
       </section>
      ))}
     </Card>
    ) : null}
   </main>
  </PageContainer>
 );
}
