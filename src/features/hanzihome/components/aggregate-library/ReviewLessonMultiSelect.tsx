import { useMemo, useState } from "react";
import { Check, ChevronDown, RotateCcw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AggregateKind } from "./aggregate-utils";
import { formatLessonHeading } from "./aggregate-utils";

type ReviewLessonOption = {
 id: string;
 lessonNumber: number;
 title: string;
 titleZh: string;
};

export function ReviewLessonMultiSelect({
 kind,
 selectedLessonIds,
 lessons,
 activeLessonTitle,
 onToggleLesson,
 onChangeLessons,
 onStartReview,
 onCloseReview,
}: {
 kind: AggregateKind;
 selectedLessonIds: string[];
 lessons: ReviewLessonOption[];
 activeLessonTitle: string;
 onToggleLesson: (lessonId: string) => void;
 onChangeLessons?: (lessonIds: string[]) => void;
 onStartReview: () => void;
 onCloseReview: () => void;
}) {
 const [query, setQuery] = useState("");
 const [isPickerOpen, setIsPickerOpen] = useState(false);
 const normalizedQuery = query.trim().toLowerCase();

 const selectedLessonIdSet = useMemo(() => new Set(selectedLessonIds), [selectedLessonIds]);

 const filteredLessons = useMemo(() => {
  if (!normalizedQuery) return lessons;

  return lessons.filter((lesson) => {
   const heading = formatLessonHeading(lesson.lessonNumber, lesson.titleZh || lesson.title);
   const searchableText = [
    heading,
    lesson.title,
    lesson.titleZh,
    String(lesson.lessonNumber),
    `bài ${lesson.lessonNumber}`,
   ]
    .join(" ")
    .toLowerCase();

   return searchableText.includes(normalizedQuery);
  });
 }, [lessons, normalizedQuery]);

 const selectedLessons = lessons.filter((lesson) => selectedLessonIdSet.has(lesson.id));
 const selectedCount = selectedLessons.length;
 const canStartReview = selectedCount > 0;

 const clearSelectedLessons = () => {
  if (onChangeLessons) {
   onChangeLessons([]);
   return;
  }

  for (const lessonId of selectedLessonIds) {
   onToggleLesson(lessonId);
  }
 };

 return (
  <section className="grid gap-2.5">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="min-w-0">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">Chọn bài để ôn</p>
     <h2 className="text-base font-black text-text-primary">
      {kind === "vocab" ? "Ôn từ vựng theo bài" : "Ôn ngữ pháp theo bài"}
     </h2>
    </div>

    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
     <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
      {selectedCount} bài
     </span>

     {activeLessonTitle && (
      <Button type="button" size="sm" variant="outline" onClick={onCloseReview}>
       Đóng ôn
      </Button>
     )}

     <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => setIsPickerOpen((current) => !current)}
      aria-expanded={isPickerOpen}
     >
      Chọn bài
      <ChevronDown
       className={[
        "h-4 w-4 transition-transform",
        isPickerOpen ? "rotate-180" : "",
       ].join(" ")}
      />
     </Button>

     <Button type="button" size="sm" disabled={!canStartReview} onClick={onStartReview}>
      <RotateCcw className="h-4 w-4" />
      {kind === "vocab" ? "Bắt đầu ôn" : "Bắt đầu ôn"}
     </Button>
    </div>
   </div>

   {selectedLessons.length > 0 && (
    <div className="flex flex-wrap items-center gap-2">
     <span className="text-xs font-black uppercase tracking-wide text-text-muted">Đã chọn</span>

     {selectedLessons.slice(0, 6).map((lesson) => (
      <button
       key={lesson.id}
       type="button"
       onClick={() => onToggleLesson(lesson.id)}
       className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-card px-3 py-1.5 text-xs font-black text-text-primary transition-colors hover:bg-bg-elevated"
       title={`Bỏ ${formatLessonHeading(lesson.lessonNumber, lesson.titleZh || lesson.title)}`}
      >
       <span>{formatLessonHeading(lesson.lessonNumber, lesson.titleZh || lesson.title)}</span>
       <X className="h-3.5 w-3.5 text-text-muted" />
      </button>
     ))}

     {selectedLessons.length > 6 && (
      <span className="rounded-full bg-bg-subtle px-3 py-1.5 text-xs font-black text-text-muted">
       +{selectedLessons.length - 6} bài nữa
      </span>
     )}

     <button
      type="button"
      onClick={clearSelectedLessons}
      className="rounded-full px-2 py-1 text-xs font-black text-text-muted transition-colors hover:text-text-primary"
     >
     Xóa hết
     </button>
    </div>
   )}

   {selectedLessons.length === 0 && (
    <p className="rounded-xl border border-dashed border-border-default bg-bg-subtle px-3 py-2 text-sm font-bold text-text-muted">
     Chưa chọn bài. Bấm “Chọn bài” để tìm nhanh theo số bài hoặc tên bài.
    </p>
   )}

   {isPickerOpen && (
    <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-2">
     <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
       value={query}
       onChange={(event) => setQuery(event.target.value)}
       placeholder="Tìm bài, ví dụ: Bài 10..."
       className="h-10 w-full rounded-xl border border-border-default bg-bg-input pl-9 pr-3 text-sm font-bold text-text-primary outline-none transition-colors focus:border-accent"
      />
     </div>

     <div className="grid max-h-56 gap-1.5 overflow-y-auto scrollbar-soft sm:grid-cols-2 xl:grid-cols-3">
      {filteredLessons.length > 0 ? (
       filteredLessons.map((lesson) => {
        const selected = selectedLessonIdSet.has(lesson.id);
        const title = formatLessonHeading(lesson.lessonNumber, lesson.titleZh || lesson.title);

        return (
         <button
          key={lesson.id}
          type="button"
          onClick={() => onToggleLesson(lesson.id)}
          className={[
           "flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-black transition-colors",
           selected
            ? "border-accent bg-accent-subtle text-accent-text"
            : "border-border-default bg-bg-card text-text-primary hover:border-accent hover:bg-bg-elevated",
          ].join(" ")}
         >
          <span
           className={[
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-accent bg-accent text-white" : "border-border-default bg-bg-primary",
           ].join(" ")}
          >
           {selected && <Check className="h-3.5 w-3.5" />}
          </span>
          <span className="min-w-0 truncate">{title}</span>
         </button>
        );
       })
      ) : (
       <p className="col-span-full px-2 py-4 text-sm font-bold text-text-muted">
        Không tìm thấy bài phù hợp.
       </p>
      )}
     </div>
    </div>
   )}
  </section>
 );
}
