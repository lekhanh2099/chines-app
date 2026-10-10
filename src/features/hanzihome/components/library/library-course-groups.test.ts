import { describe, expect, it } from "vitest";

import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";

import {
 getLibraryStats,
 getLibraryCourseEntries,
 getLibraryBookStudy,
 groupLibraryCourses,
} from "./library-course-groups";

function createCourse(
 id: string,
 type: string,
 order: number,
 lessonCount: number,
): HanziHomeCatalogCourse {
 return {
  id,
  slug: id,
  title: id,
  type,
  order,
  stats: { bookCount: 0, lessonCount, vocabCount: 0, grammarCount: 0 },
 };
}

const books: HanziHomeCourseBook[] = [
 { id: "hanyu-book", courseId: "hanyu-q2", title: "Hán ngữ", order: 1 },
 { id: "boya-book-1", courseId: "boya-elementary", title: "Boya 1", order: 1 },
 { id: "boya-book-2", courseId: "boya-elementary", title: "Boya 2", order: 2 },
 {
  id: "boya-9e-intermediate-1",
  courseId: "boya-nine-volume-second-edition",
  title: "Trung cấp I",
  order: 1,
 },
];

describe("groupLibraryCourses", () => {
 it("separates Hán ngữ, Boya and listening using stable catalog metadata", () => {
  const groups = groupLibraryCourses(
   [
    createCourse("boya-elementary", "hanyu", 3, 55),
    createCourse("hanyu-listening-revised", "listening", 4, 50),
    createCourse("hanyu-q2", "hanyu", 1, 25),
   ],
   books,
  );

  expect(groups.map((group) => group.key)).toEqual(["hanyu", "boya", "listening"]);
  expect(groups[1]).toMatchObject({ bookCount: 2, lessonCount: 55, isDraft: false });
  expect(groups[0]?.isDraft).toBe(false);
 });

 it("keeps the nine-volume second edition separate from the existing Boya catalog", () => {
  const groups = groupLibraryCourses(
   [
    createCourse("boya-elementary", "hanyu", 3, 55),
    createCourse("boya-nine-volume-second-edition", "boya", 90, 42),
   ],
   books,
  );

  expect(groups.map((group) => group.key)).toEqual(["boya", "boyaSecondEdition"]);
  expect(groups[1]).toMatchObject({
   title: "Boya 9 quyển · Bản 2",
   bookCount: 1,
   lessonCount: 42,
   isDraft: false,
  });
 });

 it("keeps custom courses visible in the fallback group and sorts each group", () => {
  const groups = groupLibraryCourses(
   [createCourse("custom-later", "custom", 2, 1), createCourse("custom-first", "custom", 1, 2)],
   [],
  );

  expect(groups).toHaveLength(1);
  expect(groups[0]?.key).toBe("other");
  expect(groups[0]?.courses.map((course) => course.id)).toEqual(["custom-first", "custom-later"]);
 });
});

describe("library summary policies", () => {
 const course = createCourse("course-a", "hanyu", 1, 2);
 const book: HanziHomeCourseBook = { id: "book-a", courseId: course.id, title: "A", order: 1 };
 const first: HanziHomeLesson = {
  id: "lesson-1",
  courseId: course.id,
  bookId: book.id,
  lessonNumber: 1,
  title: "one",
  titleZh: "一",
  vocabIds: ["v1", "v2"],
  grammarPointIds: ["g1"],
  vocab: [],
  grammar: [],
 };
 const second: HanziHomeLesson = {
  ...first,
  id: "lesson-2",
  lessonNumber: 2,
  vocabCount: 0,
  grammarCount: 3,
 };
 const otherBookLesson: HanziHomeLesson = { ...first, id: "other", bookId: "other-book" };
 it("counts only catalog summaries, including zero counts", () => {
  expect(getLibraryStats([], [])).toEqual({
   courseCount: 0,
   bookCount: 0,
   lessonCount: 0,
   grammarCount: 0,
  });
  expect(
   getLibraryStats(
    [
     { ...course, stats: { ...course.stats, grammarCount: 5 } },
     createCourse("course-b", "custom", 2, 7),
    ],
    [book],
   ),
  ).toEqual({ courseCount: 2, bookCount: 1, lessonCount: 9, grammarCount: 5 });
 });
 it("keeps course order, orders only its books and retains lesson order without mutating inputs", () => {
  const laterBook = { ...book, id: "book-later", order: 3 };
  const courseBooks = [laterBook, book, { ...book, id: "foreign", courseId: "course-b" }];
  const lessons = [second, first, { ...first, id: "foreign-lesson", courseId: "course-b" }];
  const group = groupLibraryCourses([course], courseBooks)[0];
  if (!group) throw new Error("Missing group");
  const entries = getLibraryCourseEntries(group, courseBooks, lessons);
  expect(entries.map((entry) => entry.course.id)).toEqual([course.id]);
  expect(entries[0]?.books.map((item) => item.id)).toEqual([book.id, laterBook.id]);
  expect(entries[0]?.lessons.map((item) => item.id)).toEqual([second.id, first.id]);
  expect(courseBooks.map((item) => item.id)).toEqual([laterBook.id, book.id, "foreign"]);
 });
 it("uses only book summaries for counts, with explicit zero ahead of legacy ID counts", () => {
  const result = getLibraryBookStudy(course, book, [first, second, otherBookLesson], "");
  expect(result.bookLessons.map((item) => item.id)).toEqual([first.id, second.id]);
  expect(result.visibleLessonCount).toBe(2);
  expect(result.visibleVocabCount).toBe(2);
  expect(result.visibleGrammarCount).toBe(4);
  expect(result.effectiveLesson).toBe(first);
  expect(result.href).toBe("/hanzihome?courseId=course-a&bookId=book-a&lesson=1");
 });
 it("resolves a selected second lesson and falls back after it disappears or belongs to another book", () => {
  expect(getLibraryBookStudy(course, book, [first, second], second.id).href).toBe(
   "/hanzihome?courseId=course-a&bookId=book-a&lesson=2",
  );
  expect(getLibraryBookStudy(course, book, [first], second.id).effectiveLesson).toBe(first);
  expect(
   getLibraryBookStudy(course, book, [first, otherBookLesson], otherBookLesson.id).effectiveLesson,
  ).toBe(first);
 });
 it("keeps an empty book without inventing a lesson destination", () => {
  const result = getLibraryBookStudy(course, book, [], second.id);
  expect(result.bookLessons).toEqual([]);
  expect(result.effectiveLesson).toBeNull();
  expect(result.href).toBe("/hanzihome?courseId=course-a&bookId=book-a");
  expect(result.visibleLessonCount).toBe(0);
  expect(result.visibleVocabCount).toBe(0);
  expect(result.visibleGrammarCount).toBe(0);
 });
});
