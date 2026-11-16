"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziAwareText,
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";

import type { SpeakingDrillTopic } from "./speaking-drills.schemas";

/** The exam prompt, the study notes that frame one dialogue, and the Doubao hand-off. */
export function SpeakingDrillBrief({
 topic,
 displayMode,
 notesOpen,
 footer,
}: {
 topic: SpeakingDrillTopic;
 displayMode: LessonDisplayMode;
 /** Initial state of the notes disclosure; the wide layout shows them beside the dialogue. */
 notesOpen: boolean;
 footer: ReactNode;
}) {
 const t = useTranslations("SpeakingDrills");
 const { outline, takeaways } = topic;
 const hasNotes = outline !== "" || takeaways.points.length > 0 || takeaways.goldenQuote !== "";

 return (
  <Card variant="section" padding="md" className="grid gap-3">
   <section className="grid gap-1.5" aria-label={t("question")}>
    <div className="flex items-center justify-between gap-2">
     <Typography as="h2" variant="overline" tone="accent">
      {t("question")}
     </Typography>
     <MandarinSpeakButton text={topic.question} />
    </div>
    <HanziText as="p" size="large" className="leading-relaxed">
     {topic.question}
    </HanziText>
    {displayMode.showPinyin && topic.questionPinyin ? (
     <PinyinText as="p">{topic.questionPinyin}</PinyinText>
    ) : null}
    {displayMode.showMeaning ? (
     <Typography as="p" variant="bodySmall" tone="secondary">
      {topic.titleVi}
     </Typography>
    ) : null}
   </section>

   {hasNotes ? (
    <details key={String(notesOpen)} open={notesOpen} className="group grid">
     <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-t border-border-default pt-3 text-sm font-bold text-text-primary [&::-webkit-details-marker]:hidden">
      {t("notesToggle")}
      <ChevronDown className="size-4 shrink-0 text-text-muted transition-transform group-open:rotate-180" />
     </summary>
     <div className="grid gap-4 pt-3">
      {outline ? (
       <section className="grid gap-1.5" aria-label={t("outline")}>
        <Typography as="h3" variant="overline" tone="muted">
         {t("outline")}
        </Typography>
        <HanziAwareText text={outline} variant="bodySmall" tone="secondary" />
       </section>
      ) : null}
      {takeaways.points.length > 0 ? (
       <section className="grid gap-1.5" aria-label={t("takeaways")}>
        <Typography as="h3" variant="overline" tone="muted">
         {t("takeaways")}
        </Typography>
        <ul className="grid list-disc gap-1.5 pl-5">
         {takeaways.points.map((point) => (
          <li key={point}>
           <HanziAwareText text={point} as="span" variant="bodySmall" tone="secondary" />
          </li>
         ))}
        </ul>
       </section>
      ) : null}
      {takeaways.goldenQuote ? (
       <section className="grid gap-1.5" aria-label={t("goldenQuote")}>
        <div className="flex items-center justify-between gap-2">
         <Typography as="h3" variant="overline" tone="muted">
          {t("goldenQuote")}
         </Typography>
         <MandarinSpeakButton text={takeaways.goldenQuote} />
        </div>
        <HanziText as="p" size="medium" className="leading-relaxed">
         {takeaways.goldenQuote}
        </HanziText>
       </section>
      ) : null}
     </div>
    </details>
   ) : null}

   <div className="grid gap-2 border-t border-border-default pt-3">{footer}</div>
  </Card>
 );
}
