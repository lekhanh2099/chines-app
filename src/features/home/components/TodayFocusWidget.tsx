"use client";

import { ArrowRight, CheckCircle2, Flame, PlayCircle, Repeat2, Sparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import type { HomeDashboardModel } from "@/features/home/types";
import { Link } from "@/i18n/navigation";

type TodayFocusWidgetProps = {
 courses: HomeDashboardModel["courses"];
 pulse: HomeDashboardModel["learningPulse"];
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
 // Fallback to the first available lesson if no recent lesson is marked
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

export function TodayFocusWidget({ courses, pulse }: TodayFocusWidgetProps) {
 const t = useTranslations("Home");
 const activeResumeLesson = getActiveResumeLesson(courses);

 const hasDueReviewItems = pulse.overviewAvailable && pulse.learningLoopDueCount > 0;

 return (
  <section aria-labelledby="today-focus-heading" className="grid w-full min-w-0 gap-4">
   {/* Hero Daily Habit Banner */}
   <Card
    variant={hasDueReviewItems ? "elevated" : "subtle"}
    padding="lg"
    className="relative overflow-hidden"
   >
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
     <div className="grid min-w-0 gap-2">
      <div className="flex items-center gap-2">
       <Badge
        variant={!pulse.overviewAvailable ? "default" : hasDueReviewItems ? "warning" : "success"}
        size="sm"
        casing="natural"
       >
        <Flame className="size-3.5 fill-current" />
        {t("focus.today")}
       </Badge>
       {pulse.reviewedTodayCount > 0 ? (
        <Badge variant="default" size="sm" casing="natural">
         {t("focus.reviewedToday", { count: pulse.reviewedTodayCount })}
        </Badge>
       ) : null}
      </div>

      <Typography
       id="today-focus-heading"
       as="h2"
       variant="sectionTitle"
       tone="default"
       weight="black"
      >
       {!pulse.overviewAvailable
        ? t("focus.overviewUnknownTitle")
        : hasDueReviewItems
          ? t.rich("focus.dueTitle", {
             count: pulse.learningLoopDueCount,
             highlight: (chunks) => (
              <span className="text-warning-text underline decoration-warning/50 underline-offset-4">
               {chunks}
              </span>
             ),
            })
          : t("focus.noDueTitle")}
      </Typography>

      <Typography as="p" variant="bodySmall" tone="muted" className="max-w-xl">
       {!pulse.overviewAvailable
        ? t("focus.overviewUnknownDescription")
        : hasDueReviewItems
          ? t("focus.dueDescription")
          : t("focus.noDueDescription")}
      </Typography>
     </div>

     <div className="flex shrink-0 items-center gap-3">
      {hasDueReviewItems ? (
       <Button size="lg" className="gap-2" asChild>
        <Link href="/learning-loop">
         <Zap className="size-4 fill-current" />
         {t("focus.reviewNow", { count: pulse.learningLoopDueCount })}
        </Link>
       </Button>
      ) : (
       <Button variant="outline" size="lg" className="gap-2" asChild>
        <Link href="/dictionary">
         <Repeat2 className="size-4" />
         {t("focus.viewCards")}
        </Link>
       </Button>
      )}
     </div>
    </div>
   </Card>

   {/* Quick Actions & Resume Learning Row */}
   <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {/* Jump Back In Card */}
    {activeResumeLesson ? (
     <Card
      variant="interactive"
      padding="md"
      className="sm:col-span-2 lg:col-span-2 flex flex-col justify-between gap-3"
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

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-default/60">
       <Typography as="span" variant="caption" tone="muted">
        {t("focus.resumeHint")}
       </Typography>
       <Button size="toolbar" className="gap-1.5" asChild>
        <Link href={activeResumeLesson.href}>
         <PlayCircle className="size-4" />
         {t("focus.resumeNow")}
         <ArrowRight className="size-3.5" />
        </Link>
       </Button>
      </div>
     </Card>
    ) : null}

    {/* Metric Overview Card */}
    <Card variant="section" padding="md" className="flex flex-col justify-between gap-2">
     <div className="grid gap-1">
      <Typography as="span" variant="caption" tone="muted" weight="bold">
       {t("focus.vocabProgress")}
      </Typography>
      <div className="flex items-baseline gap-2">
       <span className="text-2xl font-black tracking-tight text-text-primary">
        {pulse.knownCount}
       </span>
       <Typography as="span" variant="caption" tone="muted">
        {t("focus.knownWords")}
       </Typography>
      </div>
     </div>

     <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border-default/60">
      <span className="flex items-center gap-1">
       <Repeat2 className="size-3.5 text-warning" />
       {t("focus.learning")} <strong className="text-text-primary">{pulse.reviewCount}</strong>
      </span>
      <span className="flex items-center gap-1">
       <CheckCircle2 className="size-3.5 text-success" />
       {t("focus.total")} <strong className="text-text-primary">{pulse.trackedCount}</strong>
      </span>
     </div>
    </Card>
   </div>
  </section>
 );
}
