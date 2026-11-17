"use client";

import type { VocabularyItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";

import type { LessonDisplayMode } from "./types";
import { PinyinText, ReaderHanziText } from "./hanzi-typography";
import { VocabPreviewRow } from "./overview/VocabPreviewRow";
import { VocabularyCardGrid } from "./overview/VocabularyCardList";
import { asRecord, stringValue } from "./utils";

function vocabMeaning(item: VocabularyItem) {
 const record = asRecord(item);

 return (
  item.meaning_vi ||
  stringValue(record, "meaning") ||
  stringValue(record, "vi") ||
  stringValue(record, "gloss_vi") ||
  stringValue(record, "definition_vi") ||
  stringValue(record, "translation_vi")
 );
}

export function VocabMiniGrid({
 items,
 displayMode,
}: {
 items: VocabularyItem[];
 displayMode: LessonDisplayMode;
}) {
 return (
  <div className="grid gap-2">
   <VocabularyCardGrid>
    {items.map((item) => {
     const meaning = vocabMeaning(item);
     const hanviet = stringValue(asRecord(item), "hanviet");
     const category = item.pos === "unknown" ? "" : item.pos;
     return (
      <VocabPreviewRow
       key={item.id}
       hanzi={item.hanzi}
       pinyin={item.pinyin}
       hanviet={hanviet}
       category={category}
       meaning={meaning}
       header={
        <div className="flex min-w-0 flex-wrap items-center gap-2">
         <ReaderHanziText
          displayMode={displayMode}
          tone="default"
          weight="black"
          leading="compactLearner"
         >
          {item.hanzi}
         </ReaderHanziText>
         {displayMode.showPinyin && item.pinyin ? (
          <PinyinText as="span" tone="accent" weight="bold">
           {item.pinyin}
          </PinyinText>
         ) : null}
         <MandarinSpeakButton text={item.hanzi} />
        </div>
       }
      />
     );
    })}
   </VocabularyCardGrid>
  </div>
 );
}
