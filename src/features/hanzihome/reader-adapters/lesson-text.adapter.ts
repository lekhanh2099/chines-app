import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { deriveSegmentContentCapabilities } from "@/features/reader/model/reader-capabilities";
import type {
 ReaderDocumentModel,
 ReaderSection,
 ReaderSegment,
} from "@/features/reader/model/reader-document.types";

type TextSection = Extract<Section, { type: "text" }>;

export function lessonTextToReaderDocument({
 documentId,
 lessonId,
 titleZh,
 titlePinyin,
 titleVi,
 sections,
}: {
 documentId: string;
 lessonId: string;
 titleZh: string;
 titlePinyin?: string;
 titleVi?: string;
 sections: readonly TextSection[];
}): ReaderDocumentModel {
 const segments: ReaderSegment[] = [];
 const readerSections: ReaderSection[] = [];

 for (const section of [...sections].sort((left, right) => left.order - right.order)) {
  const orderedBlocks = [...section.blocks].sort((left, right) => left.order - right.order);
  for (const block of orderedBlocks) {
   const segmentIds: string[] = [];

   if (block.type === "text_dialogue") {
    const orderedScenes = [...block.scenes].sort((left, right) => left.order - right.order);
    const sceneLines = orderedScenes.flatMap((scene) => {
     const orderedLines = [...scene.lines].sort((left, right) => left.order - right.order);
     return orderedLines.map((line, localIndex) => ({
      line,
      role: localIndex === 0 ? scene.summary_vi.trim() || undefined : undefined,
     }));
    });
    const directLines = [...block.lines]
     .sort((left, right) => left.order - right.order)
     .map((line) => ({ line, role: undefined }));
    const lines = sceneLines.length > 0 ? sceneLines : directLines;
    for (const { line, role } of lines) {
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
    }
   } else if (block.paragraphs.length > 0) {
    const orderedParagraphs = [...block.paragraphs].sort((left, right) => left.order - right.order);
    for (const paragraph of orderedParagraphs) {
     const zh = paragraph.zh.trim();
     if (!zh) continue;
     segmentIds.push(paragraph.id);
     segments.push({
      id: paragraph.id,
      kind: "paragraph",
      sectionId: block.id,
      zh,
      pinyin: paragraph.pinyin.trim() || undefined,
      vi: paragraph.vi.trim() || undefined,
      speechText: zh,
     });
    }
   } else {
    const orderedLines = [...block.lines].sort((left, right) => left.order - right.order);
    for (const line of orderedLines) {
     const zh = line.zh.trim();
     if (!zh) continue;
     segmentIds.push(line.id);
     segments.push({
      id: line.id,
      kind: "sentence",
      sectionId: block.id,
      zh,
      pinyin: line.pinyin.trim() || undefined,
      vi: line.vi.trim() || undefined,
      speaker: line.speaker.trim() ? { label: line.speaker.trim() } : undefined,
      speechText: zh,
     });
    }
   }

   if (segmentIds.length === 0) continue;
   readerSections.push({
    id: block.id,
    title: block.title_vi.trim() || block.title.trim(),
    segmentIds,
   });
  }
 }

 return {
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
 };
}
