"use client";

import { useTranslations } from "next-intl";
import {
 dictationEntryText,
 dictationEntryPinyin,
 dictationEntryMeaning,
} from "./dictation-workspace-utils";

import { useState } from "react";

import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziText,
 PinyinText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";

type DictationReferenceMode = "hanzi" | "pinyin" | "meaning";

export function StudioDictationReferencePanel({
 activeIndex,
 entries,
 isPlaybackActive,
 sourceLabel,
 titleVi,
 titleZh,
}: {
 activeIndex: number;
 entries: ListeningTranscriptEntry[];
 isPlaybackActive: boolean;
 sourceLabel: string;
 titleVi: string;
 titleZh: string;
}) {
 const t = useTranslations("Dictation");
 const [mode, setMode] = useState<DictationReferenceMode>("meaning");
 const visibleMode: DictationReferenceMode = isPlaybackActive ? "hanzi" : mode;

 return (
  <Card variant="section" padding="md" className="grid min-w-0 content-start gap-4">
   <div className="grid min-w-0 gap-2">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant="warning" casing="natural">
      {t("currentLesson")}
     </Badge>
     <Typography variant="caption" tone="muted" weight="black" clamp="one">
      {sourceLabel}
     </Typography>
    </div>
    <div className="grid min-w-0 gap-1">
     <HanziText as="h2" size="large" weight="black" clamp="two">
      {titleZh}
     </HanziText>
     <Typography variant="bodySmall" tone="secondary" weight="semibold" clamp="two">
      {titleVi}
     </Typography>
    </div>
    <Typography variant="bodySmall" tone="muted" leading="relaxed">
     {t("referenceHelp")}
    </Typography>
   </div>

   <SegmentedControl<DictationReferenceMode>
    value={visibleMode}
    items={[
     { key: "hanzi", label: t("textTab") },
     { key: "pinyin", label: t("pinyinTab") },
     { key: "meaning", label: t("meaning") },
    ]}
    onChange={setMode}
    aria-label={t("referenceAria")}
   />

   <div className="grid min-w-0 gap-4 overflow-y-auto overscroll-contain xl:max-h-[60dvh]">
    {entries.map((entry, index) => {
     const active = index === activeIndex;
     const hanzi = dictationEntryText(entry);
     const pinyin = dictationEntryPinyin(entry);
     const meaning = dictationEntryMeaning(entry);

     return (
      <div key={entry.id} className="grid min-w-0 gap-1.5">
       {entries.length > 1 ? (
        <Typography variant="caption" tone={active ? "accent" : "muted"} weight="black">
         {t("part", { number: index + 1 })}
        </Typography>
       ) : null}
       {visibleMode === "hanzi" ? (
        <HanziText
         as="p"
         size="medium"
         tone={active ? "accent" : "default"}
         leading="relaxed"
         wrapping="preWrap"
        >
         {hanzi}
        </HanziText>
       ) : null}
       {visibleMode === "pinyin" ? (
        <PinyinText
         variant="bodySmall"
         tone={active ? "accent" : "muted"}
         leading="relaxed"
         wrapping="preWrap"
        >
         {pinyin || t("noPinyin")}
        </PinyinText>
       ) : null}
       {visibleMode === "meaning" ? (
        <TranslationText
         variant="bodySmall"
         tone={active ? "secondary" : "muted"}
         leading="relaxed"
         wrapping="preWrap"
        >
         {meaning || t("noMeaning")}
        </TranslationText>
       ) : null}
      </div>
     );
    })}
   </div>
  </Card>
 );
}
