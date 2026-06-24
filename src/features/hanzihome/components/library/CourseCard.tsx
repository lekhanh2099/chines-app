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
import type { CourseStats } from "./types";
import { MiniMetric } from "./MiniMetric";
import { BookCrudActions } from "./BookCrudActions";
import { CourseCrudActions } from "./CourseCrudActions";
import { LessonCrudActions } from "./LessonCrudActions";

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
   className="p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-theme-lg sm:p-5"
  >
   <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
    <div className="flex min-w-0 gap-4">
     <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg-subtle shadow-theme-sm">
      <BookMarked className="h-5 w-5" />
     </span>

     <div className="grid min-w-0 gap-1">
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

      <h2 className="truncate text-2xl font-black tracking-tight text-text-primary">
       {course.title}
      </h2>

      {course.subtitle && (
       <p className="line-clamp-1 max-w-2xl  font-semibold text-text-secondary">
        {course.subtitle}
       </p>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
       <MiniMetric label="Bài" value={visibleLessonCount} />
       <MiniMetric label="Từ" value={visibleVocabCount} />
       <MiniMetric label="Ngữ pháp" value={visibleGrammarCount} />
      </div>

      {stats.books.length > 0 ? (
       <div className="flex flex-wrap gap-2 pt-1">
        {stats.books.map((book) => (
         <div
          key={book.id}
          className="flex items-center gap-1 rounded-lg border border-border-default bg-bg-primary px-2 py-1"
         >
          <span className="text-xs font-bold text-text-secondary">
           {book.shortTitle || book.title}
          </span>
          {editMode ? <BookCrudActions book={book} /> : null}
         </div>
        ))}
       </div>
      ) : null}

      {courseLessons.length > 0 && (
       <div className="mt-2 grid max-w-lg gap-1.5">
        <span className="text-xs font-black uppercase tracking-wide text-text-muted">
         Bài sẽ mở
        </span>
        <div className="flex min-w-0 items-center gap-1">
         <div className="min-w-0 flex-1">
          <Select
           options={courseLessonOptions}
           selectValue={selectedOption}
           triggerPlaceholder="Chọn course"
           onChange={(option: IOption | null) => {
            if (option?.value) setSelectedLessonId(String(option.value));
           }}
          />
         </div>
         {editMode && effectiveLesson ? <LessonCrudActions lesson={effectiveLesson} /> : null}
        </div>
       </div>
      )}
     </div>
    </div>

    <div className="flex flex-wrap gap-2 md:justify-end">
     <Button asChild>
      <Link href={href} prefetch={false}>
       <Sparkles className="h-4 w-4" />
       Vào học
      </Link>
     </Button>
    </div>
   </div>
  </Card>
 );
}
