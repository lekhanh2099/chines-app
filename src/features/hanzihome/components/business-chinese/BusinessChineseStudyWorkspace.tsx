"use client";

import { useEffect, useMemo } from "react";
import { HanziHomeWorkspaceLoading } from "@/features/hanzihome/components/layout/HanziHomeWorkspaceLoading";
import { buildBusinessChineseReaderDocument } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import { ReaderPronunciationSessionProvider } from "@/features/hanzihome/reader-adapters/reader-pronunciation-session";
import type {
 TextbookBookSummary,
 TextbookLesson,
} from "@/features/hanzihome/static-json/textbook-catalog";
import { rememberTextbookLesson } from "@/features/hanzihome/static-json/textbook-lesson-client";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";
import { MandarinTtsProvider } from "@/features/speech/MandarinTtsProvider";
import { BusinessChineseReader } from "./BusinessChineseReader";
import {
 clearPendingTextbookLesson,
 usePendingTextbookLessonId,
} from "./pending-textbook-lesson-store";
import { BusinessChineseStudyWorkspaceContent } from "./BusinessChineseStudyWorkspaceContent";
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
 // The learner picked another lesson: show the loading state at once; this
 // workspace is replaced when that lesson's page arrives.
 const pendingLessonId = usePendingTextbookLessonId();
 const isLeavingLesson = pendingLessonId !== "" && pendingLessonId !== initialLesson.id;
 useEffect(() => {
  if (pendingLessonId === initialLesson.id) clearPendingTextbookLesson();
 }, [initialLesson.id, pendingLessonId]);
 useEffect(() => clearPendingTextbookLesson, []);
 // An opened lesson stays readable offline without downloading it a second time.
 useEffect(() => {
  void rememberTextbookLesson(initialLesson);
 }, [initialLesson]);
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
 const placeToolbarInLayout = activeView === "text";
 const readerDocument = useMemo(
  () => buildBusinessChineseReaderDocument(lesson, activeView),
  [activeView, lesson],
 );
 useBusinessChineseLessonResume(lessonView);

 const workspaceReaderServices = useMemo<ReaderServices>(
  () => ({
   placeToolbarInLayout,
   compactContent: true,
   toolbar: {
    hidePinyinToggle: true,
    hideTranslationToggle: true,
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

 if (shouldRestoreLesson || isLeavingLesson) return <HanziHomeWorkspaceLoading />;

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
