"use client";

import { useTranslations } from "next-intl";

import { Typography } from "@/components/ui/display/typography";
import { VocabPreviewRow } from "@/features/hanzihome/components/lesson-overview/overview/VocabPreviewRow";
import {
 VocabularyCardList,
 VocabularyPipActions,
} from "@/features/hanzihome/components/lesson-overview/overview/VocabularyCardList";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type { UniversalPipMode } from "@/features/hanzihome/components/review/UniversalAmbientPip";
import { formatContextualReadingPinyin } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import {
 analyzeDailyReadingText,
 type DailyReadingVocabularyItem,
} from "@/features/daily-reading/components/daily-reading-library-utils";

type DailyReadingVocabularyTabProps = {
 vocabItems: readonly DailyReadingVocabularyItem[];
 filteredVocabItems: readonly DailyReadingVocabularyItem[];
 vocabSearchQuery: string;
 onVocabSearchQueryChange(value: string): void;
 displayMode: LessonDisplayMode;
 isPipActive: boolean;
 pipMode: UniversalPipMode;
 onTogglePip(mode: UniversalPipMode): void;
};

export function DailyReadingVocabularyTab({
 vocabItems,
 filteredVocabItems,
 vocabSearchQuery,
 onVocabSearchQueryChange,
 displayMode,
 isPipActive,
 pipMode,
 onTogglePip,
}: DailyReadingVocabularyTabProps) {
 const t = useTranslations("DailyReading");
 return (
  <VocabularyCardList
   totalCount={vocabItems.length}
   query={vocabSearchQuery}
   onQueryChange={onVocabSearchQueryChange}
   resultCount={filteredVocabItems.length}
   actions={
    <VocabularyPipActions
     dictationActive={isPipActive && pipMode === "dictation"}
     reviewActive={isPipActive && pipMode === "vocab"}
     onToggle={onTogglePip}
    />
   }
  >
   {filteredVocabItems.map((item) => {
    const itemPronunciation = analyzeDailyReadingText(item.hanzi);
    const resolvedPinyin =
     itemPronunciation !== null ? formatContextualReadingPinyin(itemPronunciation) : "";
    return (
     <VocabPreviewRow
      key={item.id}
      hanzi={item.hanzi}
      pinyin={displayMode.showPinyin ? resolvedPinyin : ""}
      rawPinyin={resolvedPinyin}
      hanviet=""
      category={item.categoryVi}
      meaning={displayMode.showMeaning ? item.meaningVi : ""}
      rawMeaning={item.meaningVi}
     >
      {displayMode.showMeaning && item.meaningInContextVi ? (
       <Typography variant="caption" tone="muted">
        {t("generated.vocabulary.inContext", { meaning: item.meaningInContextVi })}
       </Typography>
      ) : null}
     </VocabPreviewRow>
    );
   })}
  </VocabularyCardList>
 );
}
