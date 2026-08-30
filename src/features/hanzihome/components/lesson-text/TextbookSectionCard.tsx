"use client";

import { Card } from "@/components/ui/card";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import { BookSectionContent } from "@/features/hanzihome/components/LessonOverview";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import {
 sectionSubtitle,
 sectionTitle,
} from "@/features/hanzihome/components/lesson-overview/utils";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { ReadingItem, Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";

export function TextbookSectionCard({
 lessonId,
 section,
 sectionPath,
 displayMode,
 readingItems,
 readingSections,
 interactiveReading,
 readingMode,
}: {
 lessonId?: string;
 section: Section;
 sectionPath?: EditableNodePath;
 displayMode: LessonDisplayMode;
 readingItems?: readonly ReadingItem[];
 readingSections?: readonly Section[];
 interactiveReading: boolean;
 readingMode: boolean;
}) {
 const sectionLabel = (() => {
  switch (section.type) {
   case "text":
    return "BÀI KHÓA";
   case "vocabulary":
    return "TỪ VỰNG";
   case "proper_nouns":
    return "TÊN RIÊNG";
   case "notes":
    return "CHÚ THÍCH";
   case "grammar":
    return "NGỮ PHÁP";
   case "exercises":
    return "BÀI TẬP";
   case "communication":
    return "GIAO TIẾP";
   case "reading":
    return "ĐỌC HIỂU";
   case "character_writing":
    return "LUYỆN VIẾT";
   case "summary":
    return "TỔNG KẾT";
  }
 })();

 const sectionHeader = (
  <div className="grid gap-1">
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    scale="fine"
    tracking="wide"
    transform="uppercase"
   >
    {sectionLabel}
   </StudyInstructionText>
   <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
    {sectionTitle(section)}
   </Typography>
   {sectionSubtitle(section) && (
    <StudyInstructionText tone="muted" weight="semibold">
     {sectionSubtitle(section)}
    </StudyInstructionText>
   )}
  </div>
 );

 const sectionContent = (
  <BookSectionContent
   lessonId={lessonId}
   section={section}
   sectionPath={sectionPath}
   displayMode={displayMode}
   readingItems={readingItems}
   readingSections={readingSections}
   interactiveReading={interactiveReading}
   readingMode={readingMode}
   documentMode={section.type === "text"}
  />
 );

 if (section.type === "text") {
  return (
   <Card asChild variant="section" padding="md">
    <article className="grid gap-4 sm:gap-5">
     {sectionHeader}
     {sectionContent}
    </article>
   </Card>
  );
 }

 return (
  <article className="grid gap-3">
   {sectionHeader}
   {sectionContent}
  </article>
 );
}
