import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import { lessonTextToReaderDocument } from "@/features/hanzihome/reader/adapters/lesson-text.adapter";
import { ReaderSurface } from "@/features/hanzihome/reader/components/ReaderSurface";
import type { LessonDisplayMode } from "./types";

export function TextSectionView({
 lessonId,
 section,
 sectionPath,
 displayMode,
}: {
 lessonId?: string;
 section: Extract<Section, { type: "text" }>;
 sectionPath?: EditableNodePath;
 displayMode: LessonDisplayMode;
}) {
 const reader = lessonTextToReaderDocument({
  documentId: `${lessonId ?? "text"}:${section.id}`,
  lessonId: lessonId ?? "",
  titleZh: section.title,
  titleVi: section.title_vi,
  sections: [section],
  sectionPathFor: () => sectionPath ?? [],
 });

 return (
  <ReaderSurface
   document={reader.document}
   lessonId={lessonId}
   displayMode={lessonId ? undefined : displayMode}
   renderSegment={({ segment, content }) => {
    const binding = reader.segmentBindings.get(segment.id);
    return lessonId && sectionPath && binding ? (
     <EditableNodeWrapper {...binding}>{content}</EditableNodeWrapper>
    ) : (
     content
    );
   }}
   renderSection={({ section: readerSection, content }) => {
    const binding = reader.sectionBindings.get(readerSection.id);
    return lessonId && sectionPath && binding ? (
     <EditableNodeWrapper {...binding}>{content}</EditableNodeWrapper>
    ) : (
     content
    );
   }}
  />
 );
}
