import type { ReactNode } from "react";

import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { RawDataDetails } from "../CommonCards";

export function SectionContentFrame({
 lessonId,
 section,
 sectionPath,
 debugMode,
 children,
}: {
 lessonId?: string;
 section: Section;
 sectionPath?: EditableNodePath;
 debugMode: boolean;
 children: ReactNode;
}) {
 const content = (
  <div className="grid gap-3">
   {children}
   {debugMode && <RawDataDetails value={section} label="Dữ liệu gốc của section" />}
  </div>
 );

 if (!lessonId || !sectionPath) return content;

 return (
  <EditableNodeWrapper
   lessonId={lessonId}
   entityType="section"
   entityId={section.id}
   path={sectionPath}
   value={section}
   label={section.title_vi || section.title}
  >
   {content}
  </EditableNodeWrapper>
 );
}
