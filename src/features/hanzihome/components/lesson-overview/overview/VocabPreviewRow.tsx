"use client";

import type { ReactNode } from "react";
import { BookmarkPlus, Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import {
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { CharacterNoteHint } from "@/features/hanzihome/radical-characters/CharacterNoteHint";
import { WordOccurrencesHint } from "@/features/hanzihome/vocabulary-index/WordOccurrencesHint";

export function VocabPreviewRow({
 hanzi,
 pinyin,
 hanviet,
 category,
 meaning,
 rawMeaning,
 rawHanviet,
 header,
 children,
}: {
 hanzi: string;
 pinyin: string;
 hanviet: string;
 category: string;
 meaning: string;
 rawMeaning?: string;
 rawHanviet?: string;
 header?: ReactNode;
 children?: ReactNode;
}) {
 const t = useTranslations("Vocab.cards");
 const learning = useLearningState();
 const customVocabList = learning.state.settings.customVocab ?? [];
 const isSavedToVault = customVocabList.some((word) => word.hanzi.trim() === hanzi.trim());

 return (
  <Card variant="subtle" padding="sm" className="grid min-w-0 content-start gap-1.5">
   <div className="flex min-w-0 items-start justify-between gap-2">
    <div className="min-w-0 flex-1">
     {header ?? (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
       <HanziText as="span" size="card" weight="black" leading="none" clamp="one">
        {hanzi}
       </HanziText>
       {pinyin ? (
        <PinyinText as="span" tone="accent" weight="bold" clamp="one">
         {pinyin}
        </PinyinText>
       ) : null}
       <MandarinSpeakButton text={hanzi} />
      </div>
     )}
    </div>
    <div className="flex h-11 shrink-0 items-center gap-1">
     <WordOccurrencesHint hanzi={hanzi} />
     <CharacterNoteHint text={hanzi} />
     <Button
      type="button"
      variant={isSavedToVault ? "active" : "ghost"}
      size="compact"
      onClick={() =>
       learning.toggleCustomVocabByHanzi({
        hanzi,
        pinyin,
        meaning: rawMeaning || meaning || hanzi,
        hanviet: rawHanviet || hanviet || undefined,
        pos: category || undefined,
       })
      }
      title={isSavedToVault ? t("savedInVaultTitle") : t("saveToVaultTitle")}
      aria-label={
       isSavedToVault ? t("removeFromVaultAria", { hanzi }) : t("saveToVaultAria", { hanzi })
      }
     >
      {isSavedToVault ? <Check className="size-3.5" /> : <BookmarkPlus className="size-3.5" />}
      <span className="hidden sm:inline">
       {isSavedToVault ? t("savedInVault") : t("saveToVault")}
      </span>
     </Button>
    </div>
   </div>
   <div className="flex min-w-0 flex-wrap items-center gap-2">
    {hanviet && (
     <StudyInstructionText
      variant="label"
      tone="muted"
      weight="bold"
      wrapping="preWrap"
      tracking="wide"
      transform="uppercase"
     >
      {hanviet}
     </StudyInstructionText>
    )}
    {category && (
     <Badge size="sm" casing="natural">
      {category}
     </Badge>
    )}
   </div>
   {meaning && (
    <StudyInstructionText variant="bodySmall" tone="secondary" weight="semibold" wrapping="preWrap">
     {meaning}
    </StudyInstructionText>
   )}
   {children}
  </Card>
 );
}
