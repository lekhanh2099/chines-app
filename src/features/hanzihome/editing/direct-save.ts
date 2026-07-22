"use client";

import { z } from "zod";

import type { EditableNodeRequest } from "./store/types";
import type { HanziHomeEditableRecordMeta } from "@/features/hanzihome/types";
import { listeningRuntimeItemSchema } from "@/features/hanzihome/listening/listening.schemas";
import { HanziHomeMutationError } from "./mutation-error";

const editableLessonSchema = z.looseObject({
 title: z.looseObject({
  zh: z.string().default(""),
  pinyin: z.string().default(""),
  vi: z.string().default(""),
  en: z.string().default(""),
 }),
 tags: z.array(z.string()).default([]),
 source_file: z.string().optional().default(""),
});

const editableVocabSchema = z.looseObject({
 hanzi: z.string().default(""),
 pinyin: z.string().default(""),
 category: z.string().default("Từ vựng"),
 level_tag: z.string().default("unknown"),
 tone: z.string().optional().default(""),
 tags: z.array(z.string()).default([]),
 meaning_vi: z.string().optional().default(""),
 meaning_en: z.string().optional().default(""),
 meaning: z
  .looseObject({
   hanviet: z.string().default(""),
   meaning_vi: z.string().default(""),
   meaning_en: z.string().default(""),
  })
  .optional(),
 pos: z.union([
  z.string(),
  z.looseObject({
   raw_vi: z.string().default(""),
   raw_cn: z.string().default(""),
   normalized: z.string().default("unknown"),
  }),
 ]),
});

const editableGrammarPointSchema = z.looseObject({
 title: z.string().optional().default(""),
 title_vi: z.string().optional().default(""),
 titleVi: z.string().optional().default(""),
 cleanTitle: z.string().default(""),
 level: z.string().optional().default(""),
 core: z.string().default(""),
 contentMd: z.string().optional().default(""),
 structuresView: z.array(z.string()).default([]),
 notes: z.array(z.string()).default([]),
 tags: z.array(z.string()).default([]),
});

const editableExampleSchema = z.looseObject({
 zh: z.string().default(""),
 pinyin: z.string().optional().default(""),
 vi: z.string().optional().default(""),
 note: z.string().optional().default(""),
 note_vi: z.string().optional().default(""),
 analysis_vi: z.string().optional().default(""),
});

const editableDetailSectionSchema = z.looseObject({
 key: z.string().optional().default(""),
 section_key: z.string().optional().default(""),
 title: z.string().default(""),
 lines: z.array(z.string()).default([]),
});

const editableSectionSchema = z.looseObject({
 title: z.string().default(""),
 title_vi: z.string().default(""),
});

function mapVocabItem(value: unknown) {
 const item = editableVocabSchema.parse(value);
 const meaning = item.meaning;
 const pos =
  typeof item.pos === "string" ? { raw_vi: item.pos, raw_cn: "", normalized: item.pos } : item.pos;
 return {
  word: item.hanzi,
  pinyin: item.pinyin,
  han_viet: meaning?.hanviet ?? "",
  meaning: item.meaning_vi || meaning?.meaning_vi || "",
  meaning_en: item.meaning_en || meaning?.meaning_en || null,
  category: item.category,
  level: item.level_tag || null,
  pos_vi: pos.raw_vi || pos.normalized,
  pos_zh: pos.raw_cn,
  tone: item.tone || null,
  tags: item.tags,
 };
}

function mapGrammarPoint(value: unknown) {
 const point = editableGrammarPointSchema.parse(value);
 const title = point.title || point.cleanTitle;
 return {
  title,
  title_vi: point.title_vi || point.titleVi || null,
  clean_title: point.cleanTitle || title,
  level: point.level || null,
  core: point.core,
  content_md: point.contentMd || null,
  structures_view: point.structuresView,
  notes: point.notes,
  tags: point.tags,
 };
}

function mapExample(value: unknown) {
 const example = editableExampleSchema.parse(value);
 return {
  zh: example.zh,
  pinyin: example.pinyin || null,
  vi: example.vi || null,
  note: example.note || example.note_vi || example.analysis_vi || null,
 };
}

function mapDetailSection(value: unknown) {
 const section = editableDetailSectionSchema.parse(value);
 return {
  section_key: section.key || section.section_key,
  title: section.title,
  lines: section.lines,
 };
}

function mapLesson(value: unknown) {
 const lesson = editableLessonSchema.parse(value);
 return {
  title_zh: lesson.title.zh,
  title_pinyin: lesson.title.pinyin || null,
  title_vi: lesson.title.vi || null,
  title_en: lesson.title.en || null,
  tags: lesson.tags,
  source_file: lesson.source_file || null,
 };
}

function mapSection(value: unknown) {
 const section = editableSectionSchema.parse(value);
 return {
  title: section.title,
  title_vi: section.title_vi,
  payload: section,
 };
}

function mapListeningItem(value: unknown) {
 const item = listeningRuntimeItemSchema.parse(value);
 return {
  prompt_zh: item.promptZh ?? null,
  transcript: item.transcript ?? null,
  options: item.options,
  answer: item.answer ?? null,
  explanation_vi: item.explanationVi ?? null,
  metadata: item.metadata,
 };
}

const resourceByEntityType = {
 course: "courses",
 book: "books",
 lesson: "lessons",
 section: "sections",
 lesson_text: "lesson-texts",
 vocab_item: "vocab-items",
 vocab_example: "vocab-examples",
 vocab_detail_section: "vocab-detail-sections",
 grammar_point: "grammar-points",
 grammar_example: "grammar-examples",
 grammar_detail_section: "grammar-detail-sections",
} as const satisfies Record<string, string>;

export type RestorableCanonicalEntityType = keyof typeof resourceByEntityType;

function resourceForEntityType(entityType: string) {
 switch (entityType) {
  case "course":
  case "book":
  case "lesson":
  case "section":
  case "lesson_text":
  case "vocab_item":
  case "vocab_example":
  case "vocab_detail_section":
  case "grammar_point":
  case "grammar_example":
  case "grammar_detail_section":
   return resourceByEntityType[entityType];
  case "listening_item":
   return "listening-items";
  default:
   return undefined;
 }
}

async function readMutationResponse(response: Response, fallback: string) {
 const payload: unknown = await response.json().catch(() => null);
 if (!response.ok) {
  const message =
   payload && typeof payload === "object" && "error" in payload
    ? String((payload as { error: unknown }).error)
    : `${fallback} (${response.status})`;
  const details =
   payload && typeof payload === "object" && "details" in payload
    ? (payload as { details: unknown }).details
    : undefined;
  throw new HanziHomeMutationError(message, response.status, details);
 }
 return payload;
}

export async function updateCanonicalContent({
 entityType,
 entityId,
 expectedUpdatedAt,
 changes,
 reason,
}: {
 entityType: RestorableCanonicalEntityType;
 entityId: string;
 expectedUpdatedAt: string;
 changes: Record<string, unknown>;
 reason: string;
}) {
 const resource = resourceForEntityType(entityType);
 const response = await fetch(
  `/api/hanzihome/content/${resource}/${encodeURIComponent(entityId)}`,
  {
   method: "PATCH",
   headers: { Accept: "application/json", "Content-Type": "application/json" },
   body: JSON.stringify({ reason, expectedUpdatedAt, changes }),
  },
 );
 return readMutationResponse(response, "Cập nhật nội dung thất bại");
}

export async function deleteCanonicalContent({
 entityType,
 entityId,
 expectedUpdatedAt,
 reason,
}: {
 entityType: RestorableCanonicalEntityType;
 entityId: string;
 expectedUpdatedAt: string;
 reason: string;
}) {
 const resource = resourceForEntityType(entityType);
 const response = await fetch(
  `/api/hanzihome/content/${resource}/${encodeURIComponent(entityId)}`,
  {
   method: "DELETE",
   headers: { Accept: "application/json", "Content-Type": "application/json" },
   body: JSON.stringify({ reason, expectedUpdatedAt, changes: {} }),
  },
 );
 return readMutationResponse(response, "Xóa nội dung thất bại");
}

export async function createCanonicalContent({
 entityType,
 changes,
 reason,
}: {
 entityType: RestorableCanonicalEntityType;
 changes: Record<string, unknown>;
 reason: string;
}) {
 const resource = resourceByEntityType[entityType];

 const response = await fetch(`/api/hanzihome/content/${resource}`, {
  method: "POST",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({ reason, changes }),
 });
 return readMutationResponse(response, "Tạo nội dung thất bại");
}

function changesForEntity(entityType: string, value: unknown) {
 switch (entityType) {
  case "lesson":
   return mapLesson(value);
  case "section":
   return mapSection(value);
  case "vocab_item":
   return mapVocabItem(value);
  case "vocab_example":
  case "grammar_example":
   return mapExample(value);
  case "vocab_detail_section":
  case "grammar_detail_section":
   return mapDetailSection(value);
  case "grammar_point":
   return mapGrammarPoint(value);
  case "listening_item":
   return mapListeningItem(value);
  default:
   return null;
 }
}

function changedFields(
 before: Record<string, unknown>,
 after: Record<string, unknown>,
): Record<string, unknown> {
 return Object.fromEntries(
  Object.entries(after).filter(
   ([key, value]) => JSON.stringify(before[key]) !== JSON.stringify(value),
  ),
 );
}

export async function saveEditableNodeDirectly({
 node,
 record,
 after,
 reason,
}: {
 node: EditableNodeRequest;
 record: HanziHomeEditableRecordMeta;
 after: unknown;
 reason: string;
}) {
 const normalizedEntityType = record.entityType;
 const resource = resourceForEntityType(normalizedEntityType);
 let url: string;
 let body: Record<string, unknown>;

 if (
  normalizedEntityType === "vocab_detail_section" &&
  record.fieldPath?.[0] === "lines" &&
  typeof record.fieldPath[1] === "number"
 ) {
  const item = editableExampleSchema.parse(after);
  url = `/api/hanzihome/content/vocab-detail-sections/${encodeURIComponent(record.dbId)}/lines/${record.fieldPath[1]}`;
  body = {
   reason,
   expectedUpdatedAt: record.updatedAt,
   changes: {},
   value: item.zh || item.vi,
  };
 } else if (record.sectionDbId && node.entityType !== "section") {
  url = `/api/hanzihome/content/sections/${encodeURIComponent(record.sectionDbId)}/nodes/${encodeURIComponent(node.entityType)}/${encodeURIComponent(node.entityId)}`;
  body = {
   reason,
   expectedUpdatedAt: record.updatedAt,
   changes: {},
   nodePath: node.path,
   after,
  };
 } else if (resource) {
  const beforeChanges = changesForEntity(normalizedEntityType, node.value);
  const afterChanges = changesForEntity(normalizedEntityType, after);
  if (!beforeChanges || !afterChanges) {
   throw new Error(`Chưa hỗ trợ lưu ${normalizedEntityType}`);
  }
  const changes = changedFields(beforeChanges, afterChanges);
  if (Object.keys(changes).length === 0) {
   throw new Error("Không có thay đổi để lưu.");
  }
  url = `/api/hanzihome/content/${resource}/${encodeURIComponent(record.dbId)}`;
  body = { reason, expectedUpdatedAt: record.updatedAt, changes };
 } else {
  throw new Error(`Node ${node.entityType} chưa có DB write target`);
 }

 const response = await fetch(url, {
  method: "PATCH",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });
 return readMutationResponse(response, "Lưu thất bại");
}

export async function deleteEditableNodeDirectly({
 node,
 record,
 reason,
}: {
 node: EditableNodeRequest;
 record: HanziHomeEditableRecordMeta;
 reason: string;
}) {
 let url: string;
 if (record.sectionDbId && node.entityType !== "section") {
  url = `/api/hanzihome/content/sections/${encodeURIComponent(record.sectionDbId)}/nodes/${encodeURIComponent(node.entityType)}/${encodeURIComponent(node.entityId)}`;
 } else {
  const resource = resourceForEntityType(record.entityType);
  if (!resource) throw new Error(`Node ${node.entityType} chưa hỗ trợ xóa`);
  url = `/api/hanzihome/content/${resource}/${encodeURIComponent(record.dbId)}`;
 }

 const response = await fetch(url, {
  method: "DELETE",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({
   reason,
   expectedUpdatedAt: record.updatedAt,
   changes: {},
  }),
 });
 return readMutationResponse(response, "Xóa thất bại");
}

export async function restoreCanonicalContent({
 entityType,
 entityId,
 expectedUpdatedAt,
 reason,
}: {
 entityType: RestorableCanonicalEntityType;
 entityId: string;
 expectedUpdatedAt: string;
 reason: string;
}) {
 const resource = resourceByEntityType[entityType];
 if (!resource) throw new Error(`Node ${entityType} chưa hỗ trợ khôi phục`);

 const response = await fetch(
  `/api/hanzihome/content/${resource}/${encodeURIComponent(entityId)}/restore`,
  {
   method: "POST",
   headers: { Accept: "application/json", "Content-Type": "application/json" },
   body: JSON.stringify({
    reason,
    expectedUpdatedAt,
    changes: {},
   }),
  },
 );
 return readMutationResponse(response, "Khôi phục thất bại");
}

export type PurgeableCanonicalEntityType = Extract<
 RestorableCanonicalEntityType,
 "course" | "book" | "lesson"
>;

export async function purgeDeletedCanonicalContent({
 entityType,
 entityId,
 expectedUpdatedAt,
 reason,
}: {
 entityType: PurgeableCanonicalEntityType;
 entityId: string;
 expectedUpdatedAt: string;
 reason: string;
}) {
 const response = await fetch("/api/hanzihome/content/deleted/purge", {
  method: "POST",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({ entityType, entityId, expectedUpdatedAt, reason }),
 });
 return readMutationResponse(response, "Xóa vĩnh viễn thất bại");
}

export async function restoreNestedSectionNode({
 sectionId,
 entityType,
 entityId,
 expectedUpdatedAt,
 reason,
}: {
 sectionId: string;
 entityType: string;
 entityId: string;
 expectedUpdatedAt: string;
 reason: string;
}) {
 const response = await fetch(
  `/api/hanzihome/content/sections/${encodeURIComponent(sectionId)}/nodes/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
  {
   method: "POST",
   headers: { Accept: "application/json", "Content-Type": "application/json" },
   body: JSON.stringify({
    reason,
    expectedUpdatedAt,
    changes: {},
   }),
  },
 );
 return readMutationResponse(response, "Khôi phục nội dung thất bại");
}

export async function reorderCanonicalContent({
 entityType,
 entityId,
 expectedUpdatedAt,
 orderField,
 order,
 reason,
}: {
 entityType: RestorableCanonicalEntityType;
 entityId: string;
 expectedUpdatedAt: string;
 orderField: string;
 order: number;
 reason: string;
}) {
 const resource = resourceForEntityType(entityType);
 if (!resource) throw new Error(`Node ${entityType} chưa hỗ trợ sắp xếp`);
 const response = await fetch(
  `/api/hanzihome/content/${resource}/${encodeURIComponent(entityId)}/reorder`,
  {
   method: "POST",
   headers: { Accept: "application/json", "Content-Type": "application/json" },
   body: JSON.stringify({
    reason,
    expectedUpdatedAt,
    changes: { [orderField]: order },
   }),
  },
 );
 return readMutationResponse(response, "Sắp xếp nội dung thất bại");
}
