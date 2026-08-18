import { describe, expect, it } from "vitest";

import type { ReaderDocumentResource } from "../reader-content-api";
import { readerHasCapability } from "../model/reader-capabilities";
import { articleToReaderDocument } from "./article.adapter";
import { conversationToReaderDocument } from "./conversation.adapter";
import { plainTextToReaderDocument } from "./plain-text.adapter";
import { readerResourceToDocument } from "./reader-resource.adapter";

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

 it("turns temporary plain text into paragraphs without requiring persistence metadata", () => {
  const document = plainTextToReaderDocument({
   id: "draft-1",
   title: "Tự soạn",
   text: "第一段。\n\n第二段。\n还有一句。",
  });

  expect(document.source.kind).toBe("plain-text");
  expect(document.segments).toHaveLength(2);
  expect(document.segments[1]?.zh).toBe("第二段。\n还有一句。");
  expect(document.capabilities).toEqual([]);
 });

 it("normalizes article paragraphs by explicit source order and derives optional reading content", () => {
  const document = articleToReaderDocument({
   id: "article-1",
   title: "新闻学习版",
   paragraphs: [
    { id: "a-2", order: 2, zh: "第二段。", vi: "Đoạn hai." },
    { id: "a-1", order: 1, zh: "第一段。", pinyin: "dì yī duàn" },
   ],
  });

  expect(document.segments.map((segment) => segment.id)).toEqual(["a-1", "a-2"]);
  expect(readerHasCapability(document, "pinyin")).toBe(true);
  expect(readerHasCapability(document, "translation")).toBe(true);
 });

 it("represents conversation turns as dialogue segments with stable speaker metadata", () => {
  const document = conversationToReaderDocument({
   id: "conversation-1",
   turns: [
    { id: "turn-2", order: 2, speaker: { label: "朋友" }, zh: "我也很好。" },
    { id: "turn-1", order: 1, speaker: { label: "我" }, zh: "你好吗？", vi: "Bạn khỏe không?" },
   ],
  });

  expect(document.segments.map((segment) => segment.id)).toEqual(["turn-1", "turn-2"]);
  expect(document.segments[0]?.kind).toBe("dialogue-turn");
  expect(document.segments[0]?.speaker?.label).toBe("我");
  expect(readerHasCapability(document, "translation")).toBe(true);
 });
});
