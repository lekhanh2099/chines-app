"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { PinyinText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";

/** Lesson/unit badges and, outside the reader tab, the document title block. */
export function ReaderDocumentStudyHeading({
 resource,
 lessonLabel,
 unitNumber,
 showTitle,
}: {
 resource: ReaderDocumentResource;
 lessonLabel: string;
 unitNumber: string;
 showTitle: boolean;
}) {
 const t = useTranslations("Reader.study");

 return (
  <div className="grid min-w-0 gap-2 border-b border-border-default pb-4 sm:pb-5">
   <div className="flex flex-wrap gap-2">
    <Badge variant="success" casing="natural">
     {lessonLabel}
    </Badge>
    {unitNumber ? (
     <Badge variant="accent" casing="natural">
      {t("chrome.unit", { unit: unitNumber })}
     </Badge>
    ) : null}
   </div>
   {showTitle ? (
    <>
     <Typography as="h1" variant="sectionTitle" weight="black" clamp="two">
      {resource.document.title_zh}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {resource.document.title_pinyin ? (
       <PinyinText as="span" variant="caption" tone="accent">
        {resource.document.title_pinyin}
       </PinyinText>
      ) : null}
      {resource.document.title_pinyin ? " · " : ""}
      {resource.document.title_vi || resource.document.genre_vi || t("chrome.defaultReading")}
     </Typography>
    </>
   ) : null}
  </div>
 );
}

/** Completion badge plus the explicit "mark done" action. */
export function ReaderCompletionControl({
 completed,
 onMarkCompleted,
}: {
 completed: boolean;
 onMarkCompleted: () => void;
}) {
 const t = useTranslations("Reader.study");

 return (
  <div className="flex flex-wrap items-center gap-2">
   <Badge variant={completed ? "success" : "default"} casing="natural">
    {completed ? t("completion.done") : t("completion.pending")}
   </Badge>
   {!completed ? (
    <Button type="button" size="toolbar" variant="outline" onClick={onMarkCompleted}>
     <Check />
     {t("completion.markDone")}
    </Button>
   ) : null}
  </div>
 );
}
