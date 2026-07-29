"use client";

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
}: {
 lessonId: string;
 section: Section;
 sectionPath: EditableNodePath;
 displayMode: LessonDisplayMode;
 readingItems?: readonly ReadingItem[];
}) {
 return (
  <>
   <article className="grid gap-3">
    <div>
     <StudyInstructionText
      variant="overline"
      tone="muted"
      weight="black"
      scale="fine"
      tracking="wide"
      transform="uppercase"
     >
      {section.type.replaceAll("_", " ")}
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

    <BookSectionContent
     lessonId={lessonId}
     section={section}
     sectionPath={sectionPath}
     displayMode={displayMode}
     readingItems={readingItems}
    />
   </article>
  </>
 );
}
