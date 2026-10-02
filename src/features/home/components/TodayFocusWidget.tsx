"use client";

import { ArrowRight, CheckCircle2, Flame, PlayCircle, Repeat2, Sparkles, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
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
 const activeResumeLesson = getActiveResumeLesson(courses);

 const hasDueCards = pulse.srsDueCount > 0;

 return (
  <section aria-labelledby="today-focus-heading" className="grid w-full min-w-0 gap-4">
   {/* Hero Daily Habit Banner */}
   <Card
    variant={hasDueCards ? "elevated" : "subtle"}
    padding="lg"
    className="relative overflow-hidden"
   >
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
     <div className="grid min-w-0 gap-2">
      <div className="flex items-center gap-2">
       <Badge variant={hasDueCards ? "warning" : "success"} size="sm" casing="natural">
        <Flame className="size-3.5 fill-current" />
        Hôm nay
       </Badge>
       {pulse.reviewedTodayCount > 0 ? (
        <Badge variant="default" size="sm" casing="natural">
         Đã ôn {pulse.reviewedTodayCount} lượt
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
       {hasDueCards ? (
        <>
         Bạn có{" "}
         <span className="text-warning-text underline decoration-warning/50 underline-offset-4">
          {pulse.srsDueCount} thẻ từ vựng
         </span>{" "}
         cần ôn tập hôm nay
        </>
       ) : (
        "Tuyệt vời! Bạn đã hoàn thành toàn bộ thẻ ôn tập của hôm nay"
       )}
      </Typography>

      <Typography as="p" variant="bodySmall" tone="muted" className="max-w-xl">
       {hasDueCards
        ? "Thuật toán lặp lại ngắt quãng (SRS) đã lên lịch những từ bạn sắp quên. Hãy hoàn thành phiên ôn để củng cố trí nhớ dài hạn."
        : "Không còn thẻ nào đến hạn. Bạn có thể tiếp tục học bài mới hoặc đọc bài viết tiếng Trung để mở rộng vốn từ."}
      </Typography>
     </div>

     <div className="flex shrink-0 items-center gap-3">
      {hasDueCards ? (
       <Button size="lg" className="gap-2" asChild>
        <Link href="/dictionary">
         <Zap className="size-4 fill-current" />
         Ôn tập ngay ({pulse.srsDueCount})
        </Link>
       </Button>
      ) : (
       <Button variant="outline" size="lg" className="gap-2" asChild>
        <Link href="/dictionary">
         <Repeat2 className="size-4" />
         Xem kho thẻ từ
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
         Học tiếp bài học gần nhất
        </span>
        <Badge size="sm" variant="default" casing="natural">
         {activeResumeLesson.bookTitle}
        </Badge>
       </div>
       <Typography as="h3" variant="body" weight="black" clamp="one">
        Bài {activeResumeLesson.lessonNumber}: {activeResumeLesson.title}
       </Typography>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-default/60">
       <Typography as="span" variant="caption" tone="muted">
        Bấm để vào thẳng workspace bài học
       </Typography>
       <Button size="toolbar" className="gap-1.5" asChild>
        <Link href={activeResumeLesson.href}>
         <PlayCircle className="size-4" />
         Vào học ngay
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
       Tiến độ từ vựng cá nhân
      </Typography>
      <div className="flex items-baseline gap-2">
       <span className="text-2xl font-black tracking-tight text-text-primary">
        {pulse.knownCount}
       </span>
       <Typography as="span" variant="caption" tone="muted">
        từ đã thuộc
       </Typography>
      </div>
     </div>

     <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border-default/60">
      <span className="flex items-center gap-1">
       <Repeat2 className="size-3.5 text-warning" />
       Đang học: <strong className="text-text-primary">{pulse.reviewCount}</strong>
      </span>
      <span className="flex items-center gap-1">
       <CheckCircle2 className="size-3.5 text-success" />
       Tổng: <strong className="text-text-primary">{pulse.trackedCount}</strong>
      </span>
     </div>
    </Card>
   </div>
  </section>
 );
}
