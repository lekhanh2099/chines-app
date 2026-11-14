"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import { HanziInlineText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 buildTextbookHref,
 lessonDisplayTitle,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { Link } from "@/i18n/navigation";

export function LibraryTextbookCollection({ textbook }: { textbook: TextbookBookSummary }) {
 const t = useTranslations("Common.library");

 return (
  <section className="grid min-w-0 gap-4">
   <div className="grid gap-1">
    <Typography as="h1" variant="pageTitle" wrapping="breakWords">
     <HanziInlineText text={textbook.label} />
    </Typography>
    <Typography variant="bodySmall" tone="muted">
     {t("lessonCount", { count: textbook.lessons.length })}
    </Typography>
   </div>
   <Card variant="section" padding="md" className="grid gap-2">
    {textbook.lessons.map((lesson) => (
     <Button key={lesson.id} asChild variant="ghost" align="between" wrap="normal">
      <Link href={buildTextbookHref(textbook.key, lesson.number)}>
       <span className="min-w-0 flex-1">
        <HanziInlineText
         text={
          lesson.title.startsWith("ÔN TẬP ")
           ? lesson.title
           : t("lessonLabel", {
              number: lesson.number,
              title: lessonDisplayTitle(lesson.title),
             })
         }
        />
       </span>
       <ArrowRight data-icon="inline-end" />
      </Link>
     </Button>
    ))}
   </Card>
  </section>
 );
}
