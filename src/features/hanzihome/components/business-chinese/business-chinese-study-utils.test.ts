import { describe, expect, it } from "vitest";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import {
 businessChineseTableColumns,
 isCanonicalVocabularyTable,
 isChineseOnlyText,
 pairedTextbookTranslations,
 splitBusinessChineseExercise,
 businessChineseContentSections,
 businessChineseSourceSections,
 businessChineseTabAvailable,
 businessChineseVisibleBlocks,
 businessChineseVisibleSections,
 businessChineseVocabularyTableIds,
 businessChineseSectionDocuments,
 businessChineseReaderAnnotations,
 businessChineseReaderVocabulary,
} from "./business-chinese-study-utils";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";

const block: TextbookLesson["sections"][number]["blocks"][number] = {
 id: "table-1",
 type: "table",
 text: "",
 rows: [
  ["Từ", "Pinyin", "Nghĩa", "Đáp án"],
  ["你好", "nǐ hǎo", "Xin chào", "你好"],
 ],
 answerColumnIndexes: [3],
};
describe("Business Chinese study policies", () => {
 it("preserves source sections, empty navigation rules and canonical vocabulary visibility", () => {
  const sections: TextbookLesson["sections"] = [
   { id: "source", title: "BÀI KHÓA", category: "text", blocks: [block] },
   { id: "translation", title: "DỊCH BÀI KHÓA", category: "text", blocks: [block] },
   { id: "empty", title: "Empty", category: "grammar", blocks: [] },
  ];
  const content = businessChineseContentSections(sections);
  expect(businessChineseSourceSections(sections).map((section) => section.id)).toEqual([
   "source",
   "empty",
  ]);
  expect(content.map((section) => section.id)).toEqual(["source"]);
  expect(businessChineseVisibleSections(content, "grammar")).toEqual([]);
  expect(businessChineseVisibleSections(content, "all")).toEqual(content);
  expect(businessChineseTabAvailable("notes", [], 0, 0)).toBe(true);
  expect(businessChineseTabAvailable("dictation", content, 0, 0)).toBe(false);
  expect(businessChineseTabAvailable("dictation", content, 1, 0)).toBe(true);
  expect(businessChineseTabAvailable("text", content, 0, 0)).toBe(true);
  expect(businessChineseTabAvailable("vocab", content, 0, 1)).toBe(true);
  const vocab: TextbookLesson["vocab"] = [
   {
    id: "word",
    hanzi: "你好",
    traditional: "你好",
    pinyin: "nǐ hǎo",
    pos: "",
    hanviet: "",
    meaning: "Chào",
   },
  ];
  const ids = businessChineseVocabularyTableIds(content, vocab);
  expect(ids).toEqual(["table-1"]);
  const first = content[0];
  if (!first) throw new Error("Missing content section");
  expect(businessChineseVisibleBlocks(first, ids)).toEqual([]);
  expect(businessChineseReaderVocabulary(vocab)).toEqual([
   { id: "word", word: "你好", pinyin: "nǐ hǎo", meaning: "Chào" },
  ]);
  expect(sections[0]?.blocks).toEqual([block]);
 });
 it("creates section Reader documents with only their segments and the first heading", () => {
  const document: ReaderDocumentModel = {
   id: "lesson:text",
   language: "zh-CN",
   source: { kind: "lesson" },
   title: "你好",
   titleVi: "Chào",
   metadata: [],
   capabilities: [],
   sections: [
    { id: "one", title: "One", segmentIds: ["a"] },
    { id: "two", title: "Two", segmentIds: ["b"] },
   ],
   segments: [
    { id: "a", kind: "paragraph", sectionId: "one", zh: "你好" },
    { id: "b", kind: "paragraph", sectionId: "two", zh: "谢谢" },
   ],
  };
  const sections = businessChineseSectionDocuments(document);
  expect(sections.get("one")).toMatchObject({
   id: "lesson:text:one",
   title: "你好",
   titleVi: "Chào",
   sections: [document.sections[0]],
   segments: [document.segments[0]],
  });
  expect(sections.get("two")).toMatchObject({
   id: "lesson:text:two",
   title: undefined,
   titleVi: undefined,
   segments: [document.segments[1]],
  });
  expect(document.segments).toHaveLength(2);
 });
 it("renders only complete nonempty paragraph annotation ranges", () => {
  const annotation: ReaderAnnotationRow = {
   id: "00000000-0000-4000-8000-000000000001",
   user_id: "00000000-0000-4000-8000-000000000002",
   document_id: "lesson:text",
   paragraph_id: "paragraph",
   asset_id: null,
   annotation_type: "highlight",
   page_number: null,
   start_offset: 0,
   end_offset: 2,
   selected_text: "你好",
   note_text: "Ghi chú dòng 1\nGhi chú dòng 2",
   color: "yellow",
   payload: {},
   revision: 0,
   created_at: "2026-10-04T00:00:00Z",
   updated_at: "2026-10-04T00:00:00Z",
   deleted_at: null,
  };
  expect(
   businessChineseReaderAnnotations([
    annotation,
    { ...annotation, paragraph_id: null },
    { ...annotation, start_offset: null },
    { ...annotation, end_offset: 0 },
    { ...annotation, selected_text: "" },
   ]),
  ).toEqual([
   {
    id: annotation.id,
    segmentId: "paragraph",
    text: "你好",
    noteText: "Ghi chú dòng 1\nGhi chú dòng 2",
    start: 0,
    end: 2,
    color: "yellow",
   },
  ]);
 });
 it("applies answer and meaning visibility independently without mutating source rows", () => {
  const hidden = businessChineseTableColumns(
   block,
   { ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning: false },
   false,
  );
  expect(hidden.visibleColumnIndexes).toEqual([0, 1]);
  expect(hidden.isVocabularyTable).toBe(true);
  expect(
   businessChineseTableColumns(block, { ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning: true }, false)
    .visibleColumnIndexes,
  ).toEqual([0, 1, 2]);
  expect(
   businessChineseTableColumns(block, { ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning: false }, true)
    .visibleColumnIndexes,
  ).toEqual([0, 1, 3]);
  expect(block.rows[0]).toHaveLength(4);
 });
 it("identifies canonical vocab by exact ordered Hanzi and pinyin, preserving alternate tables", () => {
  const vocabulary: TextbookLesson["vocab"] = [
   {
    id: "vocab-1",
    hanzi: "你好",
    traditional: "你好",
    pinyin: "nǐ hǎo",
    pos: "",
    hanviet: "",
    meaning: "Xin chào",
   },
  ];
  expect(isCanonicalVocabularyTable(block, vocabulary)).toBe(true);
  expect(
   isCanonicalVocabularyTable(
    { ...block, rows: [block.rows[0] ?? [], ["你好", "ní hǎo", "Xin chào", "你好"]] },
    vocabulary,
   ),
  ).toBe(false);
  expect(isCanonicalVocabularyTable(block, [])).toBe(false);
 });
 it("pairs translations by source block identity and handles absent translation sections", () => {
  const sections: TextbookLesson["sections"] = [
   {
    id: "source",
    title: "BÀI KHÓA",
    category: "text",
    blocks: [{ id: "source-block", type: "paragraph", text: "你好", rows: [] }],
   },
   {
    id: "translation",
    title: "DỊCH BÀI KHÓA",
    category: "text",
    blocks: [{ id: "translated-block", type: "paragraph", text: "Xin chào", rows: [] }],
   },
  ];
  expect([...pairedTextbookTranslations(sections)]).toEqual([["source-block", "Xin chào"]]);
  expect(pairedTextbookTranslations(sections.slice(0, 1)).size).toBe(0);
 });
 it("preserves Hanzi-only display and separates the first exercise arrow", () => {
  expect(isChineseOnlyText("你好，2026！")).toBe(true);
  expect(isChineseOnlyText("你好 — Xin chào")).toBe(false);
  expect(splitBusinessChineseExercise(" 请翻译 → Xin chào → ví dụ ")).toEqual({
   prompt: "请翻译",
   answer: "Xin chào → ví dụ",
  });
 });
});
