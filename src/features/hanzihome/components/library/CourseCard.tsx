"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookMarked } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { fetchHanziHomeLessonDetail } from "@/features/hanzihome/repositories/hanzihome-content-api-client";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import { Link, useRouter } from "@/i18n/navigation";

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
  <Card variant="section" padding="sm" className="flex min-w-0 flex-col gap-2">
   <div className="flex min-w-0 items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-2">
     <IconTile size="sm">
      <BookMarked />
     </IconTile>

     <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-1.5">
       <Typography as="h4" variant="cardTitle" weight="black" clamp="one" leading="snug">
        {book.shortTitle || book.title}
       </Typography>
       {editMode ? (
        <BookCrudActions book={book} canMoveUp={canMoveBookUp} canMoveDown={canMoveBookDown} />
       ) : null}
      </div>
     </div>
    </div>

    <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
     <Badge variant="default" size="sm">
      {visibleLessonCount} bài
     </Badge>
     <Typography variant="caption" tone="muted" weight="bold">
      {visibleVocabCount} từ · {visibleGrammarCount} ngữ pháp
     </Typography>
    </div>
   </div>

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
     <Button asChild size="toolbar" aria-label={`Mở ${effectiveLesson?.titleZh || "bài học"}`}>
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
   ) : (
    <Typography as="p" variant="caption" tone="muted">
     Quyển này chưa có bài học.
    </Typography>
   )}
  </Card>
 );
}
