"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import type { HomeDashboardModel } from "@/features/home/types";
import { Link } from "@/i18n/navigation";

type TodayFocusWidgetProps = {
 courses: HomeDashboardModel["courses"];
 pulse?: HomeDashboardModel["learningPulse"];
};

function getActiveResumeLesson(courses: HomeDashboardModel["courses"]) {
 for (const course of courses) {
  for (const book of course.books) {
   if (book.lesson?.isRecent) {
    return {
     bookTitle: book.title,
     lessonNumber: book.lesson.lessonNumber,
     title: book.lesson.titleZh || book.lesson.title,
     href: book.lesson.href,
    };
   }
  }
 }
 const firstBook = courses[0]?.books[0];
 if (firstBook?.lesson) {
  return {
   bookTitle: firstBook.title,
   lessonNumber: firstBook.lesson.lessonNumber,
   title: firstBook.lesson.titleZh || firstBook.lesson.title,
   href: firstBook.lesson.href,
  };
 }
 return null;
}

export function TodayFocusWidget({ courses }: TodayFocusWidgetProps) {
 const t = useTranslations("Home");
 const activeResumeLesson = getActiveResumeLesson(courses);

 if (!activeResumeLesson) return null;

 return (
  <section aria-label={t("focus.resumeLesson")} className="flex h-full w-full min-w-0">
   <Card variant="interactive" padding="md" asChild>
    <Link
     href={activeResumeLesson.href}
     className="group flex h-full w-full flex-col justify-between gap-3"
    >
     <div className="grid min-w-0 gap-1.5">
      <div className="flex items-center justify-between gap-2">
       <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted">
        <Sparkles className="size-3.5 text-primary" />
        {t("focus.resumeLesson")}
       </span>
       <Badge size="sm" variant="default" casing="natural">
        {activeResumeLesson.bookTitle}
       </Badge>
      </div>
      <Typography as="h3" variant="body" weight="black" clamp="one">
       {activeResumeLesson.title.startsWith("ÔN TẬP ")
        ? activeResumeLesson.title
        : t("continueLearning.lesson", {
           number: activeResumeLesson.lessonNumber,
           title: activeResumeLesson.title,
          })}
      </Typography>
     </div>

     <div className="flex items-center justify-between gap-2 border-t border-border-default/60 pt-2">
      <Typography as="span" variant="caption" tone="muted">
       {t("focus.resumeHint")}
      </Typography>
      <Typography
       as="span"
       variant="caption"
       tone="primary"
       weight="bold"
       className="flex items-center gap-1.5"
      >
       {t("focus.resumeNow")}
       <ArrowRight className="size-3.5" />
      </Typography>
     </div>
    </Link>
   </Card>
  </section>
 );
}
