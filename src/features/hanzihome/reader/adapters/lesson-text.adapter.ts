import type { EditableNodePath, EditableNodeRequest } from "@/features/hanzihome/editing/store/types";
import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { deriveSegmentContentCapabilities } from "../model/reader-capabilities";
import type {
 ReaderDocumentModel,
 ReaderSection,
 ReaderSegment,
} from "../model/reader-document.types";

type TextSection = Extract<Section, { type: "text" }>;
export type LessonReaderEditBinding = Omit<EditableNodeRequest, "description">;

export type LessonTextReaderAdapterResult = {
 document: ReaderDocumentModel;
 segmentBindings: ReadonlyMap<string, LessonReaderEditBinding>;
 sectionBindings: ReadonlyMap<string, LessonReaderEditBinding>;
};

export function lessonTextToReaderDocument({
 documentId,
 lessonId,
 titleZh,
 titlePinyin,
 titleVi,
 sections,
 sectionPathFor,
}: {
 documentId: string;
 lessonId: string;
 titleZh: string;
 titlePinyin?: string;
 titleVi?: string;
 sections: readonly TextSection[];
 sectionPathFor: (section: TextSection) => EditableNodePath;
}): LessonTextReaderAdapterResult {
 const segments: ReaderSegment[] = [];
 const readerSections: ReaderSection[] = [];
 const segmentBindings = new Map<string, LessonReaderEditBinding>();
 const sectionBindings = new Map<string, LessonReaderEditBinding>();

 for (const section of [...sections].sort((left, right) => left.order - right.order)) {
  const sectionPath = sectionPathFor(section);
  const orderedBlocks = [...section.blocks].sort((left, right) => left.order - right.order);
  for (const block of orderedBlocks) {
   const blockIndex = section.blocks.findIndex((candidate) => candidate.id === block.id);
   const blockPath: EditableNodePath = [...sectionPath, "blocks", blockIndex];
   const segmentIds: string[] = [];

   if (block.type === "text_dialogue") {
    const orderedScenes = [...block.scenes].sort((left, right) => left.order - right.order);
    const sceneLines = orderedScenes.flatMap((scene) => {
     const sceneIndex = block.scenes.findIndex((candidate) => candidate.id === scene.id);
     const orderedLines = [...scene.lines].sort((left, right) => left.order - right.order);
     return orderedLines.map((line, localIndex) => {
      const lineIndex = scene.lines.findIndex((candidate) => candidate.id === line.id);
      return {
       line,
       role: localIndex === 0 ? scene.summary_vi.trim() || undefined : undefined,
       path: [...blockPath, "scenes", sceneIndex, "lines", lineIndex] as EditableNodePath,
      };
     });
    });
    const directLines = [...block.lines]
     .sort((left, right) => left.order - right.order)
     .map((line) => ({
      line,
      role: undefined,
      path: [
       ...blockPath,
       "lines",
       block.lines.findIndex((candidate) => candidate.id === line.id),
      ] as EditableNodePath,
     }));
    const lines = sceneLines.length > 0 ? sceneLines : directLines;
    for (const { line, path, role } of lines) {
     const zh = line.zh.trim();
     if (!zh) continue;
     segmentIds.push(line.id);
     segments.push({
      id: line.id,
      kind: "dialogue-turn",
      sectionId: block.id,
      zh,
      pinyin: line.pinyin.trim() || undefined,
      vi: line.vi.trim() || undefined,
      role,
      speaker: line.speaker.trim() ? { label: line.speaker.trim() } : undefined,
      speechText: zh,
     });
     segmentBindings.set(line.id, {
      lessonId,
      entityType: "text_line",
      entityId: line.id,
      parentEntityType: "text_block",
      parentEntityId: block.id,
      path,
      value: line,
      label: line.speaker.trim() || zh,
     });
    }
   } else {
    const paragraphs = [...block.paragraphs]
     .sort((left, right) => left.order - right.order)
     .map((paragraph) => ({
      item: paragraph,
      kind: "text_paragraph" as const,
      path: [
       ...blockPath,
       "paragraphs",
       block.paragraphs.findIndex((candidate) => candidate.id === paragraph.id),
      ] as EditableNodePath,
     }));
    const lines = [...block.lines]
     .sort((left, right) => left.order - right.order)
     .map((line) => ({
      item: line,
      kind: "text_line" as const,
      path: [
       ...blockPath,
       "lines",
       block.lines.findIndex((candidate) => candidate.id === line.id),
      ] as EditableNodePath,
     }));
    const items = paragraphs.length > 0 ? paragraphs : lines;
    for (const { item, kind, path } of items) {
     const zh = item.zh.trim();
     if (!zh) continue;
     segmentIds.push(item.id);
     segments.push({
      id: item.id,
      kind: kind === "text_line" ? "sentence" : "paragraph",
      sectionId: block.id,
      zh,
      pinyin: item.pinyin.trim() || undefined,
      vi: item.vi.trim() || undefined,
      speechText: zh,
     });
     segmentBindings.set(item.id, {
      lessonId,
      entityType: kind,
      entityId: item.id,
      parentEntityType: "text_block",
      parentEntityId: block.id,
      path,
      value: item,
      label: zh,
     });
    }
   }

   if (segmentIds.length === 0) continue;
   readerSections.push({
    id: block.id,
    title: block.title_vi.trim() || block.title.trim() || `Phần ${readerSections.length + 1}`,
    segmentIds,
   });
   sectionBindings.set(block.id, {
    lessonId,
    entityType: "text_block",
    entityId: block.id,
    path: blockPath,
    value: block,
    label: block.title_vi.trim() || block.title.trim(),
   });
  }
 }

 return {
  document: {
   id: documentId,
   language: "zh-CN",
   source: { kind: "lesson", sourceId: lessonId, label: "Giáo trình" },
   title: titleZh.trim() || undefined,
   titlePinyin: titlePinyin?.trim() || undefined,
   titleVi: titleVi?.trim() || undefined,
   sections: readerSections,
   segments,
   metadata: [],
   capabilities: deriveSegmentContentCapabilities(segments),
  },
  segmentBindings,
  sectionBindings,
 };
}
