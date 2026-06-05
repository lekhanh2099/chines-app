"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { VocabReviewPanel } from "@/features/hanzihome/components/VocabReviewPanel";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";
import {
 fetchHanziHomeAggregateItems,
 fetchHanziHomeLessonDetail,
} from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import {
 type AggregateFilters,
 type AggregateGrammarItem,
 type AggregateKind,
 type AggregateResourceItem,
 type AggregateVocabItem,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import type { HanziHomeLesson, ReviewResult } from "@/features/hanzihome/types";

function useReviewLessons(lessonIds: string[]) {
 const queries = useQueries({
  queries: lessonIds.map((lessonId) => ({
   queryKey: ["hanzihome", "lesson-detail", lessonId] as const,
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
 const catalog = useHanziHomeCatalogData({ includeLessons: true });
 const learning = useLearningState();
 const [filters, setFilters] = useState<AggregateFilters>({
  courseId: "",
  bookId: "",
  lessonId: "",
  q: "",
 });
 const [selectedReviewLessonIds, setSelectedReviewLessonIds] = useState<
  string[]
 >([]);
 const [activeReviewLessonIds, setActiveReviewLessonIds] = useState<string[]>(
  [],
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
   catalog.lessons.filter(
    (lesson) => lesson.courseId && aggregateCourseIds.has(lesson.courseId),
   ),
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
 const availableReviewLessonIds = new Set(
  reviewLessonOptions.map((lesson) => lesson.id),
 );
 const selectedAvailableReviewLessonIds = selectedReviewLessonIds.filter((id) =>
  availableReviewLessonIds.has(id),
 );
 const lessonFilterIsAvailable = reviewLessonOptions.some(
  (lesson) => lesson.id === filters.lessonId,
 );
 const lastLessonIsAvailable = reviewLessonOptions.some(
  (lesson) => lesson.id === learning.state.settings.lastLessonId,
 );
 const fallbackReviewLessonId =
  (lessonFilterIsAvailable ? filters.lessonId : null) ||
  (lastLessonIsAvailable ? learning.state.settings.lastLessonId : null) ||
  reviewLessonOptions.at(-1)?.id ||
  "";
 const effectiveReviewLessonIds =
  selectedAvailableReviewLessonIds.length > 0
   ? selectedAvailableReviewLessonIds
   : fallbackReviewLessonId
     ? [fallbackReviewLessonId]
     : [];
 const activeReviewLessonSummaries = activeReviewLessonIds
  .map((lessonId) => aggregateLessons.find((lesson) => lesson.id === lessonId))
  .filter((lesson): lesson is (typeof aggregateLessons)[number] =>
   Boolean(lesson),
  );
 const combinedReviewLesson = useMemo(
  () =>
   reviewLessons.length > 0 ? combineReviewLessons(reviewLessons, kind) : null,
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
 const isReviewActive = activeReviewLessonIds.length > 0;
 const activeReviewTitle = formatSelectedLessonsLabel(
  activeReviewLessonSummaries,
 );
 const shouldShowAggregateList = !isReviewActive;
 const hasActiveFilters = Boolean(
  filters.courseId || filters.bookId || filters.lessonId || filters.q.trim(),
 );

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

  if (item.type === "grammar") {
   learning.updateGrammarProgress(
    item.id,
    result === "known" ? "known" : result === "hard" ? "hard" : "learning",
   );
  }
 };

 const toggleReviewLesson = (lessonId: string) => {
  setSelectedReviewLessonIds((current) => {
   const availableCurrent = current.filter((id) =>
    availableReviewLessonIds.has(id),
   );
   const source =
    availableCurrent.length > 0 ? availableCurrent : effectiveReviewLessonIds;

   if (source.includes(lessonId)) {
    return source.length === 1
     ? source
     : source.filter((id) => id !== lessonId);
   }

   return [...source, lessonId];
  });
 };

 const startReview = (lessonIds: string[]) => {
  if (lessonIds.length === 0) return;

  setActiveReviewLessonIds(lessonIds);
  setSelectedReviewLessonIds(lessonIds);
  learning.updateSettings({ lastLessonId: lessonIds[lessonIds.length - 1] });
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
         <p className="text-xs font-black uppercase tracking-wide text-text-muted">
          HanziHome Library
         </p>
         <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
          {title}
         </h1>
         <p className="text-sm font-semibold text-text-muted">{description}</p>
        </div>
       </div>

       <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
        {items.length} mục
       </span>
      </div>

      <div className="rounded-xl border border-border-default bg-bg-primary p-2">
       <ReviewLessonMultiSelect
        kind={kind}
        selectedLessonIds={effectiveReviewLessonIds}
        lessons={reviewLessonOptions}
        activeLessonTitle={activeReviewTitle}
        onToggleLesson={toggleReviewLesson}
        onStartReview={() => startReview(effectiveReviewLessonIds)}
        onCloseReview={() => setActiveReviewLessonIds([])}
       />
      </div>
     </div>
    </Card>

    <Card className="sticky top-0 z-20 rounded-xl border border-border-default bg-bg-card/95 shadow-theme-sm backdrop-blur">
     <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1.2fr)_repeat(3,minmax(9rem,0.8fr))_auto] xl:items-end">
      <label className="grid gap-1.5">
       <span className="text-xs font-black uppercase tracking-wide text-text-muted">
        Từ khóa
       </span>
       <div className="flex h-11 items-center gap-2 rounded-xl border border-border-default bg-bg-input px-3">
        <Search className="h-4 w-4 text-text-muted" />
        <input
         value={filters.q}
         onChange={(event) => updateFilter("q", event.target.value)}
         placeholder={
          kind === "vocab" ? "Hán tự, pinyin, nghĩa..." : "Tiêu đề, cấu trúc..."
         }
         className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-text-primary outline-none placeholder:text-text-muted"
        />
       </div>
      </label>

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

      <button
       type="button"
       onClick={resetFilters}
       disabled={!hasActiveFilters}
       className="h-11 rounded-xl border border-border-default bg-bg-subtle px-4 text-sm font-black text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
       Xóa lọc
      </button>
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
          title={
           kind === "vocab" ? "Ôn flashcard từ vựng" : "Ôn flashcard ngữ pháp"
          }
          description={activeReviewTitle || "Bài đang chọn"}
          onAnswer={answerReview}
          onToggleBookmark={(scope, id) => learning.toggleBookmark(scope, id)}
          getItemLesson={(item) =>
           lessonByReviewItemId.get(`${item.type}:${item.id}`) ?? null
          }
         />
        ) : (
         <p className="rounded-xl bg-bg-subtle p-4 text-sm font-bold text-text-muted">
          Đang tải bài để ôn...
         </p>
        )}
       </div>
      )}

      {shouldShowAggregateList && query.isLoading && (
       <p className="rounded-xl bg-bg-subtle p-4 text-sm font-bold text-text-muted">
        Đang tải dữ liệu tổng hợp...
       </p>
      )}

      {shouldShowAggregateList && query.isError && (
       <p
        role="alert"
        className="rounded-xl bg-danger-subtle p-4 text-sm font-bold text-danger-text"
       >
        {(query.error as Error).message}
       </p>
      )}

      {shouldShowAggregateList &&
       !query.isLoading &&
       !query.isError &&
       groupedItems.length === 0 && (
        <p className="rounded-xl bg-bg-subtle p-4 text-sm font-bold text-text-muted">
         Không tìm thấy mục phù hợp.
        </p>
       )}

      {shouldShowAggregateList &&
       groupedItems.map((group) => (
        <section key={group.lessonId} className="grid gap-2">
         <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
           <h2 className="text-base font-black text-text-primary">
            {formatLessonHeading(group.lessonNumber, group.lessonTitle)}
           </h2>
           <p className="text-xs font-bold text-text-muted">
            {group.items.length} mục
           </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
           <Link
            href={buildHanziHomeLessonHref({
             courseId: group.courseId,
             lessonNumber: group.lessonNumber,
             module: kind === "vocab" ? "vocab" : "grammar",
            })}
            className="rounded-xl border border-border-default bg-bg-subtle px-3 py-1.5 text-xs font-black text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
           >
            Mở bài
           </Link>
           <Link
            href={buildHanziHomeLessonHref({
             courseId: group.courseId,
             lessonNumber: group.lessonNumber,
             module: "review",
            })}
            className="rounded-xl border border-border-default bg-bg-subtle px-3 py-1.5 text-xs font-black text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            onClick={(event) => {
             event.preventDefault();
             startReview([group.lessonId]);
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

function FilterSelect({
 label,
 value,
 options,
 onChange,
}: {
 label: string;
 value: string;
 options: Array<{ value: string; label: string }>;
 onChange: (value: string) => void;
}) {
 return (
  <label className="grid gap-1.5">
   <span className="text-xs font-black uppercase tracking-wide text-text-muted">
    {label}
   </span>
   <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="h-11 min-w-0 rounded-xl border border-border-default bg-bg-input px-3 text-sm font-bold text-text-primary outline-none"
   >
    <option value="">Tất cả</option>
    {options.map((option) => (
     <option key={option.value} value={option.value}>
      {option.label}
     </option>
    ))}
   </select>
  </label>
 );
}

function ReviewLessonMultiSelect({
 kind,
 selectedLessonIds,
 lessons,
 activeLessonTitle,
 onToggleLesson,
 onStartReview,
 onCloseReview,
}: {
 kind: AggregateKind;
 selectedLessonIds: string[];
 lessons: Array<{
  id: string;
  lessonNumber: number;
  title: string;
  titleZh: string;
 }>;
 activeLessonTitle: string;
 onToggleLesson: (lessonId: string) => void;
 onStartReview: () => void;
 onCloseReview: () => void;
}) {
 return (
  <TooltipProvider>
   <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
    <div className="flex flex-wrap items-center gap-1.5">
     <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-black text-text-muted">
      {selectedLessonIds.length}
     </span>
     {lessons.map((lesson) => {
      const selected = selectedLessonIds.includes(lesson.id);
      const fullTitle = formatLessonHeading(
       lesson.lessonNumber,
       lesson.titleZh || lesson.title,
      );

      return (
       <Tooltip key={lesson.id}>
        <TooltipTrigger asChild>
         <Button
          type="button"
          size="xs"
          variant={selected ? "default" : "outline"}
          title={fullTitle}
          aria-pressed={selected}
          onClick={() => onToggleLesson(lesson.id)}
          className="h-7 rounded-lg px-2.5 font-black"
         >
          Bài {lesson.lessonNumber}
         </Button>
        </TooltipTrigger>
        <TooltipContent>{fullTitle}</TooltipContent>
       </Tooltip>
      );
     })}
    </div>

    <div className="flex flex-wrap justify-end gap-2">
     {activeLessonTitle && (
      <Button
       type="button"
       size="sm"
       variant="outline"
       onClick={onCloseReview}
      >
       Đóng ôn
      </Button>
     )}
     <Button
      type="button"
      size="sm"
      disabled={selectedLessonIds.length === 0}
      onClick={onStartReview}
     >
      <RotateCcw className="h-4 w-4" />
      {kind === "vocab" ? "Ôn từ vựng" : "Ôn ngữ pháp"}
     </Button>
    </div>
   </div>
  </TooltipProvider>
 );
}

function VocabAggregateRow({ item }: { item: AggregateVocabItem }) {
 return (
  <Link
   href={buildHanziHomeLessonHref({
    courseId: item.courseId,
    lessonNumber: item.lessonNumber,
    module: "vocab",
   })}
   className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3 transition-colors hover:border-border-hover hover:bg-bg-elevated sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
  >
   <div className="min-w-0">
    <p className="font-hanzi text-2xl font-black leading-none text-text-primary">
     {item.word}
    </p>
    <p className="truncate text-xs font-black text-text-muted">{item.pinyin}</p>
   </div>

   <p className="min-w-0 text-sm font-bold text-text-secondary">
    <span className="font-black text-text-primary">{item.hanViet}</span>
    <span className="text-text-muted"> · </span>
    {item.meaning}
   </p>

   <span className="w-fit rounded-full bg-bg-card px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-wide text-text-muted">
    {item.category}
   </span>
  </Link>
 );
}

function GrammarAggregateRow({ item }: { item: AggregateGrammarItem }) {
 return (
  <Link
   href={buildHanziHomeLessonHref({
    courseId: item.courseId,
    lessonNumber: item.lessonNumber,
    module: "grammar",
   })}
   className="grid gap-1 rounded-xl border border-border-default bg-bg-subtle p-3 transition-colors hover:border-border-hover hover:bg-bg-elevated"
  >
   <h3 className="line-clamp-1 text-sm font-black text-text-primary sm:text-base">
    {item.cleanTitle || item.title}
   </h3>
   <p className="line-clamp-2 text-sm font-bold text-text-secondary">
    {item.core}
   </p>
  </Link>
 );
}

function formatLessonHeading(lessonNumber: number, lessonTitle: string) {
 const trimmedTitle = lessonTitle.trim();

 if (/^Bài\s+\d+[:：]/i.test(trimmedTitle)) {
  return trimmedTitle;
 }

 return `Bài ${lessonNumber}: ${trimmedTitle}`;
}

function formatSelectedLessonsLabel(
 lessons: Array<{
  lessonNumber: number;
  title: string;
  titleZh: string;
 }>,
) {
 if (lessons.length === 0) return "";
 if (lessons.length === 1) {
  return formatLessonHeading(
   lessons[0].lessonNumber,
   lessons[0].titleZh || lessons[0].title,
  );
 }

 return `${lessons.length} bài đang ôn`;
}

function combineReviewLessons(
 lessons: HanziHomeLesson[],
 kind: AggregateKind,
): HanziHomeLesson {
 const firstLesson = lessons[0];

 return {
  ...firstLesson,
  id: lessons.map((lesson) => lesson.id).join("__"),
  title:
   lessons.length === 1 ? firstLesson.title : `${lessons.length} bài đã chọn`,
  titleZh:
   lessons.length === 1 ? firstLesson.titleZh : `${lessons.length} bài đã chọn`,
  vocab: kind === "vocab" ? lessons.flatMap((lesson) => lesson.vocab) : [],
  grammar:
   kind === "grammar" ? lessons.flatMap((lesson) => lesson.grammar) : [],
  vocabIds:
   kind === "vocab" ? lessons.flatMap((lesson) => lesson.vocabIds) : [],
  grammarPointIds:
   kind === "grammar"
    ? lessons.flatMap((lesson) => lesson.grammarPointIds)
    : [],
 };
}

function isAggregateVocabItem(
 item: AggregateResourceItem,
): item is AggregateVocabItem {
 return "word" in item;
}

function groupByLesson(items: AggregateResourceItem[]) {
 const groups = new Map<
  string,
  {
   lessonId: string;
   courseId: string;
   lessonNumber: number;
   lessonOrder: number;
   lessonTitle: string;
   items: AggregateResourceItem[];
  }
 >();

 for (const item of items) {
  const current = groups.get(item.lessonId);

  if (current) {
   current.items.push(item);
  } else {
   groups.set(item.lessonId, {
    lessonId: item.lessonId,
    courseId: item.courseId,
    lessonNumber: item.lessonNumber,
    lessonOrder: item.lessonOrder,
    lessonTitle: item.lessonTitle,
    items: [item],
   });
  }
 }

 return Array.from(groups.values()).sort(
  (a, b) => a.lessonOrder - b.lessonOrder || a.lessonNumber - b.lessonNumber,
 );
}
