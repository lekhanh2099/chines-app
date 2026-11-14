"use client";

import { Fragment, type Dispatch, type SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { PictureInPicture2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Separator } from "@/components/ui/layout/separator";
import { UniversalExerciseRunner } from "@/features/hanzihome/components/practice/UniversalExerciseRunner";
import type { UniversalExerciseItem } from "@/features/hanzihome/components/practice/universal-exercise.types";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type {
 DictationSource,
 TranslationSegment,
} from "@/features/hanzihome/practice/translation-practice";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";
import { cn } from "@/lib/utils";
import { BusinessChineseReader } from "./BusinessChineseReader";
import { BusinessChineseSection } from "./BusinessChineseSection";
import { DesktopSectionNavigation } from "./BusinessChineseSectionNavigation";
import { TextbookVocabularyPreview } from "./TextbookVocabularyPreview";
import { businessChineseDictationCount } from "./business-chinese-study-utils";
import type { BusinessChinesePipControls } from "./useBusinessChinesePip";

type PracticeMaterials = {
 translationSegments: readonly TranslationSegment[];
 dictationSources: readonly DictationSource[];
 practiceItems: readonly UniversalExerciseItem[];
};

/** Launchers shown above the practice tab sections: step-by-step runner, PiP, translation, dictation. */
function BusinessChinesePracticeToolbar({
 translationSegments,
 dictationSources,
 practiceItems,
 isInteractivePracticeOpen,
 onInteractivePracticeOpenChange,
 pip,
 onActiveViewChange,
}: PracticeMaterials & {
 isInteractivePracticeOpen: boolean;
 onInteractivePracticeOpenChange: Dispatch<SetStateAction<boolean>>;
 pip: BusinessChinesePipControls;
 onActiveViewChange: (value: string) => void;
}) {
 const t = useTranslations("BusinessChinese");
 const { isPipOpen, isInAppFloatingOpen, pipMode, handleTogglePip } = pip;

 return (
  <Card variant="subtle" padding="sm" className="flex min-w-0 flex-wrap items-center gap-2">
   {practiceItems.length > 0 ? (
    <Button
     type="button"
     size="compact"
     variant={isInteractivePracticeOpen ? "outline" : "default"}
     onClick={() => onInteractivePracticeOpenChange((prev) => !prev)}
    >
     <Sparkles className="size-3.5" />
     <span>
      {isInteractivePracticeOpen
       ? "Đóng chế độ từng câu"
       : `Luyện tập từng câu (${practiceItems.length} câu)`}
     </span>
    </Button>
   ) : null}
   {practiceItems.length > 0 ? (
    <Button
     type="button"
     size="compact"
     variant={(isPipOpen || isInAppFloatingOpen) && pipMode === "practice" ? "active" : "outline"}
     onClick={() => handleTogglePip("practice")}
     title="Mở cửa sổ nổi PiP để luyện tập bài tập"
    >
     <PictureInPicture2 className="size-3.5" />
     <span>
      {(isPipOpen || isInAppFloatingOpen) && pipMode === "practice"
       ? "Đang mở PiP"
       : "Cửa sổ nổi (PiP)"}
     </span>
    </Button>
   ) : null}
   {translationSegments.length > 0 ? (
    <Button
     type="button"
     size="compact"
     variant="outline"
     title={t("practice.translation.description")}
     onClick={() => onActiveViewChange("translation")}
    >
     {t("practice.translation.open", { count: translationSegments.length })}
    </Button>
   ) : null}
   {dictationSources.length > 0 ? (
    <Button
     type="button"
     size="compact"
     variant="outline"
     title={t("practice.dictation.description")}
     onClick={() => onActiveViewChange("dictation")}
    >
     {t("practice.dictation.open", {
      count: businessChineseDictationCount(dictationSources),
     })}
    </Button>
   ) : null}
  </Card>
 );
}

/**
 * The section-document views ("all", "overview", "core", "grammar", "practice"):
 * optional desktop section navigation and the lesson sections, with text sections
 * rendered through their own reader.
 */
export function BusinessChineseSectionsView({
 lesson,
 activeView,
 onActiveViewChange,
 displayMode,
 visibleSections,
 onSelectSection,
 showDesktopSectionNavigation,
 showGrammarNavigation,
 translations,
 canonicalVocabularyTableIds,
 bookKey,
 sectionDocuments,
 textReaderDocument,
 firstSectionServices,
 otherSectionServices,
 translationSegments,
 dictationSources,
 practiceItems,
 isInteractivePracticeOpen,
 onInteractivePracticeOpenChange,
 pip,
}: PracticeMaterials & {
 lesson: TextbookLesson;
 activeView: string;
 onActiveViewChange: (value: string) => void;
 displayMode: LessonDisplayMode;
 visibleSections: TextbookLesson["sections"];
 onSelectSection: (sectionId: string) => void;
 showDesktopSectionNavigation: boolean;
 showGrammarNavigation: boolean;
 translations: ReadonlyMap<string, string>;
 canonicalVocabularyTableIds: readonly string[];
 bookKey: string;
 sectionDocuments: ReadonlyMap<string, ReaderDocumentModel>;
 textReaderDocument: ReaderDocumentModel;
 firstSectionServices: ReaderServices;
 otherSectionServices: ReaderServices;
 isInteractivePracticeOpen: boolean;
 onInteractivePracticeOpenChange: Dispatch<SetStateAction<boolean>>;
 pip: BusinessChinesePipControls;
}) {
 return (
  <div
   className={cn(
    "grid min-w-0 gap-3",
    showDesktopSectionNavigation && "2xl:grid-cols-[15rem_minmax(0,1fr)]",
   )}
  >
   {showDesktopSectionNavigation ? (
    <DesktopSectionNavigation sections={visibleSections} onSelect={onSelectSection} />
   ) : null}
   <div className="grid min-w-0 gap-3">
    <Card variant="section" padding="lg" data-textbook-document className="grid min-w-0 gap-6">
     {lesson.vocab.length > 0 &&
     canonicalVocabularyTableIds.length === 0 &&
     activeView === "all" ? (
      <TextbookVocabularyPreview
       vocabulary={lesson.vocab}
       displayMode={displayMode}
       onOpenVocabulary={() => onActiveViewChange("vocab")}
      />
     ) : null}
     {activeView === "practice" &&
     (translationSegments.length > 0 || dictationSources.length > 0 || practiceItems.length > 0) ? (
      <BusinessChinesePracticeToolbar
       translationSegments={translationSegments}
       dictationSources={dictationSources}
       practiceItems={practiceItems}
       isInteractivePracticeOpen={isInteractivePracticeOpen}
       onInteractivePracticeOpenChange={onInteractivePracticeOpenChange}
       pip={pip}
       onActiveViewChange={onActiveViewChange}
      />
     ) : null}
     {activeView === "practice" && isInteractivePracticeOpen && practiceItems.length > 0 ? (
      <UniversalExerciseRunner
       items={practiceItems}
       title={`Luyện tập bài học: ${lesson.title}`}
       onClose={() => onInteractivePracticeOpenChange(false)}
      />
     ) : null}
     {visibleSections.map((section, index) => {
      // Grammar jumps need the measured height of the preceding sections.
      const content = (
       <BusinessChineseSection
        section={section}
        displayMode={displayMode}
        translations={translations}
        canonicalVocabularyTableIds={canonicalVocabularyTableIds}
        deferLayout={!showGrammarNavigation}
        vocabularyPreview={
         section.blocks.some((block) => block.id === canonicalVocabularyTableIds[0]) ? (
          <TextbookVocabularyPreview
           vocabulary={lesson.vocab}
           displayMode={displayMode}
           onOpenVocabulary={activeView === "all" ? () => onActiveViewChange("vocab") : undefined}
          />
         ) : undefined
        }
       />
      );
      return (
       <Fragment key={section.id}>
        {section.category === "text" ? (
         <div className="content-auto">
          <BusinessChineseReader
           bookKey={bookKey}
           document={sectionDocuments.get(section.id) ?? textReaderDocument}
           services={index === 0 ? firstSectionServices : otherSectionServices}
          />
         </div>
        ) : (
         content
        )}
        {index < visibleSections.length - 1 ? <Separator /> : null}
       </Fragment>
      );
     })}
    </Card>
   </div>
  </div>
 );
}
