import { describe, expect, it } from "vitest";

import { vocabCoreRowSchema } from "./supabase-content-row.schemas";

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
});
