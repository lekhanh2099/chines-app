"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BookMarked } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { IconTile } from "@/components/ui/display/icon-tile";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Typography } from "@/components/ui/display/typography";
import { usePrefetchHanziHomeLesson } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import { getLibraryBookStudy } from "./library-course-groups";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";
import { Link, useRouter } from "@/i18n/navigation";

import { BookCrudActions } from "./BookCrudActions";
import { LessonCrudActions } from "./LessonCrudActions";
import { CourseOfflineDownloadButton } from "@/features/hanzihome/offline-pack/CourseOfflineDownloadButton";

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
 const t = useTranslations("Common.library");
 const router = useRouter();
 const prefetchLesson = usePrefetchHanziHomeLesson(router.prefetch);
 const [selectedLessonId, setSelectedLessonId] = useState("");
 const {
  bookLessons,
  effectiveLesson,
  href,
  visibleLessonCount,
  visibleVocabCount,
  visibleGrammarCount,
 } = useMemo(
  () => getLibraryBookStudy(course, book, lessons, selectedLessonId),
  [book, course, lessons, selectedLessonId],
 );
 const effectiveLessonId = effectiveLesson?.id ?? "";
 const prefetchSelectedLesson = (targetLessonId = effectiveLessonId) => {
  if (!targetLessonId) return;
  const target = getLibraryBookStudy(course, book, lessons, targetLessonId);
  if (target.effectiveLesson) prefetchLesson(target.effectiveLesson.id, target.href);
 };

 const handleLessonSelectionChange = (newLessonId: string) => {
  setSelectedLessonId(newLessonId);
  prefetchSelectedLesson(newLessonId);
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
      {t("lessonCount", { count: visibleLessonCount })}
     </Badge>
     <Typography variant="caption" tone="muted" weight="bold">
      {t("contentCounts", { vocab: visibleVocabCount, grammar: visibleGrammarCount })}
     </Typography>
    </div>
   </div>

   {bookLessons.length > 0 ? (
    <div className="flex min-w-0 items-center gap-1.5">
     <div className="min-w-0 flex-1">
      <Select value={effectiveLessonId} onValueChange={handleLessonSelectionChange}>
       <SelectTrigger
        size="sm"
        width="full"
        aria-label={t("selectLessonAria", { book: book.shortTitle || book.title })}
       >
        <SelectValue placeholder={t("selectLesson")} />
       </SelectTrigger>
       <SelectContent align="start">
        {bookLessons.map((lesson) => (
         <SelectItem key={lesson.id} value={lesson.id}>
          {t("lessonLabel", { number: lesson.lessonNumber, title: lesson.titleZh || lesson.title })}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>

     {editMode && effectiveLesson ? <LessonCrudActions lesson={effectiveLesson} /> : null}
     <CourseOfflineDownloadButton courseId={course.id} lessonIds={bookLessons.map((l) => l.id)} />
     <Button
      asChild
      size="toolbar"
      aria-label={t("openLessonAria", { title: effectiveLesson?.titleZh || t("lesson") })}
     >
      <Link
       href={href}
       onMouseEnter={() => prefetchSelectedLesson()}
       onFocus={() => prefetchSelectedLesson()}
       onTouchStart={() => prefetchSelectedLesson()}
      >
       {t("open")}
       <ArrowRight data-icon="inline-end" />
      </Link>
     </Button>
    </div>
   ) : (
    <Typography as="p" variant="caption" tone="muted">
     {t("noLessons")}
    </Typography>
   )}
  </Card>
 );
}
