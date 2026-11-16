"use client";

import { useTranslations } from "next-intl";

import { Spinner } from "@/components/ui/feedback/spinner";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziAwareText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

import { useVocabularyWord } from "./useVocabularyWords";

/** The meaning a word carries in each lesson, textbook or note, grouped by reading. */
export function WordOccurrenceList({
 hanzi,
 enabled,
 limit,
}: {
 hanzi: string;
 enabled: boolean;
 /** Most occurrences to show per reading. */
 limit: number;
}) {
 const t = useTranslations("Inspector.store");
 const word = useVocabularyWord(hanzi, enabled);

 if (word.isError) {
  return (
   <Typography as="p" variant="bodySmall" tone="danger">
    {t("reuseLoadError")}
   </Typography>
  );
 }
 if (!word.data) return <Spinner />;

 const multipleReadings = word.data.length > 1;
 return word.data.map((entry) => (
  <div key={entry.pinyin} className="grid gap-2">
   {multipleReadings && entry.pinyin ? (
    <PinyinText tone="accent" weight="bold">
     {entry.pinyin}
    </PinyinText>
   ) : null}
   {entry.occurrences.slice(0, limit).map((occurrence) => (
    <div key={`${occurrence.source.href}:${occurrence.meaning}`} className="grid gap-0.5">
     <Typography as="span" variant="caption" tone="success">
      {occurrence.source.label}
     </Typography>
     <HanziAwareText text={occurrence.meaning} variant="bodySmall" tone="default" />
    </div>
   ))}
  </div>
 ));
}
