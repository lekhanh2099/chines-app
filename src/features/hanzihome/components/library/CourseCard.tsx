"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookMarked } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { fetchHanziHomeLessonDetail } from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";

import { BookCrudActions } from "./BookCrudActions";
import { LessonCrudActions } from "./LessonCrudActions";

export function CourseCard({
 course,
 book,
 lessons,
 editMode = false,
 canMoveBookUp = false,
 canMoveBookDown = false,
}: {
 course: HanziHomeCatalogCourse;
 book: HanziHomeCourseBook;
 lessons: HanziHomeLesson[];
 editMode?: boolean;
 canMoveBookUp?: boolean;
 canMoveBookDown?: boolean;
}) {
 const router = useRouter();
 const queryClient = useQueryClient();
 const bookLessons = useMemo(
  () => lessons.filter((lesson) => lesson.bookId === book.id),
  [book.id, lessons],
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
 const prefetchSelectedLesson = () => {
  if (!effectiveLessonId) return;

  router.prefetch(href);
  void queryClient.prefetchQuery({
   queryKey: hanzihomeQueryKeys.lessonDetail(effectiveLessonId),
   queryFn: () => fetchHanziHomeLessonDetail(effectiveLessonId),
   staleTime: Infinity,
  });
 };

 return (
  <Card
   variant="section"
   padding="none"
   className="group flex min-w-0 flex-col gap-2 rounded-xl p-2.5 transition-colors hover:border-primary/25 hover:bg-bg-elevated"
  >
   <div className="flex min-w-0 items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-2">
     <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-text">
      <BookMarked className="size-4" />
     </span>

     <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-1.5">
       <h4 className="truncate text-base font-black leading-snug text-text-primary">
        {book.shortTitle || book.title}
       </h4>
       {editMode ? (
        <BookCrudActions book={book} canMoveUp={canMoveBookUp} canMoveDown={canMoveBookDown} />
       ) : null}
      </div>
     </div>
    </div>

    <div className="hidden shrink-0 items-center gap-1.5 text-xs font-bold text-text-muted sm:flex">
     <Badge variant="default" size="sm">
      {visibleLessonCount} bài
     </Badge>
     <span>{visibleVocabCount} từ</span>
     <span aria-hidden="true">·</span>
     <span>{visibleGrammarCount} ngữ pháp</span>
    </div>
   </div>

   <div className="grid min-h-9">
    {bookLessons.length > 0 ? (
     <div className="flex min-w-0 items-center gap-1.5">
      <div className="min-w-0 flex-1">
       <Select value={effectiveLessonId} onValueChange={setSelectedLessonId}>
        <SelectTrigger
         size="sm"
         width="full"
         aria-label={`Chọn bài trong ${book.shortTitle || book.title}`}
        >
         <SelectValue placeholder="Chọn bài" />
        </SelectTrigger>
        <SelectContent align="start">
         {bookLessons.map((lesson) => (
          <SelectItem key={lesson.id} value={lesson.id}>
           Bài {lesson.lessonNumber}: {lesson.titleZh || lesson.title}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </div>

      {editMode && effectiveLesson ? <LessonCrudActions lesson={effectiveLesson} /> : null}
      <Button asChild size="sm" aria-label={`Mở ${effectiveLesson?.titleZh || "bài học"}`}>
       <Link
        href={href}
        prefetch={false}
        onMouseEnter={prefetchSelectedLesson}
        onFocus={prefetchSelectedLesson}
       >
        Mở
        <ArrowRight data-icon="inline-end" />
       </Link>
      </Button>
     </div>
    ) : null}
   </div>
  </Card>
 );
}
