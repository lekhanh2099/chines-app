"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Search } from "lucide-react";
import { z } from "zod";

import { Card } from "@/components/ui/card";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";

type AggregateKind = "vocab" | "grammar";

const aggregateVocabItemSchema = z.object({
 id: z.string(),
 courseId: z.string(),
 bookId: z.string(),
 lessonId: z.string(),
 lessonNumber: z.number(),
 lessonOrder: z.number(),
 lessonTitle: z.string(),
 word: z.string(),
 pinyin: z.string(),
 hanViet: z.string(),
 meaning: z.string(),
 category: z.string(),
 level: z.string().nullable().optional(),
 pos: z
  .object({
   vi: z.string().nullable().optional(),
   zh: z.string().nullable().optional(),
  })
  .nullable()
  .optional(),
});

const aggregateGrammarItemSchema = z.object({
 id: z.string(),
 courseId: z.string(),
 bookId: z.string(),
 lessonId: z.string(),
 lessonNumber: z.number(),
 lessonOrder: z.number(),
 lessonTitle: z.string(),
 title: z.string(),
 cleanTitle: z.string(),
 core: z.string(),
});

type AggregateVocabItem = z.infer<typeof aggregateVocabItemSchema>;
type AggregateGrammarItem = z.infer<typeof aggregateGrammarItemSchema>;

const vocabResponseSchema = z.object({
 items: z.array(aggregateVocabItemSchema),
});

const grammarResponseSchema = z.object({
 items: z.array(aggregateGrammarItemSchema),
});

type AggregateFilters = {
 courseId: string;
 bookId: string;
 lessonId: string;
 q: string;
};

async function fetchAggregateData({
 kind,
 filters,
}: {
 kind: AggregateKind;
 filters: AggregateFilters;
}) {
 const params = new URLSearchParams();

 if (filters.courseId) params.set("courseId", filters.courseId);
 if (filters.bookId) params.set("bookId", filters.bookId);
 if (filters.lessonId) params.set("lessonId", filters.lessonId);
 if (filters.q.trim()) params.set("q", filters.q.trim());

 const response = await fetch(
  `/api/hanzihome/${kind}${params.size > 0 ? `?${params.toString()}` : ""}`,
  {
   method: "GET",
   cache: "no-store",
   headers: {
    Accept: "application/json",
   },
  },
 );

 if (!response.ok) {
  throw new Error(
   kind === "vocab" ? "Không tải được từ vựng" : "Không tải được ngữ pháp",
  );
 }

 const json: unknown = await response.json();

 return kind === "vocab"
  ? vocabResponseSchema.parse(json).items
  : grammarResponseSchema.parse(json).items;
}

export function HanziHomeAggregateLibrary({ kind }: { kind: AggregateKind }) {
 const catalog = useHanziHomeCatalogData({ includeLessons: true });
 const [filters, setFilters] = useState<AggregateFilters>({
  courseId: "",
  bookId: "",
  lessonId: "",
  q: "",
 });

 const title = kind === "vocab" ? "Tổng hợp từ vựng" : "Tổng hợp ngữ pháp";
 const description =
  kind === "vocab"
   ? "Tra toàn bộ từ vựng theo course, bài học, pinyin và nghĩa."
   : "Tra toàn bộ điểm ngữ pháp theo course, bài học và nội dung cốt lõi.";
 const Icon = kind === "vocab" ? BookOpen : GraduationCap;

 const filteredBooks = useMemo(
  () =>
   filters.courseId
    ? catalog.books.filter((book) => book.courseId === filters.courseId)
    : catalog.books,
  [catalog.books, filters.courseId],
 );

 const filteredLessons = useMemo(
  () =>
   catalog.lessons.filter((lesson) => {
    if (filters.courseId && lesson.courseId !== filters.courseId) return false;
    if (filters.bookId && lesson.bookId !== filters.bookId) return false;
    return true;
   }),
  [catalog.lessons, filters.bookId, filters.courseId],
 );

 const query = useQuery({
  queryKey: ["hanzihome", `aggregate-${kind}`, filters],
  queryFn: () => fetchAggregateData({ kind, filters }),
  staleTime: 0,
 });

 const items = query.data ?? [];
 const groupedItems = useMemo(() => groupByLesson(items), [items]);

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

 return (
  <main className="hanzihome-static-page">
   <div className="grid gap-3">
    <Card className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
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
       options={catalog.courses.map((course) => ({
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
      {query.isLoading && (
       <p className="rounded-xl bg-bg-subtle p-4 text-sm font-bold text-text-muted">
        Đang tải dữ liệu tổng hợp...
       </p>
      )}

      {query.isError && (
       <p
        role="alert"
        className="rounded-xl bg-danger-subtle p-4 text-sm font-bold text-danger-text"
       >
        {(query.error as Error).message}
       </p>
      )}

      {!query.isLoading && !query.isError && groupedItems.length === 0 && (
       <p className="rounded-xl bg-bg-subtle p-4 text-sm font-bold text-text-muted">
        Không tìm thấy mục phù hợp.
       </p>
      )}

      {groupedItems.map((group) => (
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
           href={`/hanzihome?courseId=${group.courseId}&lessonId=${group.lessonId}&module=${kind === "vocab" ? "vocab" : "grammar"}`}
           className="rounded-xl border border-border-default bg-bg-subtle px-3 py-1.5 text-xs font-black text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
           Mở bài
          </Link>
          <Link
           href={`/hanzihome?courseId=${group.courseId}&lessonId=${group.lessonId}&module=review`}
           className="rounded-xl border border-border-default bg-bg-subtle px-3 py-1.5 text-xs font-black text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
           Ôn bài
          </Link>
         </div>
        </div>

        <div className="grid gap-2">
         {group.items.map((item) =>
          kind === "vocab" ? (
           <VocabAggregateRow key={item.id} item={item as AggregateVocabItem} />
          ) : (
           <GrammarAggregateRow
            key={item.id}
            item={item as AggregateGrammarItem}
           />
          ),
         )}
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

function VocabAggregateRow({ item }: { item: AggregateVocabItem }) {
 return (
  <Link
   href={`/hanzihome?courseId=${item.courseId}&lessonId=${item.lessonId}&module=vocab`}
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
   href={`/hanzihome?courseId=${item.courseId}&lessonId=${item.lessonId}&module=grammar`}
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

function groupByLesson(items: Array<AggregateVocabItem | AggregateGrammarItem>) {
 const groups = new Map<
  string,
  {
   lessonId: string;
   courseId: string;
   lessonNumber: number;
   lessonOrder: number;
   lessonTitle: string;
   items: Array<AggregateVocabItem | AggregateGrammarItem>;
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
