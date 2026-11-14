"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Typography } from "@/components/ui/display/typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { LessonDictationWorkspace } from "@/features/hanzihome/practice/LessonDictationWorkspace";
import { LessonTranslationWorkspace } from "@/features/hanzihome/practice/LessonTranslationWorkspace";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import { BusinessChineseOverviewCard } from "./BusinessChineseOverviewCard";
import {
 BusinessChineseReviewView,
 type BusinessChineseReviewMode,
} from "./BusinessChineseReviewView";
import { BusinessChineseSectionsView } from "./BusinessChineseSectionsView";
import {
 BusinessChineseVocabView,
 type useBusinessChineseVocabSearch,
} from "./BusinessChineseVocabView";
import { TextbookNoteAccessCard } from "./TextbookNoteAccessCard";
import type { useBusinessChineseAnnotationServices } from "./useBusinessChineseAnnotationServices";
import type {
 useBusinessChineseLessonSections,
 useBusinessChinesePracticeMaterials,
} from "./useBusinessChineseLessonContent";
import type { BusinessChinesePipControls } from "./useBusinessChinesePip";
import type { useBusinessChineseSectionReaderServices } from "./useBusinessChineseSectionReaderServices";

type AnnotationServices = ReturnType<typeof useBusinessChineseAnnotationServices>;

/** Renders the body of the active workspace tab; state stays with the workspace content. */
export function BusinessChineseWorkspaceViews({
 lesson,
 activeView,
 onActiveViewChange,
 displayMode,
 effectiveDisplayMode,
 readerContent,
 bookKey,
 annotationError,
 annotationsError,
 lessonSections,
 practice,
 vocabSearch,
 sectionReaders,
 textReaderDocument,
 pip,
 reviewMode,
 onReviewModeChange,
 onSelectSection,
 showDesktopSectionNavigation,
 showGrammarNavigation,
 isInteractivePracticeOpen,
 onInteractivePracticeOpenChange,
}: {
 lesson: TextbookLesson;
 activeView: string;
 onActiveViewChange: (value: string) => void;
 displayMode: LessonDisplayMode;
 effectiveDisplayMode: LessonDisplayMode;
 readerContent: ReactNode;
 bookKey: string;
 annotationError: AnnotationServices["annotationError"];
 annotationsError: AnnotationServices["annotationsError"];
 lessonSections: ReturnType<typeof useBusinessChineseLessonSections>;
 practice: ReturnType<typeof useBusinessChinesePracticeMaterials>;
 vocabSearch: ReturnType<typeof useBusinessChineseVocabSearch>;
 sectionReaders: ReturnType<typeof useBusinessChineseSectionReaderServices>;
 textReaderDocument: ReaderDocumentModel;
 pip: BusinessChinesePipControls;
 reviewMode: BusinessChineseReviewMode;
 onReviewModeChange: (mode: BusinessChineseReviewMode) => void;
 onSelectSection: (sectionId: string) => void;
 showDesktopSectionNavigation: boolean;
 showGrammarNavigation: boolean;
 isInteractivePracticeOpen: boolean;
 onInteractivePracticeOpenChange: Dispatch<SetStateAction<boolean>>;
}) {
 const { pairedTranslations, contentSections, canonicalVocabularyTableIds, visibleSections } =
  lessonSections;
 const { isPipOpen, isInAppFloatingOpen, pipMode, handleTogglePip } = pip;

 return (
  <div className="grid min-w-0 gap-3 pb-4">
   {annotationError || annotationsError ? (
    <Typography variant="bodySmall" tone="danger" role="alert">
     {annotationError || annotationsError?.message}
    </Typography>
   ) : null}
   {activeView === "overview" ? (
    <BusinessChineseOverviewCard
     lesson={lesson}
     displayMode={displayMode}
     sectionCount={contentSections.length}
    />
   ) : null}

   {activeView === "text" ? (
    <div data-textbook-document className="min-w-0">
     {readerContent}
    </div>
   ) : null}

   {activeView === "notes" ? <TextbookNoteAccessCard lesson={lesson} /> : null}

   {activeView === "translation" ? (
    <LessonTranslationWorkspace segments={practice.translationSegments} displayMode={displayMode} />
   ) : null}

   {activeView === "dictation" ? (
    <LessonDictationWorkspace
     lesson={lesson}
     sources={practice.dictationSources}
     titleVi={lesson.title}
     titleZh={lesson.bookLabel}
     onOpenPip={() => handleTogglePip("dictation")}
     isPipActive={(isPipOpen || isInAppFloatingOpen) && pipMode === "dictation"}
    />
   ) : null}

   {activeView === "review" ? (
    <BusinessChineseReviewView
     lesson={lesson}
     reviewMode={reviewMode}
     onReviewModeChange={onReviewModeChange}
     contextualDrills={practice.contextualDrills}
     pip={pip}
     vocabItems={practice.reviewLesson.vocab}
     grammarItems={practice.textbookGrammarPoints}
     practiceItems={practice.universalTextbookPracticeItems}
    />
   ) : null}

   {activeView === "vocab" ? (
    <BusinessChineseVocabView
     lesson={lesson}
     vocabSearchQuery={vocabSearch.vocabSearchQuery}
     onVocabSearchQueryChange={vocabSearch.setVocabSearchQuery}
     filteredVocab={vocabSearch.filteredVocab}
     displayMode={effectiveDisplayMode}
     visibleSections={visibleSections}
     translations={pairedTranslations}
     canonicalVocabularyTableIds={canonicalVocabularyTableIds}
     pip={pip}
     onActiveViewChange={onActiveViewChange}
    />
   ) : null}

   {activeView !== "text" &&
   activeView !== "notes" &&
   activeView !== "translation" &&
   activeView !== "dictation" &&
   activeView !== "review" &&
   activeView !== "vocab" ? (
    <BusinessChineseSectionsView
     lesson={lesson}
     activeView={activeView}
     onActiveViewChange={onActiveViewChange}
     displayMode={displayMode}
     visibleSections={visibleSections}
     onSelectSection={onSelectSection}
     showDesktopSectionNavigation={showDesktopSectionNavigation}
     showGrammarNavigation={showGrammarNavigation}
     translations={pairedTranslations}
     canonicalVocabularyTableIds={canonicalVocabularyTableIds}
     bookKey={bookKey}
     sectionDocuments={sectionReaders.sectionDocuments}
     textReaderDocument={textReaderDocument}
     firstSectionServices={sectionReaders.firstSectionServices}
     otherSectionServices={sectionReaders.otherSectionServices}
     translationSegments={practice.translationSegments}
     dictationSources={practice.dictationSources}
     practiceItems={practice.universalTextbookPracticeItems}
     isInteractivePracticeOpen={isInteractivePracticeOpen}
     onInteractivePracticeOpenChange={onInteractivePracticeOpenChange}
     pip={pip}
    />
   ) : null}
  </div>
 );
}
