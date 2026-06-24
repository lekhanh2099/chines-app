"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookMarked, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Select from "@/components/ui/select/index";
import { useHanziHomeCourseLessons } from "@/features/hanzihome/hooks/useHanziHomeCourseLessons";
import type { HanziHomeCatalogCourse } from "@/features/hanzihome/types";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import { IOption } from "@/types/option";

import { BookCrudActions } from "./BookCrudActions";
import { CourseCrudActions } from "./CourseCrudActions";
import { LessonCrudActions } from "./LessonCrudActions";
import { MiniMetric } from "./MiniMetric";
import type { CourseStats } from "./types";

export function CourseCard({
 course,
 stats,
 editMode = false,
}: {
 course: HanziHomeCatalogCourse;
 stats: CourseStats;
 editMode?: boolean;
}) {
 const primaryBook = stats.books[0];
 const { lessons: courseLessons } = useHanziHomeCourseLessons(course.id);
 const [selectedLessonId, setSelectedLessonId] = useState(stats.fallbackLessonId ?? "");

 const effectiveLesson = useMemo(() => {
  const selectedExists = courseLessons.some((lesson) => lesson.id === selectedLessonId);
  const effectiveLessonId =
   (selectedExists ? selectedLessonId : null) ||
   stats.fallbackLessonId ||
   courseLessons[0]?.id ||
   "";

  return courseLessons.find((lesson) => lesson.id === effectiveLessonId) ?? null;
 }, [courseLessons, selectedLessonId, stats.fallbackLessonId]);

 const effectiveLessonId = effectiveLesson?.id ?? "";
 const href = buildHanziHomeLessonHref({
  courseId: course.id,
  lessonNumber: effectiveLesson?.lessonNumber,
 });

 const visibleLessonCount = courseLessons.length || stats.lessonCount;
 const visibleVocabCount =
  courseLessons.length > 0
   ? courseLessons.reduce((sum, lesson) => sum + (lesson.vocabCount ?? lesson.vocabIds.length), 0)
   : stats.vocabCount;
 const visibleGrammarCount =
  courseLessons.length > 0
   ? courseLessons.reduce(
      (sum, lesson) => sum + (lesson.grammarCount ?? lesson.grammarPointIds.length),
      0,
     )
   : stats.grammarCount;

 const courseLessonOptions: IOption[] = courseLessons.map((lesson) => ({
  value: lesson.id,
  label: `Bài ${lesson.lessonNumber}: ${lesson.titleZh || lesson.title}`,
 }));

 const selectedOption =
  courseLessonOptions.find((option) => option.value === effectiveLessonId) || null;

 return (
  <Card
   variant="glass"
   padding="none"
   className="group flex h-full min-w-0 flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-theme-lg"
  >
   <div className="flex min-w-0 items-start justify-between gap-4">
    <div className="flex min-w-0 gap-4">
     <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-subtle text-accent-text shadow-theme-sm">
      <BookMarked className="h-5 w-5" />
     </span>

     <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
       <span className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
        {primaryBook?.shortTitle || primaryBook?.title || course.type}
       </span>

       {stats.books.length > 0 && (
        <span className="rounded-full bg-bg-subtle px-2.5 py-1 text-[0.7rem] font-black text-text-muted">
         {stats.books.length} quyển
        </span>
       )}

       {editMode ? <CourseCrudActions course={course} /> : null}
      </div>

      <h2 className="mt-2 line-clamp-2 text-2xl font-black leading-tight tracking-tight text-text-primary">
       {course.title}
      </h2>

      {course.subtitle && (
       <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-text-secondary">
        {course.subtitle}
       </p>
      )}
     </div>
    </div>

    <Button asChild className="hidden shrink-0 sm:inline-flex">
     <Link href={href} prefetch={false}>
      <Sparkles className="h-4 w-4" />
      Vào học
     </Link>
    </Button>
   </div>

   <div className="mt-5 flex flex-wrap gap-2">
    <MiniMetric label="Bài" value={visibleLessonCount} />
    <MiniMetric label="Từ" value={visibleVocabCount} />
    <MiniMetric label="Ngữ pháp" value={visibleGrammarCount} />
   </div>

   {stats.books.length > 0 ? (
    <div className="mt-4 flex flex-wrap gap-2">
     {stats.books.map((book) => (
      <div
       key={book.id}
       className="flex items-center gap-1 rounded-full border border-border-default/80 bg-bg-primary/70 px-3 py-1.5"
      >
       <span className="text-xs font-bold text-text-secondary">{book.shortTitle || book.title}</span>
       {editMode ? <BookCrudActions book={book} /> : null}
      </div>
     ))}
    </div>
   ) : null}

   <div className="mt-auto grid gap-2 pt-5">
    {courseLessons.length > 0 && (
     <div className="grid gap-1.5">
      <span className="text-xs font-black uppercase tracking-wide text-text-muted">Bài sẽ mở</span>

      <div className="flex min-w-0 items-center gap-2">
       <div className="min-w-0 flex-1">
        <Select
         options={courseLessonOptions}
         selectValue={selectedOption}
         triggerPlaceholder="Chọn bài"
         onChange={(option: IOption | null) => {
          if (option?.value) setSelectedLessonId(String(option.value));
         }}
        />
       </div>

       {editMode && effectiveLesson ? <LessonCrudActions lesson={effectiveLesson} /> : null}
      </div>
     </div>
    )}

    <Button asChild className="sm:hidden">
     <Link href={href} prefetch={false}>
      <Sparkles className="h-4 w-4" />
      Vào học
     </Link>
    </Button>
   </div>
  </Card>
 );
}
