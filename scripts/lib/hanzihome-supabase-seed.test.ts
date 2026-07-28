import { describe, expect, it } from "vitest";

import type { Section } from "../../src/features/hanzihome/schemas/hanyu-lesson.types";
import {
 lessonSectionPayloadForDatabase,
 materializeVocabEnrichment,
 type VocabItemRow,
} from "./hanzihome-supabase-seed";

const vocabularySection: Section = {
 id: "vocabulary",
 type: "vocabulary",
 order: 2,
 title: "生词",
 title_vi: "Từ mới",
 items: [
  {
   id: "word-1",
   type: "vocabulary_item",
   order: 1,
   hanzi: "学习",
   pinyin: "xuéxí",
   meaning_vi: "học tập",
   meaning_en: "",
   pos: "verb",
   tags: [],
   examples: [],
   audio_key: "",
   check_needed: false,
  },
 ],
};

const normalizedVocabularyItem: VocabItemRow = {
 id: "word-1",
 lesson_id: "lesson-1",
 course_id: "course-1",
 book_id: "book-1",
 owner_id: null,
 source: "seed",
 item_order: 1,
 word: "学习",
 pinyin: "xuéxí",
 han_viet: "học tập",
 meaning: "học tập",
 meaning_en: null,
 tags: [],
 category: "Từ vựng",
 level: null,
 pos_vi: "verb",
 pos_zh: null,
 tone: null,
 source_file: null,
 imported_at: "2026-07-27T00:00:00.000Z",
};

describe("materializeVocabEnrichment", () => {
 it("materializes examples and collocations for synthetic/proper-noun vocabulary items", () => {
  const result = materializeVocabEnrichment({
   lessonId: "boya-elementary-1-l01",
   importedAt: "2026-07-15T00:00:00.000Z",
   rawItem: {
    id: "boya-elementary-1-l01-pn01",
    hanzi: "大卫",
    pinyin: "dà wèi",
    meaning_vi: "David",
    pos: "proper_noun",
    examples: [
     {
      zh: "我叫大卫。",
      pinyin: "Wǒ jiào Dàwèi.",
      vi: "Tôi tên là David.",
     },
    ],
    collocations: [
     {
      zh: "大卫先生",
      pinyin: "Dàwèi xiānsheng",
      vi: "ông David",
      pattern: "专名 + 称谓",
     },
    ],
   },
  });

  expect(result.examples).toEqual([
   expect.objectContaining({
    id: "30aee97b-631d-5b55-97d1-0d01532db972",
    vocab_item_id: "boya-elementary-1-l01-pn01",
    lesson_id: "boya-elementary-1-l01",
    zh: "我叫大卫。",
    vi: "Tôi tên là David.",
   }),
  ]);
  expect(result.collocationDetail).toEqual(
   expect.objectContaining({
    vocab_item_id: "boya-elementary-1-l01-pn01",
    lesson_id: "boya-elementary-1-l01",
    section_key: "collocations",
    lines: ["大卫先生 · Dàwèi xiānsheng — ông David — 专名 + 称谓"],
   }),
  );
 });
});

describe("lessonSectionPayloadForDatabase", () => {
 it("keeps the vocabulary section shell without duplicating its items", () => {
  expect(lessonSectionPayloadForDatabase(vocabularySection, [normalizedVocabularyItem])).toEqual({
   ...vocabularySection,
   items: [],
  });
 });

 it("preserves vocabulary items when the normalized source differs", () => {
  expect(
   lessonSectionPayloadForDatabase(vocabularySection, [
    { ...normalizedVocabularyItem, meaning: "nghiên cứu" },
   ]),
  ).toEqual(vocabularySection);
 });
});
