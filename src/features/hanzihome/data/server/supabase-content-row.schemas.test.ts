import { describe, expect, it } from "vitest";

import { lessonSectionRowSchema, lessonSummaryRowSchema } from "./supabase-content-row.schemas";

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
