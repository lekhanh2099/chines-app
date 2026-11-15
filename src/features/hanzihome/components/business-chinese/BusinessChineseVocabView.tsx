"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import { matchesVocabularyQuery } from "@/features/hanzihome/components/lesson-overview/overview/vocabulary-search";
import {
 VocabularyListToolbar,
 VocabularyNoResults,
 VocabularyPipActions,
} from "@/features/hanzihome/components/lesson-overview/overview/VocabularyCardList";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { BusinessChineseSection } from "./BusinessChineseSection";
import { TextbookVocabularyPreview } from "./TextbookVocabularyPreview";
import type { BusinessChinesePipControls } from "./useBusinessChinesePip";

/** Owns the vocab tab search query; it persists across tab switches within the lesson. */
export function useBusinessChineseVocabSearch(vocab: TextbookLesson["vocab"]) {
 const [vocabSearchQuery, setVocabSearchQuery] = useState("");
 const filteredVocab = useMemo(() => {
  return vocab.filter((word) =>
   matchesVocabularyQuery(vocabSearchQuery, [word.hanzi, word.pinyin, word.meaning, word.hanviet]),
  );
 }, [vocab, vocabSearchQuery]);
 return { vocabSearchQuery, setVocabSearchQuery, filteredVocab };
}

/** The lesson "vocab" tab: search, review/PiP launchers and the vocabulary sections. */
export function BusinessChineseVocabView({
 lesson,
 vocabSearchQuery,
 onVocabSearchQueryChange,
 filteredVocab,
 displayMode,
 visibleSections,
 translations,
 canonicalVocabularyTableIds,
 pip,
 onActiveViewChange,
}: {
 lesson: TextbookLesson;
 vocabSearchQuery: string;
 onVocabSearchQueryChange: (query: string) => void;
 filteredVocab: TextbookLesson["vocab"];
 displayMode: LessonDisplayMode;
 visibleSections: TextbookLesson["sections"];
 translations: ReadonlyMap<string, string>;
 canonicalVocabularyTableIds: readonly string[];
 pip: BusinessChinesePipControls;
 onActiveViewChange: (value: string) => void;
}) {
 const t = useTranslations("BusinessChinese");
 const { isPipOpen, isInAppFloatingOpen, pipMode, handleTogglePip } = pip;

 return (
  <div data-textbook-document className="grid min-w-0 gap-3">
   {lesson.vocab.length > 0 ? (
    <VocabularyListToolbar
     totalCount={lesson.vocab.length}
     query={vocabSearchQuery}
     onQueryChange={onVocabSearchQueryChange}
     resultCount={filteredVocab.length}
     actions={
      <>
       <Button type="button" size="toolbar" onClick={() => onActiveViewChange("review")}>
        {t("vocabReview.startReview")}
       </Button>
       <VocabularyPipActions
        dictationActive={(isPipOpen || isInAppFloatingOpen) && pipMode === "dictation"}
        reviewActive={(isPipOpen || isInAppFloatingOpen) && pipMode === "vocab"}
        onToggle={handleTogglePip}
       />
      </>
     }
    />
   ) : null}

   {filteredVocab.length === 0 && vocabSearchQuery ? (
    <VocabularyNoResults query={vocabSearchQuery} />
   ) : null}

   {filteredVocab.length > 0 && canonicalVocabularyTableIds.length === 0 ? (
    <TextbookVocabularyPreview vocabulary={filteredVocab} displayMode={displayMode} />
   ) : null}

   {visibleSections.map((section) => (
    <BusinessChineseSection
     key={section.id}
     section={section}
     displayMode={displayMode}
     translations={translations}
     canonicalVocabularyTableIds={canonicalVocabularyTableIds}
     vocabularyPreview={
      section.blocks.some((block) => block.id === canonicalVocabularyTableIds[0]) ? (
       <TextbookVocabularyPreview vocabulary={filteredVocab} displayMode={displayMode} />
      ) : undefined
     }
    />
   ))}
  </div>
 );
}
