"use client";

import type { ReactNode } from "react";

import { GrammarWorkspace } from "@/features/hanzihome/components/grammar/GrammarWorkspace";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/notes/LessonNoteAccessCard";
import { LessonOverview } from "@/features/hanzihome/components/LessonOverview";
import {
 LessonTextInlineEditor,
 ReadOnlyLessonTextWorkspace,
} from "@/features/hanzihome/components/lesson-text/LessonTextInlineEditor";
import { PracticeWorkspace } from "@/features/hanzihome/practice/PracticeWorkspace";
import { ReviewWorkspace } from "@/features/hanzihome/components/review/ReviewWorkspace";
import { VocabWorkspace } from "@/features/hanzihome/components/vocab/VocabWorkspace";
import type { StudyModule } from "@/features/hanzihome/context/types";
import { ListeningWorkspace } from "@/features/hanzihome/listening/ListeningWorkspace";
import { ListeningDictationWorkspace } from "@/features/hanzihome/listening/ListeningDictationWorkspace";
import { LessonAnnotationProvider } from "@/features/hanzihome/annotations/LessonAnnotationProvider";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { getBookSections } from "@/features/hanzihome/components/lesson-overview/utils";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { TextbookSectionCard } from "@/features/hanzihome/components/lesson-text/TextbookSectionCard";

export function LessonModuleContent({
 module,
 compact = false,
 lessonTextSelectedSectionId,
 onSelectLessonTextSection,
 readerToolsMenuContent,
 readerToolsSheetContent,
}: {
 module: StudyModule;
 compact?: boolean;
 lessonTextSelectedSectionId: string;
 onSelectLessonTextSection: (sectionId: string) => void;
 readerToolsMenuContent?: ReactNode;
 readerToolsSheetContent?: ReactNode;
}) {
 const runtime = useHanziHomeRuntime();
 const { lesson } = runtime;
 const supplementalSections = getBookSections(lesson.sourceLesson).filter(
  (section) =>
   (module === "vocab" && section.type === "proper_nouns") ||
   (module === "notes" && section.type === "notes") ||
   (module === "overview" && section.type === "summary"),
 );

 if (runtime.readOnly) {
  return (
   <ReadOnlyLessonTextWorkspace
    module={module}
    compact={compact}
    selectedSectionId={lessonTextSelectedSectionId}
    onSelectSection={onSelectLessonTextSection}
   />
  );
 }

 let content;
 switch (module) {
  case "overview":
   content = <LessonOverview />;
   break;
  case "lessonText":
   content = (
    <LessonTextInlineEditor
     compact={compact}
     selectedSectionId={lessonTextSelectedSectionId}
     onSelectSection={onSelectLessonTextSection}
     readerToolsMenuContent={readerToolsMenuContent}
     readerToolsSheetContent={readerToolsSheetContent}
    />
   );
   break;
  case "practice":
   content = (
    <PracticeWorkspace
     compact={compact}
     selectedSectionId={lessonTextSelectedSectionId}
     onSelectSection={onSelectLessonTextSection}
    />
   );
   break;
  case "listening":
   content = <ListeningWorkspace />;
   break;
  case "dictation":
   content = <ListeningDictationWorkspace />;
   break;
  case "script":
   content = <ListeningWorkspace />;
   break;
  case "notes":
   content = <LessonNoteAccessCard compact={supplementalSections.length === 0} />;
   break;
  case "vocab":
   content = <VocabWorkspace compact={compact} />;
   break;
  case "grammar":
   content = <GrammarWorkspace compact={compact} />;
   break;
  case "review":
   content = <ReviewWorkspace />;
   break;
 }

 return (
  <LessonAnnotationProvider lessonId={lesson.id}>
   {supplementalSections.length > 0 ? (
    <div className="grid h-full min-h-0 gap-3 overflow-y-auto">
     {content}
     {supplementalSections.map(({ section }) => (
      <TextbookSectionCard
       key={section.id}
       lessonId={lesson.id}
       section={section}
       sectionPath={[
        "lesson",
        "sections",
        lesson.sourceLesson?.lesson.sections.findIndex((item) => item.id === section.id) ?? -1,
       ]}
       displayMode={
        runtime.learningState.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE
       }
       interactiveReading={false}
       readingMode={false}
      />
     ))}
    </div>
   ) : (
    content
   )}
  </LessonAnnotationProvider>
 );
}
