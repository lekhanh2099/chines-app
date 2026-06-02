"use client";

import { Card } from "@/components/ui/card";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/LessonNoteAccessCard";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import type {
 HanziHomeLesson,
 HanziHomeModule,
 UserLearningState,
} from "@/features/hanzihome/types";

import { SourceLessonOverview } from "./SourceLessonOverview";

type LessonOverviewProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 onOpenModule: (module: HanziHomeModule) => void;
};

export function LessonOverview({ lesson }: LessonOverviewProps) {
 const fallbackMarkdown = lesson.notes?.overviewMarkdown?.trim();

 return (
  <div className="grid gap-3">
   {lesson.sourceLesson ? (
    <SourceLessonOverview lessonDocument={lesson.sourceLesson} />
   ) : fallbackMarkdown ? (
    <Card padding="lg" className="rounded-xl">
     <MarkdownContent content={fallbackMarkdown} />
    </Card>
   ) : (
    <Card padding="lg" className="rounded-xl">
     <p className="text-sm font-semibold text-text-muted">
      Chưa có tổng quan trong JSON của bài này.
     </p>
    </Card>
   )}

   <LessonNoteAccessCard lesson={lesson} />
  </div>
 );
}
