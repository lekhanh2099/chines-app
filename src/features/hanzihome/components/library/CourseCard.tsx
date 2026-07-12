"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookMarked } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Select from "@/components/ui/select/index";
import { useHanziHomeCourseLessons } from "@/features/hanzihome/hooks/useHanziHomeCourseLessons";
import type { HanziHomeCatalogCourse, HanziHomeCourseBook } from "@/features/hanzihome/types";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import { IOption } from "@/types/option";

import { BookCrudActions } from "./BookCrudActions";
import { LessonCrudActions } from "./LessonCrudActions";
import { MiniMetric } from "./MiniMetric";

export function CourseCard({
 course,
 book,
 editMode = false,
 canMoveBookUp = false,
 canMoveBookDown = false,
}: {
 course: HanziHomeCatalogCourse;
 book: HanziHomeCourseBook;
 editMode?: boolean;
 canMoveBookUp?: boolean;
 canMoveBookDown?: boolean;
}) {
 const { lessons: courseLessons, isLoading: areLessonsLoading } = useHanziHomeCourseLessons(
  course.id,
 );
 const bookLessons = useMemo(
  () => courseLessons.filter((lesson) => lesson.bookId === book.id),
  [book.id, courseLessons],
 );
 const [selectedLessonId, setSelectedLessonId] = useState("");

 const effectiveLesson = useMemo(() => {
  const selectedExists = bookLessons.some((lesson) => lesson.id === selectedLessonId);
  const effectiveLessonId = (selectedExists ? selectedLessonId : null) || bookLessons[0]?.id || "";

  return bookLessons.find((lesson) => lesson.id === effectiveLessonId) ?? null;
 }, [bookLessons, selectedLessonId]);

 const effectiveLessonId = effectiveLesson?.id ?? "";
 const href = buildHanziHomeLessonHref({
  courseId: course.id,
  bookId: book.id,
  lessonNumber: effectiveLesson?.lessonNumber,
 });

 const visibleLessonCount = bookLessons.length;
 const visibleVocabCount = bookLessons.reduce(
  (sum, lesson) => sum + (lesson.vocabCount ?? lesson.vocabIds.length),
  0,
 );
 const visibleGrammarCount = bookLessons.reduce(
  (sum, lesson) => sum + (lesson.grammarCount ?? lesson.grammarPointIds.length),
  0,
 );

 const courseLessonOptions: IOption[] = bookLessons.map((lesson) => ({
  value: lesson.id,
  label: `Bài ${lesson.lessonNumber}: ${lesson.titleZh || lesson.title}`,
 }));

 const selectedOption =
  courseLessonOptions.find((option) => option.value === effectiveLessonId) || null;

 return (
  <Card
   variant="section"
   padding="none"
   className="group flex min-w-0 flex-col gap-2.5 rounded-xl p-3 transition-colors hover:border-primary/25 hover:bg-bg-elevated sm:p-4"
  >
   <div className="flex min-w-0 items-start gap-2.5">
    <div className="flex min-w-0 gap-2.5">
     <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-text">
      <BookMarked className="size-4" />
     </span>

     <div className="min-w-0 flex-1 grid gap-1">
      <div className="flex flex-wrap items-center gap-2">
       <Badge variant="purple">Quyển</Badge>
       {editMode ? (
        <BookCrudActions book={book} canMoveUp={canMoveBookUp} canMoveDown={canMoveBookDown} />
       ) : null}
      </div>

      <h4 className="line-clamp-2 text-lg font-black leading-snug text-text-primary">
       {book.shortTitle || book.title}
      </h4>

      {book.shortTitle && book.shortTitle !== book.title && !book.title.startsWith(course.title) ? (
       <p className="line-clamp-1 text-sm font-medium leading-5 text-text-muted">{book.title}</p>
      ) : null}
     </div>
    </div>
   </div>

   {areLessonsLoading ? (
    <div className="flex animate-pulse gap-2">
     <div className="h-10 w-20 rounded-xl bg-bg-subtle" />
     <div className="h-10 w-20 rounded-xl bg-bg-subtle" />
     <div className="h-10 w-24 rounded-xl bg-bg-subtle" />
    </div>
   ) : (
    <div className="grid grid-cols-3 gap-2">
     <MiniMetric label="Bài" value={visibleLessonCount} />
     <MiniMetric label="Từ" value={visibleVocabCount} />
     <MiniMetric label="Ngữ pháp" value={visibleGrammarCount} />
    </div>
   )}

   <div className="grid gap-1.5 rounded-xl border border-border-default bg-bg-subtle p-2">
    {areLessonsLoading ? (
     <div className="grid animate-pulse gap-1.5">
      <div className="h-3 w-20 rounded-full bg-bg-subtle" />
      <div className="h-11 w-full rounded-xl bg-bg-subtle" />
     </div>
    ) : bookLessons.length > 0 ? (
     <div className="grid gap-1">
      <span className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">
       Chọn bài để học
      </span>

      <div className="flex min-w-0 items-center gap-2">
       <div className="min-w-0 flex-1">
        <Select
         options={courseLessonOptions}
         selectValue={selectedOption}
         triggerAriaLabel={`Chọn bài trong ${book.shortTitle || book.title}`}
         triggerPlaceholder="Chọn bài"
         onChange={(option: IOption | null) => {
          if (option?.value) setSelectedLessonId(String(option.value));
         }}
        />
       </div>

       {editMode && effectiveLesson ? <LessonCrudActions lesson={effectiveLesson} /> : null}
       <Button asChild size="sm">
        <Link href={href} prefetch={false}>
         Mở bài
         <ArrowRight data-icon="inline-end" />
        </Link>
       </Button>
      </div>
     </div>
    ) : null}
   </div>
  </Card>
 );
}
