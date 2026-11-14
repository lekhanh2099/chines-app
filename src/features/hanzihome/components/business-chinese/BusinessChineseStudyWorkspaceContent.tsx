"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { scrollAppContentToElement } from "@/components/layout/scroll/app-scroll";
import { type SegmentedControlItem } from "@/components/ui/forms/segmented-control";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { useIsLessonCached } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import type {
 TextbookBookSummary,
 TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import {
 ReaderServicesContext,
 useReaderDisplay,
 useReaderSelector,
} from "@/features/reader/runtime/reader-context";
import { cn } from "@/lib/utils";
import { BusinessChineseAnnotationsContext } from "./business-chinese-annotations-context";
import {
 BusinessChineseGrammarNavigationPanel,
 BusinessChineseGrammarNavigationSheet,
 BusinessChineseGrammarNavigationSummary,
 useBusinessChineseGrammarNavigation,
} from "./BusinessChineseGrammarNavigation";
import { BusinessChineseHeaderContextBridge } from "./BusinessChineseHeaderContextBridge";
import { BusinessChineseLessonHeading } from "./BusinessChineseOverviewCard";
import { BusinessChinesePipWindows } from "./BusinessChinesePipWindows";
import { type BusinessChineseReviewMode } from "./BusinessChineseReviewView";
import { useBusinessChineseVocabSearch } from "./BusinessChineseVocabView";
import {
 BusinessChineseCompactViewToolbar,
 BusinessChineseDesktopTabActions,
 useBusinessChineseToolbarNavMenu,
} from "./BusinessChineseWorkspaceToolbar";
import { BusinessChineseWorkspaceViews } from "./BusinessChineseWorkspaceViews";
import { useBusinessChineseAnnotationServices } from "./useBusinessChineseAnnotationServices";
import {
 useBusinessChineseLessonSections,
 useBusinessChinesePracticeMaterials,
} from "./useBusinessChineseLessonContent";
import { useBusinessChineseSectionReaderServices } from "./useBusinessChineseSectionReaderServices";
import { useBusinessChinesePip } from "./useBusinessChinesePip";

export function BusinessChineseStudyWorkspaceContent({
 books,
 lesson,
 activeView,
 onActiveViewChange,
 tabs,
 isLessonBookmarked,
 onToggleLessonBookmark,
 readerContent,
 readerToolbar,
 hasWideToolbar,
 bookKey,
 displayMode,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
 activeView: string;
 onActiveViewChange: (value: string) => void;
 tabs: SegmentedControlItem<string>[];
 isLessonBookmarked: boolean;
 onToggleLessonBookmark: () => void;
 readerContent: ReactNode;
 readerToolbar: ReactNode;
 hasWideToolbar: boolean;
 bookKey: string;
 displayMode: LessonDisplayMode;
}) {
 const t = useTranslations("BusinessChinese");
 const isReviewView = activeView === "review";
 const pip = useBusinessChinesePip();
 const { isPipOpen, isInAppFloatingOpen, pipMode, handleTogglePip } = pip;
 const [reviewMode, setReviewMode] = useState<BusinessChineseReviewMode>("flashcard");
 const [isInteractivePracticeOpen, setIsInteractivePracticeOpen] = useState(false);
 const {
  isOpen: isGrammarNavigationOpen,
  setIsOpen: setIsGrammarNavigationOpen,
  triggerRef: grammarNavigationTriggerRef,
  panelRef: grammarNavigationPanelRef,
 } = useBusinessChineseGrammarNavigation();
 const vocabSearch = useBusinessChineseVocabSearch(lesson.vocab);

 const isLessonOfflineReady = useIsLessonCached(lesson.id);
 const {
  textReaderDocument,
  annotationError,
  annotationsError,
  selectionPopover,
  annotationServices,
  annotationsContextValue,
  readerServicesValue,
 } = useBusinessChineseAnnotationServices(lesson);
 const { value: readerDisplay } = useReaderDisplay();
 const focusMode = useReaderSelector((state) => state.ui.focusMode);

 const lessonSections = useBusinessChineseLessonSections(lesson, activeView);
 const { visibleSections } = lessonSections;
 const showGrammarNavigation = activeView === "grammar" && visibleSections.length > 0;
 const showCompactGrammarToolbar = showGrammarNavigation && !hasWideToolbar;
 const showWideGrammarNavigation = showGrammarNavigation && hasWideToolbar;
 const showDesktopSectionNavigation =
  !showGrammarNavigation && !focusMode && visibleSections.length > 1;
 const effectiveDisplayMode: LessonDisplayMode = useMemo(
  () => ({
   ...displayMode,
   showPinyin: readerDisplay?.showPinyin ?? displayMode.showPinyin,
   showMeaning: readerDisplay?.showMeaning ?? displayMode.showMeaning,
  }),
  [displayMode, readerDisplay?.showMeaning, readerDisplay?.showPinyin],
 );
 const practice = useBusinessChinesePracticeMaterials({
  lesson,
  isReviewView,
  needsPracticeItems: activeView === "practice" || isReviewView || isPipOpen || isInAppFloatingOpen,
 });
 const selectSection = useCallback((sectionId: string) => {
  scrollAppContentToElement(document.getElementById(sectionId), {
   behavior: "smooth",
   block: "start",
   allowViewport: true,
  });
 }, []);

 const toolbarNavMenu = useBusinessChineseToolbarNavMenu({
  tabs,
  activeView,
  onActiveViewChange,
  isLessonBookmarked,
  onToggleLessonBookmark,
  className: !focusMode ? "xl:hidden" : undefined,
 });

 const sectionReaders = useBusinessChineseSectionReaderServices({
  textReaderDocument,
  annotationServices,
  visibleSections,
  onSelectSection: selectSection,
  focusMode,
  toolbarNavMenu,
 });

 const grammarNavigationSummary = (
  <BusinessChineseGrammarNavigationSummary
   sectionCount={visibleSections.length}
   showPipButton={practice.textbookGrammarPoints.length > 0}
   isPipActive={(isPipOpen || isInAppFloatingOpen) && pipMode === "grammar"}
   onOpenPip={() => {
    setIsGrammarNavigationOpen(false);
    void handleTogglePip("grammar");
   }}
  />
 );

 return (
  <BusinessChineseAnnotationsContext.Provider value={annotationsContextValue}>
   <ReaderServicesContext.Provider value={readerServicesValue}>
    <BusinessChineseHeaderContextBridge books={books} lesson={lesson} />
    <div className="hanzihome-static-page hanzihome-workspace-page min-w-0">
     <div className="hanzihome-workspace-shell flex w-full max-w-full flex-col gap-2.5">
      <BusinessChineseLessonHeading books={books} lesson={lesson} />
      {activeView !== "text" && activeView !== "all" && !showGrammarNavigation ? (
       <BusinessChineseCompactViewToolbar
        tabs={tabs}
        activeView={activeView}
        isLessonBookmarked={isLessonBookmarked}
        onToggleLessonBookmark={onToggleLessonBookmark}
        toolbarNavMenu={toolbarNavMenu}
       />
      ) : null}
      <Tabs
       value={activeView}
       items={showCompactGrammarToolbar ? tabs.filter((tab) => tab.key === activeView) : tabs}
       onValueChange={onActiveViewChange}
       actions={
        <BusinessChineseDesktopTabActions
         lesson={lesson}
         readerToolbar={readerToolbar}
         showCompactGrammarToolbar={showCompactGrammarToolbar}
         grammarNavigationTriggerRef={grammarNavigationTriggerRef}
         isGrammarNavigationOpen={isGrammarNavigationOpen}
         onOpenGrammarNavigation={() => setIsGrammarNavigationOpen(true)}
         isLessonBookmarked={isLessonBookmarked}
         onToggleLessonBookmark={onToggleLessonBookmark}
         isLessonOfflineReady={isLessonOfflineReady}
         toolbarNavMenu={toolbarNavMenu}
        />
       }
       aria-label={t("tabsLabel")}
       className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden"
       listClassName="hanzihome-liquid-toolbar flex"
      >
       <TabsContent
        value={activeView}
        className={cn(
         "min-h-0 overflow-hidden",
         showWideGrammarNavigation &&
          "grid grid-cols-[15rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-3",
        )}
       >
        {showWideGrammarNavigation ? (
         <BusinessChineseGrammarNavigationPanel
          panelRef={grammarNavigationPanelRef}
          summary={grammarNavigationSummary}
          sections={visibleSections}
          onSelect={selectSection}
         />
        ) : null}
        <div className="relative h-full min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pr-1 scrollbar-soft">
         <BusinessChineseWorkspaceViews
          lesson={lesson}
          activeView={activeView}
          onActiveViewChange={onActiveViewChange}
          displayMode={displayMode}
          effectiveDisplayMode={effectiveDisplayMode}
          readerContent={readerContent}
          bookKey={bookKey}
          annotationError={annotationError}
          annotationsError={annotationsError}
          lessonSections={lessonSections}
          practice={practice}
          vocabSearch={vocabSearch}
          sectionReaders={sectionReaders}
          textReaderDocument={textReaderDocument}
          pip={pip}
          reviewMode={reviewMode}
          onReviewModeChange={setReviewMode}
          onSelectSection={selectSection}
          showDesktopSectionNavigation={showDesktopSectionNavigation}
          showGrammarNavigation={showGrammarNavigation}
          isInteractivePracticeOpen={isInteractivePracticeOpen}
          onInteractivePracticeOpenChange={setIsInteractivePracticeOpen}
         />
        </div>
       </TabsContent>
      </Tabs>
      {showCompactGrammarToolbar ? (
       <BusinessChineseGrammarNavigationSheet
        isOpen={isGrammarNavigationOpen}
        setIsOpen={setIsGrammarNavigationOpen}
        triggerRef={grammarNavigationTriggerRef}
        panelRef={grammarNavigationPanelRef}
        summary={grammarNavigationSummary}
        sections={visibleSections}
        onSelect={selectSection}
       />
      ) : null}
      {selectionPopover}
      <BusinessChinesePipWindows
       pip={pip}
       lessonTitle={lesson.title}
       vocabItems={practice.reviewLesson.vocab}
       grammarItems={practice.textbookGrammarPoints}
       practiceItems={practice.universalTextbookPracticeItems}
      />
     </div>
    </div>
   </ReaderServicesContext.Provider>
  </BusinessChineseAnnotationsContext.Provider>
 );
}
