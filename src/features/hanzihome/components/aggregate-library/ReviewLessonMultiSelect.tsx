import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
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
   <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
     <StudyInstructionText
      variant="overline"
      tone="muted"
      weight="black"
      tracking="wide"
      transform="uppercase"
     >
      Chọn bài để ôn
     </StudyInstructionText>
     <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
      {kind === "vocab" ? "Ôn từ vựng theo bài" : "Ôn ngữ pháp theo bài"}
     </Typography>
    </div>

    <div className="flex min-w-0 w-full flex-wrap items-center gap-1.5 sm:w-auto sm:shrink-0">
     <StudyInstructionText
      variant="caption"
      tone="muted"
      weight="black"
      className="rounded-full bg-bg-subtle px-3 py-1"
     >
      {selectedCount} bài
     </StudyInstructionText>

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
       className={["h-4 w-4 transition-transform", isPickerOpen ? "rotate-180" : ""].join(" ")}
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
     <StudyInstructionText
      variant="overline"
      tone="muted"
      weight="black"
      tracking="wide"
      transform="uppercase"
     >
      Đã chọn
     </StudyInstructionText>

     {selectedLessons.slice(0, 6).map((lesson) => (
      <Button
       key={lesson.id}
       type="button"
       variant="surfaceCard"
       onClick={() => onToggleLesson(lesson.id)}

       title={`Bỏ ${formatLessonHeading(lesson.lessonNumber, lesson.titleZh || lesson.title)}`}
      >
       <span>{formatLessonHeading(lesson.lessonNumber, lesson.titleZh || lesson.title)}</span>
       <X data-icon="inline-end" />
      </Button>
     ))}

     {selectedLessons.length > 6 && (
      <StudyInstructionText
       variant="caption"
       tone="muted"
       weight="black"
       className="rounded-full bg-bg-subtle px-3 py-1.5"
      >
       +{selectedLessons.length - 6} bài nữa
      </StudyInstructionText>
     )}

     <Button type="button" variant="ghost" onClick={clearSelectedLessons}>
      Xóa hết
     </Button>
    </div>
   )}

   {selectedLessons.length === 0 && (
    <StudyInstructionText
     variant="label"
     tone="muted"
     weight="bold"
     className="rounded-xl border border-dashed border-border-default bg-bg-subtle px-3 py-2"
    >
     Chưa chọn bài. Bấm “Chọn bài” để tìm nhanh theo số bài hoặc tên bài.
    </StudyInstructionText>
   )}

   {isPickerOpen && (
    <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-2">
     <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <Input
       value={query}
       onChange={(event) => setQuery(event.target.value)}
       aria-label="Tìm bài để ôn"
       placeholder="Tìm bài, ví dụ: Bài 10..."
       surface="field"
       adornment="start"
       className="w-full"
      />
     </div>

     <div className="grid max-h-56 gap-1.5 overflow-y-auto scrollbar-soft sm:grid-cols-2 xl:grid-cols-3">
      {filteredLessons.length > 0 ? (
       filteredLessons.map((lesson) => {
        const selected = selectedLessonIdSet.has(lesson.id);
        const title = formatLessonHeading(lesson.lessonNumber, lesson.titleZh || lesson.title);

        return (
         <Button
          key={lesson.id}
          type="button"
          variant={selected ? "active" : "surfaceCard"}
          onClick={() => onToggleLesson(lesson.id)}
          align="start"
         >
          <span
           className={[
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-accent bg-accent text-white" : "border-border-default bg-bg-primary",
           ].join(" ")}
          >
           {selected && <Check className="h-3.5 w-3.5" />}
          </span>
          <StudyInstructionText as="span" clamp="one" className="min-w-0">
           {title}
          </StudyInstructionText>
         </Button>
        );
       })
      ) : (
       <StudyInstructionText
        variant="label"
        tone="muted"
        weight="bold"
        className="col-span-full px-2 py-4"
       >
        Không tìm thấy bài phù hợp.
       </StudyInstructionText>
      )}
     </div>
    </div>
   )}
  </section>
 );
}
