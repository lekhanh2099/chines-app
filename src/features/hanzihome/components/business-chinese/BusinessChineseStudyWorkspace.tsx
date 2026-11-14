"use client";

import { useMemo } from "react";
import { HanziHomeWorkspaceLoading } from "@/features/hanzihome/components/layout/HanziHomeWorkspaceLoading";
import { buildBusinessChineseReaderDocument } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import { ReaderPronunciationSessionProvider } from "@/features/hanzihome/reader-adapters/reader-pronunciation-session";
import type {
 TextbookBookSummary,
 TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";
import { MandarinTtsProvider } from "@/features/speech/MandarinTtsProvider";
import { BusinessChineseReader } from "./BusinessChineseReader";
import { BusinessChineseStudyWorkspaceContent } from "./BusinessChineseStudyWorkspaceContent";
import { useBusinessChineseToolbarNavMenu } from "./BusinessChineseWorkspaceToolbar";
import {
 useBusinessChineseLessonResume,
 useBusinessChineseLessonView,
 useBusinessChineseWideToolbar,
} from "./useBusinessChineseLessonView";

export function BusinessChineseStudyWorkspace({
 books: initialBooks,
 lesson: initialLesson,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
}) {
 const lessonView = useBusinessChineseLessonView({ books: initialBooks, lesson: initialLesson });
 const {
  lesson,
  books,
  bookKey,
  shouldRestoreLesson,
  displayMode,
  isLessonBookmarked,
  handleToggleCurrentLessonBookmark,
  tabs,
  activeView,
  setActiveView,
 } = lessonView;
 const hasWideToolbar = useBusinessChineseWideToolbar();
 const placeToolbarInLayout = activeView === "text" && hasWideToolbar;
 const readerDocument = useMemo(
  () => buildBusinessChineseReaderDocument(lesson, activeView),
  [activeView, lesson],
 );
 useBusinessChineseLessonResume(lessonView);

 const toolbarNavMenu = useBusinessChineseToolbarNavMenu({
  tabs,
  activeView,
  onActiveViewChange: setActiveView,
  isLessonBookmarked,
  onToggleLessonBookmark: handleToggleCurrentLessonBookmark,
  className: "xl:hidden",
 });

 const workspaceReaderServices = useMemo<ReaderServices>(
  () => ({
   placeToolbarInLayout,
   toolbar: {
    actions: toolbarNavMenu,
    hidePinyinToggle: !placeToolbarInLayout,
    hideTranslationToggle: !placeToolbarInLayout,
   },
   renderReader: ({ content, toolbar }) => (
    <BusinessChineseStudyWorkspaceContent
     books={books}
     lesson={lesson}
     activeView={activeView}
     onActiveViewChange={setActiveView}
     tabs={tabs}
     isLessonBookmarked={isLessonBookmarked}
     onToggleLessonBookmark={handleToggleCurrentLessonBookmark}
     readerContent={content}
     readerToolbar={toolbar}
     hasWideToolbar={hasWideToolbar}
     bookKey={bookKey}
     displayMode={displayMode}
    />
   ),
  }),
  [
   placeToolbarInLayout,
   toolbarNavMenu,
   books,
   lesson,
   activeView,
   setActiveView,
   tabs,
   isLessonBookmarked,
   handleToggleCurrentLessonBookmark,
   hasWideToolbar,
   bookKey,
   displayMode,
  ],
 );

 if (shouldRestoreLesson) return <HanziHomeWorkspaceLoading />;

 return (
  <MandarinTtsProvider>
   <ReaderPronunciationSessionProvider key={lesson.id}>
    <BusinessChineseReader
     key={readerDocument.id}
     document={readerDocument}
     bookKey={bookKey}
     services={workspaceReaderServices}
    />
   </ReaderPronunciationSessionProvider>
  </MandarinTtsProvider>
 );
}
