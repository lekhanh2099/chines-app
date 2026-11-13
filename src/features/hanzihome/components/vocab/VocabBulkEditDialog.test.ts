import { afterEach, describe, expect, it, vi } from "vitest";

import { createHanziHomeFeatureServices } from "@/features/hanzihome/context/services";
import { saveEditableNodeDirectly } from "@/features/hanzihome/editing/direct-save";
import type { EditableNodeRequest } from "@/features/hanzihome/editing/store/types";
import { hanziHomeVocabItemSchema, lessonSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import { attachLessonVocabularyResource } from "@/features/hanzihome/repositories/hanzihome-content-resources";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";

import { applyCore, coreRow } from "./VocabBulkEditDialog";

const canonicalWord: HanziHomeVocabItem = hanziHomeVocabItemSchema.parse({
 id: "word-1",
 order: 1,
 hanzi: "学习",
 pinyin: "xuéxí",
 pos: { raw_vi: "động từ", raw_cn: "动", normalized: "verb" },
 meaning: { hanviet: "HỌC TẬP", meaning_vi: "học tập", meaning_en: "study" },
 examples: [],
 runtimeId: "lesson-1__word-1",
 lessonId: "lesson-1",
 category: "Động từ",
 editMeta: {
  entityType: "vocab_item",
  entityId: "lesson-1__word-1",
  dbId: "vocab-db-1",
  updatedAt: "2026-11-01T00:00:00.000Z",
  parentEntityType: "lesson",
  parentEntityId: "lesson-1",
 },
});

function hydratedLesson() {
 const lesson = lessonSchema.parse({
  id: "lesson-1",
  lessonNumber: 1,
  titleZh: "第一课",
  title: "Bài 1",
  vocabIds: [],
  grammarPointIds: [],
  vocab: [],
  grammar: [],
  sourceLesson: {
   lesson: {
    id: "lesson-1",
    title: { zh: "第一课" },
    sections: [{ id: "vocabulary", type: "vocabulary", order: 1, title: "生词", items: [] }],
   },
  },
  editableRecords: {
   "section:vocabulary": {
    entityType: "section",
    entityId: "vocabulary",
    dbId: "section-db-1",
    updatedAt: "2026-11-01T00:00:00.000Z",
    sectionDbId: "section-db-1",
   },
  },
 });
 return attachLessonVocabularyResource(lesson, {
  lessonId: "lesson-1",
  items: [canonicalWord],
  total: 1,
 });
}

function sentRequest(fetchMock: ReturnType<typeof vi.fn>) {
 const [url, init] = fetchMock.mock.calls[0] ?? [];
 return { url, changes: JSON.parse(String(init?.body)).changes };
}

describe("VocabBulkEditDialog core edits", () => {
 afterEach(() => vi.unstubAllGlobals());

 it("saves a mini-grid meaning edit to the canonical vocabulary row without touching POS", async () => {
  const lesson = hydratedLesson();
  const section = lesson.sourceLesson?.lesson.sections[0];
  if (section?.type !== "vocabulary") throw new Error("Expected a vocabulary section.");
  const miniGridItem = section.items[0];
  if (!miniGridItem) throw new Error("Expected a hydrated mini-grid vocabulary item.");
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ item: { id: "vocab-db-1" } }));
  vi.stubGlobal("fetch", fetchMock);

  const node: EditableNodeRequest = {
   lessonId: "lesson-1",
   entityType: "vocab_item",
   entityId: miniGridItem.id,
   parentEntityType: "section",
   parentEntityId: "vocabulary",
   path: ["sections", 0, "items", 0],
   value: miniGridItem,
  };
  const record = createHanziHomeFeatureServices(lesson).resolveEditableRecord(node);
  if (!record) throw new Error("Expected a write target.");
  const row = { ...coreRow(miniGridItem, (item) => item.id), meaningVi: "học hành" };

  await saveEditableNodeDirectly({
   node,
   record,
   after: applyCore(miniGridItem, row),
   reason: "Cập nhật từ vựng",
  });

  expect(sentRequest(fetchMock)).toEqual({
   url: "/api/hanzihome/content/vocab-items/vocab-db-1",
   changes: { meaning: "học hành" },
  });
 });

 it("applies a core edit to a canonical workspace item", () => {
  const row = { ...coreRow(canonicalWord, (item) => item.runtimeId), meaningVi: "học hành" };

  expect(applyCore(canonicalWord, row)).toMatchObject({
   meaning: { meaning_vi: "học hành" },
   pos: { raw_vi: "động từ", normalized: "động từ" },
  });
 });
});
