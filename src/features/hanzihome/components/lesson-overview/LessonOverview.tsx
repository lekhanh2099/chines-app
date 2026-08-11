"use client";

import { useMemo } from "react";

import { Card } from "@/components/ui/card";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import { LessonStudyDashboard } from "@/features/hanzihome/components/lesson-overview/overview/LessonStudyDashboard";
import { getBookSections } from "@/features/hanzihome/components/lesson-overview/utils";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/notes/LessonNoteAccessCard";

export function LessonOverview() {
 const runtime = useHanziHomeRuntime();
 const { lesson } = runtime;
 const fallbackMarkdown = lesson.notes?.overviewMarkdown?.trim();
 const sourceSections = useMemo(() => getBookSections(lesson.sourceLesson), [lesson.sourceLesson]);

 return (
  <div className="grid gap-3 sm:gap-4">
   <LessonStudyDashboard
    lesson={lesson}
    sections={sourceSections}
    onOpenModule={runtime.selectModule}
   />

   {fallbackMarkdown && !lesson.sourceLesson ? (
    <Card variant="section" padding="lg">
     <MarkdownContent content={fallbackMarkdown} />
    </Card>
   ) : null}

   <LessonNoteAccessCard />
  </div>
 );
}
