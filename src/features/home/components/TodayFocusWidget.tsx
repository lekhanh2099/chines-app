"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { useHomeLessonTitle, useHomeModuleLabel } from "@/features/home/components/HomePrimitives";
import type { HomeResumeBook } from "@/features/home/types";
import { Link } from "@/i18n/navigation";

/**
 * The single most recent study target. Badge, title, module and href all come
 * from the same book's resume target, so they can never describe different books.
 */
export function TodayFocusWidget({ book }: { book: HomeResumeBook }) {
 const t = useTranslations("Home");
 const moduleLabel = useHomeModuleLabel();
 const lessonTitle = useHomeLessonTitle();
 const lesson = book.lesson;

 if (!lesson) return null;

 return (
  <section
   aria-label={t("focus.resumeLesson")}
   data-home-resume-book={book.id}
   className="flex w-full min-w-0"
  >
   <Card variant="interactive" padding="md" asChild>
    <Link href={lesson.href} className="group flex w-full flex-col justify-between gap-3">
     <div className="grid min-w-0 gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <span className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-text-muted">
        <Sparkles className="size-3.5 shrink-0 text-primary" />
        {t("focus.resumeLesson")}
       </span>
       <Badge size="sm" variant="default" casing="natural">
        {book.title}
       </Badge>
      </div>
      <Typography as="h3" variant="body" weight="black" wrapping="breakWords">
       {lessonTitle(lesson)}
      </Typography>
     </div>

     <div className="flex items-center justify-between gap-2 border-t border-border-default/60 pt-2">
      <Typography as="span" variant="caption" tone="muted">
       {moduleLabel(lesson.module)}
      </Typography>
      <Typography
       as="span"
       variant="caption"
       tone="primary"
       weight="bold"
       className="flex shrink-0 items-center gap-1.5"
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
