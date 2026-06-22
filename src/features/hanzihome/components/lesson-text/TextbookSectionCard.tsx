"use client";

import { Card } from "@/components/ui/card";
import { BookSectionContent } from "@/features/hanzihome/components/LessonOverview";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import {
 sectionSubtitle,
 sectionTitle,
} from "@/features/hanzihome/components/lesson-overview/utils";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

export function TextbookSectionCard({
 lessonId,
 section,
 sectionPath,
 displayMode,
}: {
 lessonId: string;
 section: Section;
 sectionPath: EditableNodePath;
 displayMode: LessonDisplayMode;
}) {
 return (
  <Card padding="sm" className="rounded-xl border-border-default bg-bg-primary sm:p-4">
   <article className="grid gap-3">
    <div>
     <p className="text-[0.7rem] font-black uppercase tracking-wide text-text-muted">
      {section.type.replaceAll("_", " ")}
     </p>
     <h2 className="text-lg font-black text-text-primary sm:text-xl">{sectionTitle(section)}</h2>
     {sectionSubtitle(section) && (
      <p className=" font-semibold text-text-muted">{sectionSubtitle(section)}</p>
     )}
    </div>

    <BookSectionContent
     lessonId={lessonId}
     section={section}
     sectionPath={sectionPath}
     displayMode={displayMode}
    />
   </article>
  </Card>
 );
}
