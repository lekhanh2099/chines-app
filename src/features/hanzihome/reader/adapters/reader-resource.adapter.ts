import type { ReaderDocumentResource } from "../reader-content-api";
import {
 createReaderContentCapabilities,
 deriveSegmentContentCapabilities,
} from "../model/reader-capabilities";
import type {
 ReaderContentCapability,
 ReaderDocumentModel,
 ReaderMetadataItem,
 ReaderSegment,
} from "../model/reader-document.types";

function optionalText(value: string): string | undefined {
 const normalized = value.trim();
 return normalized.length > 0 ? normalized : undefined;
}

function metadataText(resource: ReaderDocumentResource, key: string): string | undefined {
 const value = resource.document.source_metadata[key];
 return typeof value === "string" ? optionalText(value) : undefined;
}

function metadataTextList(resource: ReaderDocumentResource, key: string): readonly string[] {
 const value = resource.document.source_metadata[key];
 return Array.isArray(value)
  ? value.filter((item): item is string => typeof item === "string")
  : [];
}

function hasAnalysis(resource: ReaderDocumentResource): boolean {
 const analysis = resource.document.analysis;
 return (
  analysis.mainIdeaVi.trim().length > 0 ||
  analysis.paragraphStructureVi.length > 0 ||
  analysis.logicChainVi.length > 0 ||
  analysis.trapsVi.length > 0 ||
  analysis.keywordsZh.length > 0
 );
}

function hasSummary(resource: ReaderDocumentResource): boolean {
 const summary = resource.document.summary;
 return summary.modelZh.trim().length > 0 || summary.rubricVi.length > 0;
}

function metadataForResource(resource: ReaderDocumentResource): readonly ReaderMetadataItem[] {
 const metadata: ReaderMetadataItem[] = [];
 const genre = optionalText(resource.document.genre_vi);
 if (genre) metadata.push({ id: "genre", label: "Thể loại", value: genre });
 if (resource.document.unit_id) {
  metadata.push({
   id: "unit",
   label: "Đơn nguyên",
   value: resource.document.unit_id.replace(/^U/u, ""),
  });
 }
 const sourceFields = [
  ["level", "Trình độ"],
  ["topic", "Chủ đề"],
  ["published_date", "Ngày"],
  ["essential_question_vi", "Câu hỏi trọng tâm"],
  ["key_idea_vi", "Ý chính"],
  ["adaptation_notice_vi", "Ghi chú nguồn"],
 ];
 for (const [id, label] of sourceFields) {
  const value = metadataText(resource, id);
  if (value) metadata.push({ id, label, value });
 }
 const mastery = metadataTextList(resource, "mastery_checklist_vi");
 if (mastery.length > 0) {
  metadata.push({ id: "mastery", label: "Mục tiêu làm chủ", value: mastery.join(" · ") });
 }
 const sourceIds = metadataTextList(resource, "source_ids");
 if (sourceIds.length > 0) {
  metadata.push({ id: "sources", label: "Nguồn", value: sourceIds.join(", ") });
 }
 if (resource.paragraphs.length > 0) {
  metadata.push({ id: "segments", label: "Số đoạn", value: String(resource.paragraphs.length) });
 }
 if (resource.vocabulary.length > 0) {
  metadata.push({ id: "vocabulary", label: "Từ vựng", value: String(resource.vocabulary.length) });
 }
 if (resource.exerciseItems.length > 0) {
  metadata.push({
   id: "exercises",
   label: "Bài tập",
   value: String(resource.exerciseItems.length),
  });
 }
 return metadata;
}

export function readerResourceToDocument(resource: ReaderDocumentResource): ReaderDocumentModel {
 const segments: readonly ReaderSegment[] = resource.paragraphs
  .slice()
  .sort((left, right) => left.paragraph_order - right.paragraph_order)
  .map((paragraph) => ({
   id: paragraph.id,
   kind: "paragraph",
   zh: paragraph.zh,
   pinyin: optionalText(paragraph.pinyin),
   vi: optionalText(paragraph.vi),
   role: optionalText(paragraph.role_vi),
   speechText: paragraph.zh,
  }));

 const capabilities: ReaderContentCapability[] = [...deriveSegmentContentCapabilities(segments)];
 if (resource.vocabulary.length > 0) capabilities.push("vocabulary");
 if (resource.exerciseGroups.length > 0 || resource.exerciseItems.length > 0) {
  capabilities.push("exercises");
 }
 if (hasAnalysis(resource)) capabilities.push("analysis");
 if (hasSummary(resource)) capabilities.push("summary");

 return {
  id: resource.document.id,
  language: "zh-CN",
  source: {
   kind: "reader-resource",
   sourceId: resource.document.id,
   label: optionalText(resource.document.genre_vi),
  },
  title: optionalText(resource.document.title_zh),
  titlePinyin: optionalText(resource.document.title_pinyin),
  titleVi: optionalText(resource.document.title_vi),
  sections: [],
  segments,
  metadata: metadataForResource(resource),
  capabilities: createReaderContentCapabilities(capabilities),
 };
}
