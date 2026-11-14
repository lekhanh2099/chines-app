"use client";

import { createPortal } from "react-dom";

import { UniversalAmbientPip } from "@/features/hanzihome/components/review/UniversalAmbientPip";
import {
 buildExercisesFromVocabItems,
 customVocabListToHanziHomeVocabItems,
} from "@/features/hanzihome/components/review/vocab-hub-custom";
import { formatContextualReadingPinyin } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import type { DailyReading } from "@/features/daily-reading/model/daily-reading.schemas";
import {
 analyzeDailyReadingText,
 type DailyReadingVocabularyItem,
} from "@/features/daily-reading/components/daily-reading-library-utils";
import type { useDailyReadingPip } from "@/features/daily-reading/hooks/useDailyReadingPip";

type DailyReadingVocabPipProps = {
 reading: DailyReading;
 vocabItems: readonly DailyReadingVocabularyItem[];
 pip: ReturnType<typeof useDailyReadingPip>;
};

/** Renders the vocabulary PiP in the Document PiP window or the in-app floating fallback. */
export function DailyReadingVocabPip({ reading, vocabItems, pip }: DailyReadingVocabPipProps) {
 const pipVocabItems = customVocabListToHanziHomeVocabItems(
  vocabItems.map((item) => {
   const itemPronunciation = analyzeDailyReadingText(item.hanzi);
   return {
    id: item.id,
    hanzi: item.hanzi,
    pinyin: itemPronunciation ? formatContextualReadingPinyin(itemPronunciation) : "",
    meaning: item.meaningVi,
    pos: item.categoryVi,
    note: item.meaningInContextVi,
    createdAt: reading.capturedAt,
   };
  }),
 );
 const pipPracticeItems = buildExercisesFromVocabItems(pipVocabItems);
 return (
  <>
   {pip.isPipOpen && pip.pipWindow
    ? createPortal(
       <UniversalAmbientPip
        initialMode={pip.pipMode}
        lessonTitle={reading.article.titleZh}
        vocabItems={pipVocabItems}
        practiceItems={pipPracticeItems}
        onClose={pip.closePip}
       />,
       pip.pipWindow.document.body,
      )
    : null}
   {pip.isInAppFloatingOpen ? (
    <UniversalAmbientPip
     initialMode={pip.pipMode}
     lessonTitle={reading.article.titleZh}
     vocabItems={pipVocabItems}
     practiceItems={pipPracticeItems}
     onClose={() => pip.setIsInAppFloatingOpen(false)}
     isFloatingInApp
    />
   ) : null}
  </>
 );
}
