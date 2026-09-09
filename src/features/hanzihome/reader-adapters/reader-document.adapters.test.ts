import { describe, expect, it } from "vitest";

import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import { readerHasCapability } from "@/features/reader/model/reader-capabilities";
import { readerResourceToDocument } from "@/features/reading/adapters/reading-resource.adapter";
import {
 buildBusinessChineseReaderDocument,
 buildTextbookHref,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import {
 getTextbookCatalog,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

const now = "2026-08-18T00:00:00.000Z";

function createResource(): ReaderDocumentResource {
 return {
  document: {
   id: "reader-1",
   lesson_id: "lesson-1",
   owner_id: null,
   source: "seed",
   publication_status: "published",
   kind: "hsk",
   slug: "reader-1",
   unit_id: null,
   reading_number: 1,
   title_zh: "九眼楼",
   title_pinyin: "Jiǔyǎn Lóu",
   title_vi: "Lầu Chín Mắt",
   genre_vi: "Văn bản giới thiệu di tích",
   objectives_vi: [],
   analysis: {
    mainIdeaVi: "Giới thiệu Cửu Nhãn Lâu.",
    paragraphStructureVi: [],
    logicChainVi: [],
    trapsVi: [],
    keywordsZh: [],
   },
   summary: { modelZh: "九眼楼位于北京。", rubricVi: [] },
   source_metadata: {},
   schema_version: "1",
   imported_at: null,
   created_at: now,
   updated_at: now,
   deleted_at: null,
  },
  paragraphs: [
   {
    id: "paragraph-2",
    document_id: "reader-1",
    source: "seed",
    paragraph_order: 2,
    zh: "第二段。",
    pinyin: "dì èr duàn",
    vi: "Đoạn hai.",
    role_vi: "",
    source_version: 1,
    created_at: now,
    updated_at: now,
   },
   {
    id: "paragraph-1",
    document_id: "reader-1",
    source: "seed",
    paragraph_order: 1,
    zh: "第一段。",
    pinyin: "dì yī duàn",
    vi: "Đoạn một.",
    role_vi: "Mở đầu",
    source_version: 1,
    created_at: now,
    updated_at: now,
   },
  ],
  vocabularyLinks: [],
  vocabulary: [{ id: "vocab-1", word: "长城", pinyin: "chángchéng", meaning: "Trường Thành" }],
  exerciseGroups: [
   {
    id: "group-1",
    document_id: "reader-1",
    source: "seed",
    exercise_order: 1,
    exercise_type: "short_answer",
    title_zh: "问题",
    title_vi: "Câu hỏi",
    created_at: now,
    updated_at: now,
   },
  ],
  exerciseItems: [],
  assets: [],
 };
}

describe("unified reader source adapters", () => {
 it.each(getTextbookCatalog())(
  "preserves canonical reading targets and a real source href for $label",
  (book) => {
   const lesson = getTextbookLesson(book.key, 1);
   if (!lesson) throw new Error("Missing textbook fixture");
   const document = buildBusinessChineseReaderDocument(lesson, "text");
   const all = buildBusinessChineseReaderDocument(lesson, "all");
   const readingSectionIds = lesson.sections
    .filter((section) => section.category === "text" && !section.title.includes("DỊCH BÀI KHÓA"))
    .map((section) => section.id);

   expect(document.id).toBe(`${lesson.id}:text`);
   expect(document.source.sourceId).toBe(lesson.id);
   expect(document.source.href).toBe(buildTextbookHref(book.key, lesson.number));
   expect(document.segments.length).toBeGreaterThan(0);
   expect(new Set(document.segments.map((segment) => segment.id)).size).toBe(
    document.segments.length,
   );
   for (const segment of document.segments) {
    expect(readingSectionIds).toContain(segment.sectionId);
    expect(all.segments.find((candidate) => candidate.id === segment.id)).toEqual(segment);
   }
  },
 );

 it("normalizes the existing Reader resource without leaking source row order", () => {
  const document = readerResourceToDocument(createResource());

  expect(document.id).toBe("reader-1");
  expect(document.source.kind).toBe("reader-resource");
  expect(document.segments.map((segment) => segment.id)).toEqual(["paragraph-1", "paragraph-2"]);
  expect(document.segments[0]?.role).toBe("Mở đầu");
  expect(readerHasCapability(document, "pinyin")).toBe(true);
  expect(readerHasCapability(document, "translation")).toBe(true);
  expect(readerHasCapability(document, "vocabulary")).toBe(true);
  expect(readerHasCapability(document, "exercises")).toBe(true);
  expect(readerHasCapability(document, "analysis")).toBe(true);
  expect(readerHasCapability(document, "summary")).toBe(true);
 });
});
