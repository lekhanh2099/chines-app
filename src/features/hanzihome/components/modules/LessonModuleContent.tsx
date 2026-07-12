"use client";

import { GrammarWorkspace } from "@/features/hanzihome/components/grammar/GrammarWorkspace";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/notes/LessonNoteAccessCard";
import { LessonOverview } from "@/features/hanzihome/components/LessonOverview";
import { LessonTextInlineEditor } from "@/features/hanzihome/components/lesson-text/LessonTextInlineEditor";
import { ReviewWorkspace } from "@/features/hanzihome/components/review/ReviewWorkspace";
import { VocabWorkspace } from "@/features/hanzihome/components/vocab/VocabWorkspace";
import type { StudyModule } from "@/features/hanzihome/context/types";
import { ListeningWorkspace } from "@/features/hanzihome/listening/ListeningWorkspace";
import { ListeningDictationWorkspace } from "@/features/hanzihome/listening/ListeningDictationWorkspace";

export function LessonModuleContent({
 module,
 compact = false,
}: {
 module: StudyModule;
 compact?: boolean;
}) {
 switch (module) {
  case "overview":
   return <LessonOverview />;
  case "lessonText":
   return <LessonTextInlineEditor compact={compact} />;
  case "listening":
   return <ListeningWorkspace />;
  case "dictation":
   return <ListeningDictationWorkspace />;
  case "script":
   return <ListeningWorkspace />;
  case "notes":
   return <LessonNoteAccessCard />;
  case "vocab":
   return <VocabWorkspace compact={compact} />;
  case "grammar":
   return <GrammarWorkspace compact={compact} />;
  case "review":
   return <ReviewWorkspace />;
 }
}
