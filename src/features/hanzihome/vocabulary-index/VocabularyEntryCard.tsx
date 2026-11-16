"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { DetailHint } from "@/features/hanzihome/components/DetailHint";
import {
 HanziAwareText,
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { Link } from "@/i18n/navigation";

import { vocabularyWordHref, type VocabularyEntry } from "./vocabulary-index";

const previewOccurrenceCount = 4;

/** One word of the store: the gist on the card, every lesson meaning on hover, the page on click. */
export function VocabularyEntryCard({ entry }: { entry: VocabularyEntry }) {
 const t = useTranslations("Inspector.store");
 const [hintOpen, setHintOpen] = useState(false);
 const href = vocabularyWordHref(entry.hanzi);
 const [firstOccurrence] = entry.occurrences;
 const otherCount = entry.occurrences.length - 1;

 return (
  <Card variant="default" padding="md" className="grid h-full content-start gap-1.5">
   <div className="flex min-w-0 items-start gap-2">
    <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
     <Link href={href} prefetch={false} aria-label={t("openWord", { hanzi: entry.hanzi })}>
      <HanziText as="span" size="card" tone="primary" weight="black" leading="none">
       {entry.hanzi}
      </HanziText>
     </Link>
     {entry.pinyin ? (
      <PinyinText tone="accent" weight="bold">
       {entry.pinyin}
      </PinyinText>
     ) : null}
     {entry.hanViet ? (
      <StudyInstructionText as="span" variant="caption" tone="purple" transform="uppercase">
       {entry.hanViet}
      </StudyInstructionText>
     ) : null}
    </div>
    <div className="flex shrink-0 items-center">
     <DetailHint
      href={href}
      label={t("hintAria", { hanzi: entry.hanzi })}
      open={hintOpen}
      onOpenChange={setHintOpen}
     >
      {entry.occurrences.slice(0, previewOccurrenceCount).map((occurrence) => (
       <div key={`${occurrence.source.href}:${occurrence.meaning}`} className="grid gap-0.5">
        <Typography as="span" variant="caption" tone="success">
         {occurrence.source.label}
        </Typography>
        <HanziAwareText text={occurrence.meaning} variant="bodySmall" tone="default" />
       </div>
      ))}
      <Link
       href={href}
       prefetch={false}
       className="flex items-center gap-1 text-sm font-bold text-primary"
      >
       {t("openWord", { hanzi: entry.hanzi })}
       <ArrowRight className="size-3.5" />
      </Link>
     </DetailHint>
     <MandarinSpeakButton text={entry.hanzi} />
    </div>
   </div>
   {firstOccurrence ? (
    <HanziAwareText text={firstOccurrence.meaning} variant="bodySmall" tone="default" clamp="two" />
   ) : null}
   <Typography as="span" variant="caption" tone="muted">
    {otherCount > 0
     ? t("occurrenceSummary", { source: firstOccurrence?.source.label ?? "", count: otherCount })
     : (firstOccurrence?.source.label ?? "")}
   </Typography>
  </Card>
 );
}
