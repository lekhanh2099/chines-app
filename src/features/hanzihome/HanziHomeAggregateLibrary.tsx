"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
 BookOpen,
 ChevronLeft,
 ChevronRight,
 GraduationCap,
 Search,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { VocabReviewPanel } from "@/features/hanzihome/components/VocabReviewPanel";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { EditSeedLessonAsDraftButton } from "@/features/hanzihome/lesson-drafts";
import type { HanziHomeLesson, ReviewResult } from "@/features/hanzihome/types";
import { cn } from "@/lib/utils";

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

const ALL_FILTER_VALUE = "__all";

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
  throw new Error(kind === "vocab" ? "Không tải được từ vựng" : "Không tải được ngữ pháp");
 }

 const json: unknown = await response.json();

 return kind === "vocab"
  ? vocabResponseSchema.parse(json).items
  : grammarResponseSchema.parse(json).items;
}

export function HanziHomeAggregateLibrary({ kind }: { kind: AggregateKind }) {
 const searchParams = useSearchParams();
 const catalog = useHanziHomeCatalogData({ includeLessons: true });
 const learning = useLearningState();
 const [filters, setFilters] = useState<AggregateFilters>({
  courseId: searchParams.get("courseId") ?? "",
  bookId: searchParams.get("bookId") ?? "",
  lessonId: searchParams.get("lessonId") ?? "",
  q: searchParams.get("q") ?? "",
 });
 const [filtersCollapsed, setFiltersCollapsed] = useState(false);
 const [flashcardOpen, setFlashcardOpen] = useState(false);
 const isReviewingVocab = kind === "vocab" && flashcardOpen;

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

 const items = useMemo(() => query.data ?? [], [query.data]);
 const vocabItems = useMemo(() => items.filter(isVocabItem), [items]);
 const groupedItems = useMemo(() => groupByLesson(items), [items]);
 const aggregateReviewLesson = useMemo(
  () => buildAggregateVocabReviewLesson(vocabItems, filters),
  [filters, vocabItems],
 );

 const updateFilter = (key: keyof AggregateFilters, value: string) => {
  setFlashcardOpen(false);
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

 const startFlashcards = () => {
  setFlashcardOpen(true);
 };

 const clearFilters = () => {
  setFlashcardOpen(false);
  setFilters({
   courseId: "",
   bookId: "",
   lessonId: "",
   q: "",
  });
 };

 const answerAggregateReview = (
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
   <div className="grid gap-3">
    {!isReviewingVocab && (
     <Card className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
         <Icon className="h-5 w-5" />
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

       <div className="flex flex-wrap items-center justify-end gap-2">
        {kind === "vocab" && (
         <Button
          type="button"
          variant="outline"
          disabled={vocabItems.length === 0}
          onClick={startFlashcards}
         >
          Flashcard
         </Button>
        )}

        <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
         {items.length} mục
        </span>
       </div>
      </div>
     </Card>
    )}

    <div
     className={[
      "grid min-w-0 gap-3",
      isReviewingVocab
       ? "lg:grid-cols-1"
       : filtersCollapsed
       ? "lg:grid-cols-[3.5rem_minmax(0,1fr)]"
       : "lg:grid-cols-[18rem_minmax(0,1fr)]",
     ].join(" ")}
    >
     {!isReviewingVocab && (
     <Card className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
      <div className="grid gap-3">
      <Button
       type="button"
       variant="outline"
       size="icon"
       onClick={() => setFiltersCollapsed((current) => !current)}
       className="h-9 w-full rounded-xl bg-bg-subtle text-text-muted hover:bg-bg-elevated hover:text-text-primary"
       aria-label={filtersCollapsed ? "Mở bộ lọc" : "Ẩn bộ lọc"}
       title={filtersCollapsed ? "Mở bộ lọc" : "Ẩn bộ lọc"}
      >
       {filtersCollapsed ? (
         <ChevronRight className="h-4 w-4" />
        ) : (
         <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

       {filtersCollapsed ? (
        <div className="grid place-items-center gap-2 py-2">
         <Search className="h-4 w-4 text-text-muted" />
         <span className="[writing-mode:vertical-rl] text-xs font-black uppercase tracking-wide text-text-muted">
          Bộ lọc
         </span>
        </div>
       ) : (
        <>
       <div className="grid gap-1">
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         Bộ lọc
        </p>
        <h2 className="text-lg font-black text-text-primary">Tìm nhanh</h2>
       </div>

       <label className="grid gap-1.5">
        <span className="text-xs font-black uppercase tracking-wide text-text-muted">
         Từ khóa
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-border-default bg-bg-input px-3 py-2">
         <Search className="h-4 w-4 text-text-muted" />
         <input
          value={filters.q}
          onChange={(event) => updateFilter("q", event.target.value)}
          placeholder={kind === "vocab" ? "Hán tự, pinyin, nghĩa..." : "Tiêu đề, cấu trúc..."}
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

       <Button
        type="button"
        variant="outline"
        onClick={clearFilters}
       >
        Xóa bộ lọc
       </Button>
       </>
       )}
      </div>
     </Card>
     )}

     <Card className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
      <div className="grid gap-3">
       {query.isLoading && (
        <p className="rounded-xl bg-bg-subtle p-4 text-sm font-bold text-text-muted">
         Đang tải dữ liệu tổng hợp...
        </p>
       )}

       {query.isError && (
        <p role="alert" className="rounded-xl bg-danger-subtle p-4 text-sm font-bold text-danger-text">
         {(query.error as Error).message}
        </p>
       )}

       {!query.isLoading && !query.isError && groupedItems.length === 0 && (
        <p className="rounded-xl bg-bg-subtle p-4 text-sm font-bold text-text-muted">
         Không tìm thấy mục phù hợp.
        </p>
       )}

       {isReviewingVocab && (
        <section className="grid gap-2 rounded-xl border border-border-default bg-bg-card p-3 shadow-theme-sm">
         <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
           <h2 className="text-sm font-black text-text-primary">
            Flashcard từ vựng
           </h2>
           <p className="text-xs font-bold text-text-muted">
            Deck đang dùng đúng kết quả lọc hiện tại.
           </p>
          </div>

          <Button
           type="button"
           variant="outline"
           size="sm"
           onClick={() => setFlashcardOpen(false)}
          >
           Đóng
          </Button>
         </div>

         <VocabReviewPanel
          lesson={aggregateReviewLesson}
          learningState={learning.state}
          onAnswer={answerAggregateReview}
         />
       </section>
       )}

       {!isReviewingVocab && groupedItems.map((group) => (
        <section key={group.lessonId} className="grid gap-2">
         <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
           <h2 className="text-sm font-black text-text-primary">
            {formatLessonTitle(group)}
           </h2>
           <p className="text-xs font-bold text-text-muted">{group.items.length} mục</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
           <EditSeedLessonAsDraftButton lessonId={group.lessonId} size="xs" />

           <Button asChild variant="outline" size="xs">
            <Link
             href={`/hanzihome?courseId=${group.courseId}&lessonId=${group.lessonId}&module=${kind === "vocab" ? "vocab" : "grammar"}`}
            >
             Mở bài
            </Link>
           </Button>
          </div>
         </div>

         {kind === "vocab" ? (
          <VocabAggregateBoard items={group.items.filter(isVocabItem)} />
         ) : (
          <div className="grid gap-2">
           {group.items.filter(isGrammarItem).map((item) => (
            <GrammarAggregateRow key={item.id} item={item} />
           ))}
          </div>
         )}
        </section>
       ))}
      </div>
     </Card>
    </div>
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
 const selectedValue = value || ALL_FILTER_VALUE;

 return (
  <label className="grid gap-1.5">
   <span className="text-xs font-black uppercase tracking-wide text-text-muted">
    {label}
   </span>
   <Select
    value={selectedValue}
    onValueChange={(nextValue) => {
     onChange(nextValue === ALL_FILTER_VALUE ? "" : nextValue);
    }}
   >
    <SelectTrigger className="h-10 w-full rounded-xl border-border-default bg-bg-input text-sm font-bold text-text-primary">
     <SelectValue placeholder="Tất cả" />
    </SelectTrigger>
    <SelectContent align="start" position="popper">
     <SelectItem value={ALL_FILTER_VALUE}>Tất cả</SelectItem>
     {options.map((option) => (
      <SelectItem key={option.value} value={option.value}>
       {option.label}
      </SelectItem>
     ))}
    </SelectContent>
   </Select>
  </label>
 );
}

function isVocabItem(
 item: AggregateVocabItem | AggregateGrammarItem,
): item is AggregateVocabItem {
 return "word" in item;
}

function isGrammarItem(
 item: AggregateVocabItem | AggregateGrammarItem,
): item is AggregateGrammarItem {
 return "cleanTitle" in item;
}

function VocabAggregateBoard({ items }: { items: AggregateVocabItem[] }) {
 const groups = groupVocabByCategory(items);

 return (
  <div className="rounded-xl border border-border bg-card p-3 shadow-theme-sm">
   <div className="flex flex-wrap items-center gap-x-7 gap-y-3 rounded-lg bg-muted/50 px-4 py-3 ring-1 ring-border/80">
    {groups.map((group) => (
     <div
      key={group.category}
      className="contents"
     >
      {group.headingItem ? (
       <Link
        href={`/hanzihome?courseId=${group.headingItem.courseId}&lessonId=${group.headingItem.lessonId}&module=vocab`}
        className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3 font-hanzi text-lg font-black text-primary-foreground shadow-theme-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-xl"
        title={[
         group.headingItem.pinyin,
         group.headingItem.hanViet,
         group.headingItem.meaning,
        ]
         .filter(Boolean)
         .join(" · ")}
        lang="zh-CN"
       >
       {group.headingItem.word}
       </Link>
      ) : (
       <span className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3 text-sm font-black text-primary-foreground shadow-theme-sm">
        {group.category}
       </span>
      )}

      {group.items.map((item) => {
       const isNoteText = isBoardNoteText(item.word);

       return (
        <Link
         key={item.id}
         href={`/hanzihome?courseId=${item.courseId}&lessonId=${item.lessonId}&module=vocab`}
         className={cn(
          "inline-flex min-h-9 items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isNoteText
           ? "basis-full px-0 py-1 font-sans text-base font-bold leading-relaxed text-foreground sm:text-lg"
           : "px-1 font-hanzi text-lg font-black text-foreground/80 hover:bg-accent hover:text-accent-foreground sm:text-xl",
         )}
         title={[item.pinyin, item.hanViet, item.meaning]
          .filter(Boolean)
          .join(" · ")}
         lang={isNoteText ? undefined : "zh-CN"}
        >
         {item.word}
        </Link>
       );
      })}
     </div>
    ))}
   </div>
  </div>
 );
}

function isBoardNoteText(value: string) {
 return value.trim().length > 18 || /\s/.test(value);
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
   <p className="line-clamp-2 text-sm font-bold text-text-secondary">{item.core}</p>
  </Link>
 );
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

function groupVocabByCategory(items: AggregateVocabItem[]) {
 const groups = new Map<string, AggregateVocabItem[]>();

 for (const item of items) {
  const key = item.category || "Từ vựng";
  const current = groups.get(key);

  if (current) {
   current.push(item);
  } else {
   groups.set(key, [item]);
  }
 }

 return Array.from(groups, ([category, groupItems]) => {
  const shouldPromoteFirstWord = category === "Khác" && groupItems.length > 0;

  return {
   category,
   headingItem: shouldPromoteFirstWord ? groupItems[0] : undefined,
   items: shouldPromoteFirstWord ? groupItems.slice(1) : groupItems,
  };
 });
}

function buildAggregateVocabReviewLesson(
 items: AggregateVocabItem[],
 filters: AggregateFilters,
): HanziHomeLesson {
 const firstItem = items[0];
 const lessonId = filters.lessonId || "aggregate-vocab";
 const title = filters.lessonId && firstItem
  ? `Bài ${firstItem.lessonNumber}: ${firstItem.lessonTitle}`
  : "Tổng hợp từ vựng";

 return {
  id: lessonId,
  lessonNumber: firstItem?.lessonNumber ?? 1,
  titleZh: firstItem?.lessonTitle ?? "Tổng hợp từ vựng",
  title,
  courseId: filters.courseId || firstItem?.courseId,
  bookId: filters.bookId || firstItem?.bookId,
  lessonOrder: firstItem?.lessonOrder,
  vocabIds: items.map((item) => item.id),
  grammarPointIds: [],
  vocab: items.map((item) => ({
   id: item.id,
   lessonId: item.lessonId,
   word: item.word,
   pinyin: item.pinyin,
   hanViet: item.hanViet,
   meaning: item.meaning,
   category: item.category,
   level: item.level ?? undefined,
   pos:
    item.pos?.vi || item.pos?.zh
     ? {
        vi: item.pos.vi ?? undefined,
        zh: item.pos.zh ?? undefined,
       }
     : undefined,
   examplesParsed: [],
   detailSections: [
    {
     key: "meaning",
     title: "Nghĩa",
     lines: [[item.hanViet, item.meaning].filter(Boolean).join(" · ")],
    },
    {
     key: "lesson",
     title: "Bài học",
     lines: [`Bài ${item.lessonNumber}: ${item.lessonTitle}`],
    },
   ],
  })),
  grammar: [],
 };
}

function formatLessonTitle({
 lessonNumber,
 lessonTitle,
}: {
 lessonNumber: number;
 lessonTitle: string;
}) {
 return lessonTitle.trim().startsWith(`Bài ${lessonNumber}:`)
  ? lessonTitle
  : `Bài ${lessonNumber}: ${lessonTitle}`;
}
