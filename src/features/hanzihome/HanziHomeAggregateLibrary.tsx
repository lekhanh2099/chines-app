"use client";

import { Label } from "@/components/ui/label";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
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
import {
 fetchHanziHomeAggregateItems,
 fetchHanziHomeLessonDetail,
} from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import type {
 AggregateFilters,
 AggregateKind,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import { AggregateLibrarySkeleton } from "@/features/hanzihome/components/AggregateLibrarySkeleton";
import type { HanziHomeLesson, ReviewResult } from "@/features/hanzihome/types";
import type { ReviewItem } from "@/features/hanzihome/context/types";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import {
 buildReviewLessonsQueryFromLessons,
 buildVocabReviewHrefFromLessons,
 parseReviewLessonTokensParam,
 resolveReviewLessonTokens,
 REVIEW_LESSONS_QUERY_KEY,
} from "@/features/hanzihome/utils/review-selection-route";
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
   ? "Tra toàn bộ từ vựng theo course, bài học, pinyin và nghĩa."
   : "Tra toàn bộ điểm ngữ pháp theo course, bài học và nội dung cốt lõi.";
 const Icon = kind === "vocab" ? BookOpen : GraduationCap;

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
  queryKey: ["hanzihome", `aggregate-${kind}`, filters],
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

   if (key === "bookId") {
    next.lessonId = "";
   }

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
  <main className="hanzihome-static-page">
   <div className="grid gap-3">
    <Card className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
     <div className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
         <Icon className="h-6 w-6" />
        </span>

        <div className="grid min-w-0 gap-1">
         <StudyInstructionText
          variant="overline"
          tone="muted"
          weight="black"
          tracking="wide"
          transform="uppercase"
         >
          HanziHome Library
         </StudyInstructionText>
         <Typography as="h1" variant="pageTitle" tone="default" weight="black" tracking="tight">
          {title}
         </Typography>
         <StudyInstructionText tone="muted" weight="semibold">
          {description}
         </StudyInstructionText>
        </div>
       </div>

       <StudyInstructionText
        variant="caption"
        tone="muted"
        weight="black"
        className="rounded-full bg-bg-subtle px-3 py-1"
       >
        {items.length} mục
       </StudyInstructionText>
      </div>

      <div className="rounded-xl bg-bg-primary">
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
      </div>

      <LessonContentPreviewPanel
       lessons={selectedLessonDetails}
       selectedModules={selectedContentModules}
       selectedLessonCount={selectedAvailableReviewLessonIds.length}
       onToggleModule={toggleContentModule}
       onApplyPreset={setSelectedContentModules}
      />
     </div>
    </Card>

    <Card className="sticky top-0 z-20 rounded-xl border border-border-default bg-bg-card/95 shadow-theme-sm backdrop-blur">
     <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1.2fr)_repeat(3,minmax(9rem,0.8fr))_auto] xl:items-end">
      <Label variant="label" className="grid gap-1.5">
       <StudyInstructionText
        variant="overline"
        tone="muted"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        Từ khóa
       </StudyInstructionText>
       <div className="flex h-11 items-center gap-2 rounded-xl border border-border-default bg-bg-input px-3">
        <Search className="h-4 w-4 text-text-muted" />
        <Input
         value={filters.q}
         onChange={(event) => updateFilter("q", event.target.value)}
         aria-label={kind === "vocab" ? "Tìm từ vựng" : "Tìm ngữ pháp"}
         placeholder={kind === "vocab" ? "Hán tự, pinyin, nghĩa..." : "Tiêu đề, cấu trúc..."}
         surface="transparent"
         className="min-w-0 flex-1"
        />
       </div>
      </Label>

      <FilterSelect
       label="Course"
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
       size="icon"
      >
       Xóa lọc
      </Button>
     </div>
    </Card>

    <Card className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
     <div className="grid gap-4">
      {isReviewActive && (
       <div className="rounded-xl border border-border-default bg-bg-primary p-3">
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
       </div>
      )}

      {shouldShowAggregateList && query.isLoading && <AggregateLibrarySkeleton />}

      {shouldShowAggregateList && query.isError && (
       <StudyInstructionText
        role="alert"
        tone="danger"
        weight="bold"
        className="rounded-xl bg-danger-subtle p-4"
       >
        {(query.error as Error).message}
       </StudyInstructionText>
      )}

      {shouldShowAggregateList &&
       !query.isLoading &&
       !query.isError &&
       groupedItems.length === 0 && (
        <StudyInstructionText tone="muted" weight="bold" className="rounded-xl bg-bg-subtle p-4">
         Không tìm thấy mục phù hợp.
        </StudyInstructionText>
       )}

      {shouldShowAggregateList &&
       groupedItems.map((group) => (
        <section key={group.lessonId} className="grid gap-2">
         <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
           <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
            {formatLessonHeading(group.lessonNumber, group.lessonTitle)}
           </Typography>
           <StudyInstructionText variant="caption" tone="muted" weight="bold">
            {group.items.length} mục
           </StudyInstructionText>
          </div>

          <div className="flex flex-wrap gap-1.5">
           <Link
            href={buildHanziHomeLessonHref({
             courseId: group.courseId,
             bookId: group.bookId,
             lessonNumber: group.lessonNumber,
             module: kind === "vocab" ? "vocab" : "grammar",
            })}
            prefetch={false}
            className="inline-flex min-h-11 items-center rounded-xl border border-border-default bg-bg-subtle px-3 py-1.5 text-xs font-black text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
           >
            Mở bài
           </Link>
           <Link
            href={
             kind === "vocab"
              ? buildVocabReviewHrefFromLessons([
                 {
                  id: group.lessonId,
                  lessonNumber: group.lessonNumber,
                  courseId: group.courseId,
                  title: group.lessonTitle,
                  titleZh: group.lessonTitle,
                 },
                ])
              : buildHanziHomeLessonHref({
                 courseId: group.courseId,
                 bookId: group.bookId,
                 lessonNumber: group.lessonNumber,
                 module: "review",
                })
            }
            prefetch={false}
            className="inline-flex min-h-11 items-center rounded-xl border border-border-default bg-bg-subtle px-3 py-1.5 text-xs font-black text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            onClick={(event) => {
             if (kind !== "vocab") {
              event.preventDefault();
              startReview([group.lessonId]);
             }
            }}
           >
            Ôn bài
           </Link>
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
     </div>
    </Card>
   </div>
  </main>
 );
}
