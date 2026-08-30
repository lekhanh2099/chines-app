"use client";

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

export function LessonModuleContent({
 module,
 compact = false,
 lessonTextSelectedSectionId,
 onSelectLessonTextSection,
}: {
 module: StudyModule;
 compact?: boolean;
 lessonTextSelectedSectionId: string;
 onSelectLessonTextSection: (sectionId: string) => void;
}) {
 const runtime = useHanziHomeRuntime();
 const { lesson } = runtime;

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
   content = <LessonNoteAccessCard compact />;
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

 return <LessonAnnotationProvider lessonId={lesson.id}>{content}</LessonAnnotationProvider>;
}
