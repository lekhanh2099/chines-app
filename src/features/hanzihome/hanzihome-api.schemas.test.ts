import { describe, expect, it } from "vitest";

import {
 aggregateApiResponseSchema,
 catalogApiResponseSchema,
 lessonApiResponseSchema,
} from "./hanzihome-api.schemas";

const lesson = {
 id: "lesson-1",
 lessonNumber: 1,
 titleZh: "你好",
 title: "Xin chào",
 vocabIds: [],
 grammarPointIds: [],
 vocab: [],
 grammar: [],
};

describe("HanziHome API response contracts", () => {
 it("accepts the summary-only catalog shape", () => {
  const result = catalogApiResponseSchema.safeParse({
   catalog: {
    source: "db",
    courses: [
     {
      id: "course-1",
      slug: "hanyu-1",
      title: "Hanyu 1",
      type: "textbook",
      order: 1,
      stats: { bookCount: 1, lessonCount: 1, vocabCount: 0, grammarCount: 0 },
     },
    ],
    books: [{ id: "book-1", courseId: "course-1", title: "Quyển 1", order: 1 }],
    lessons: [],
    radicals: [],
    meta: {
     app: "HanziHome",
     dataset: "supabase",
     version: "1",
     generatedAt: "2026-07-14T00:00:00.000Z",
     sourceFiles: [],
     counts: { lessons: 1, vocab: 0, grammarPoints: 0, radicals: 0, flashcards: 0 },
    },
   },
  });

  expect(result.success).toBe(true);
 });

 it("rejects a lesson payload that omits stable resource identifiers", () => {
  expect(
   lessonApiResponseSchema.safeParse({
    lesson: {
     lessonNumber: lesson.lessonNumber,
     titleZh: lesson.titleZh,
     title: lesson.title,
     vocabIds: [],
     grammarPointIds: [],
     vocab: [],
     grammar: [],
    },
   }).success,
  ).toBe(false);
 });

 it("rejects aggregate records without their course, book, and lesson boundary", () => {
  const result = aggregateApiResponseSchema.safeParse({
   items: [{ id: "vocab-1", word: "你好", pinyin: "nǐ hǎo", meaning: "xin chào" }],
  });

  expect(result.success).toBe(false);
 });
});
