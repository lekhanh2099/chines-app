"use client";

import { useTranslations } from "next-intl";
import { Tags } from "lucide-react";
import { LessonPreviewCard } from "@/features/hanzihome/components/lesson-overview/overview/LessonPreviewCard";
import { VocabPreviewRow } from "@/features/hanzihome/components/lesson-overview/overview/VocabPreviewRow";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { SpeakableBusinessChineseText } from "./BusinessChineseText";

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
   <div className="grid gap-2 sm:grid-cols-2">
    {vocabulary.map((word) => (
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
     />
    ))}
   </div>
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
    {vocabulary.map((word) => (
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
     />
    ))}
   </div>
  </LessonPreviewCard>
 );
}
