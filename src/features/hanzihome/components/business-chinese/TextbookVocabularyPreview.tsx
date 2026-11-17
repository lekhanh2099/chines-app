"use client";

import { useTranslations } from "next-intl";
import { Tags } from "lucide-react";
import { LessonPreviewCard } from "@/features/hanzihome/components/lesson-overview/overview/LessonPreviewCard";
import { VocabStatusControl } from "@/features/hanzihome/components/lesson-overview/overview/VocabStatusControl";
import { VocabPreviewRow } from "@/features/hanzihome/components/lesson-overview/overview/VocabPreviewRow";
import { VocabularyCardGrid } from "@/features/hanzihome/components/lesson-overview/overview/VocabularyCardList";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { SpeakableBusinessChineseText } from "./BusinessChineseText";

/** Textbook vocabulary as shared vocabulary cards with the textbook's pronunciation-aware header. */
export function TextbookVocabularyCards({
 vocabulary,
 displayMode,
}: {
 vocabulary: TextbookLesson["vocab"];
 displayMode: LessonDisplayMode;
}) {
 return vocabulary.map((word) => (
  <VocabPreviewRow
   key={word.id}
   hanzi={word.hanzi}
   pinyin={word.pinyin}
   hanviet={displayMode.showMeaning ? word.hanviet : ""}
   category={word.pos}
   meaning={displayMode.showMeaning ? word.meaning : ""}
   rawMeaning={word.meaning}
   rawHanviet={word.hanviet}
   header={
    <SpeakableBusinessChineseText
     pronunciationId={word.id}
     text={word.hanzi}
     sourcePinyin={word.pinyin}
     displayMode={displayMode}
     variant="body"
    />
   }
  >
   <VocabStatusControl progressId={word.id} hanzi={word.hanzi} />
  </VocabPreviewRow>
 ));
}

export function TextbookVocabularyPreview({
 vocabulary,
 onOpenVocabulary,
 displayMode,
}: {
 vocabulary: TextbookLesson["vocab"];
 onOpenVocabulary?: () => void;
 displayMode: LessonDisplayMode;
}) {
 const t = useTranslations("BusinessChinese");

 if (!onOpenVocabulary) {
  return (
   <VocabularyCardGrid>
    <TextbookVocabularyCards vocabulary={vocabulary} displayMode={displayMode} />
   </VocabularyCardGrid>
  );
 }

 return (
  <LessonPreviewCard
   icon={Tags}
   eyebrow={t("vocabularyPreview.eyebrow")}
   title={t("vocabularyPreview.title", { count: vocabulary.length })}
   actionLabel={t("vocabularyPreview.open")}
   onAction={onOpenVocabulary}
  >
   <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 scrollbar-soft sm:grid-cols-2">
    <TextbookVocabularyCards vocabulary={vocabulary} displayMode={displayMode} />
   </div>
  </LessonPreviewCard>
 );
}
