"use client";

import { useTranslations } from "next-intl";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import { TranslationText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import {
 lessonDisplayTitle,
 splitTrailingTranslation,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type {
 TextbookBookSummary,
 TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { BusinessChineseText } from "./BusinessChineseText";

/** The lesson "overview" tab: title, translation, intro and section/vocab counts. */
export function BusinessChineseOverviewCard({
 lesson,
 displayMode,
 sectionCount,
}: {
 lesson: TextbookLesson;
 displayMode: LessonDisplayMode;
 sectionCount: number;
}) {
 const t = useTranslations("BusinessChinese");
 const intro = lesson.intro.join(" ");
 const lessonTitle = splitTrailingTranslation(lessonDisplayTitle(lesson.title));

 return (
  <Card variant="section" padding="md">
   <div className="grid min-w-0 gap-2">
    <BusinessChineseText
     pronunciationId={`${lesson.id}:title`}
     text={lessonTitle.source}
     displayMode={displayMode}
     variant="pageTitle"
     weight="black"
    />
    {lessonTitle.translation && displayMode.showMeaning ? (
     <TranslationText variant="sectionTitle" tone="secondary" weight="black">
      {lessonTitle.translation}
     </TranslationText>
    ) : null}
    {intro ? (
     <Typography variant="bodySmall" tone="secondary">
      {intro}
     </Typography>
    ) : null}
    <Typography variant="caption" tone="muted">
     {t("lessonMeta", {
      sections: sectionCount,
      vocab: lesson.vocab.length,
     })}
    </Typography>
   </div>
  </Card>
 );
}

/** Screen-reader page heading: book, lesson position (when lessons are sequential) and title. */
export function BusinessChineseLessonHeading({
 books,
 lesson,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
}) {
 const t = useTranslations("BusinessChinese");
 const book = books.find((item) => item.key === lesson.bookKey);
 const sequentialLessons = book?.lessons.every((item, index) => item.number === index + 1);
 return (
  <Typography as="h1" variant="pageTitle" className="sr-only">
   {lesson.bookLabel} ·{" "}
   {sequentialLessons ? (
    <>
     {t("lessonPosition", { lesson: lesson.number, count: book?.lessons.length ?? 0 })}
     {" · "}
    </>
   ) : null}
   {lesson.title}
  </Typography>
 );
}
