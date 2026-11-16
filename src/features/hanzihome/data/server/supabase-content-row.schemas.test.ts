import { describe, expect, it } from "vitest";

import {
 lessonSectionRowSchema,
 lessonSummaryRowSchema,
 vocabCoreRowSchema,
} from "./supabase-content-row.schemas";

const course = {
 id: "course-1",
 slug: "course-1",
 title: "Course 1",
 subtitle: null,
 type: "seed",
 course_order: 1,
 updated_at: "2026-07-16T00:00:00.000Z",
};
const book = {
 id: "book-1",
 course_id: "course-1",
 title: "Book 1",
 short_title: null,
 book_order: 1,
 updated_at: "2026-07-16T00:00:00.000Z",
};

describe("Supabase content row schemas", () => {
 it("preserves the nullable canonical word link without changing lesson meaning", () => {
  const row = {
   id: "vocab-1",
   word_id: "word-1",
   lesson_id: "lesson-1",
   course_id: "course-1",
   book_id: "book-1",
   item_order: 1,
   word: "行",
   pinyin: "háng",
   han_viet: "Hàng",
   meaning: "ngành nghề trong bài",
   category: "Từ vựng",
   level: null,
   pos_vi: null,
   pos_zh: null,
   updated_at: "2026-11-16T00:00:00.000Z",
  };
  expect(vocabCoreRowSchema.parse(row)).toMatchObject({ word_id: "word-1", meaning: row.meaning });
  expect(vocabCoreRowSchema.parse({ ...row, word_id: null }).word_id).toBeNull();
  const { word_id, ...missingLink } = row;
  expect(word_id).toBe("word-1");
  expect(vocabCoreRowSchema.safeParse(missingLink).success).toBe(false);
 });

 it("normalizes Supabase to-one relations returned as arrays", () => {
  const row = lessonSummaryRowSchema.parse({
   id: "lesson-1",
   course_id: course.id,
   book_id: book.id,
   lesson_number: 1,
   lesson_order: 1,
   title_zh: "第一课",
   source_file: null,
   updated_at: "2026-07-16T00:00:00.000Z",
   course: [course],
   book: [book],
   vocab_count: [{ count: 10 }],
   grammar_count: [{ count: 2 }],
  });

  expect(row.course.id).toBe(course.id);
  expect(row.book.id).toBe(book.id);
  expect(row.tags).toEqual([]);
 });

 it("rejects a section without a durable UUID", () => {
  const parsed = lessonSectionRowSchema.safeParse({
   id: "section-1",
   lesson_id: "lesson-1",
   source_section_id: "source-1",
   section_key: "overview",
   section_type: "text",
   title: "Overview",
   title_vi: "Tổng quan",
   section_order: 1,
   payload: {},
   source_file: null,
   updated_at: "2026-07-16T00:00:00.000Z",
  });

  expect(parsed.success).toBe(false);
 });
});
