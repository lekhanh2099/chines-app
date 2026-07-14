import { describe, expect, it } from "vitest";

import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";
import { resolveRecentLearning } from "./recent-learning";

const course: HanziHomeCatalogCourse = {
 id: "course-1",
 slug: "course-1",
 title: "Giáo trình Hán ngữ",
 type: "textbook",
 order: 1,
 stats: { bookCount: 1, lessonCount: 1, vocabCount: 10, grammarCount: 2 },
};

const book: HanziHomeCourseBook = {
 id: "book-1",
 courseId: course.id,
 title: "Quyển 1",
 order: 1,
};

const lesson: HanziHomeLesson = {
 id: "lesson-1",
 lessonNumber: 3,
 titleZh: "你叫什么名字",
 title: "Bạn tên là gì?",
 courseId: course.id,
 bookId: book.id,
 vocabIds: [],
 grammarPointIds: [],
 vocab: [],
 grammar: [],
};

describe("resolveRecentLearning", () => {
 it("builds the resume target from the saved course, lesson, and module", () => {
  const result = resolveRecentLearning({
   courses: [course],
   books: [book],
   lessons: [lesson],
   courseId: course.id,
   lessonId: lesson.id,
   module: "grammar",
  });

  expect(result?.href).toBe("/hanzihome?courseId=course-1&bookId=book-1&lesson=3&module=grammar");
  expect(result?.book?.id).toBe(book.id);
 });

 it("ignores stale state when the lesson belongs to another course", () => {
  expect(
   resolveRecentLearning({
    courses: [course],
    books: [book],
    lessons: [{ ...lesson, courseId: "course-2" }],
    courseId: course.id,
    lessonId: lesson.id,
    module: "overview",
   }),
  ).toBeNull();
 });

 it("returns no card when the saved lesson is missing", () => {
  expect(
   resolveRecentLearning({
    courses: [course],
    books: [book],
    lessons: [],
    courseId: course.id,
    lessonId: lesson.id,
    module: "overview",
   }),
  ).toBeNull();
 });
});
