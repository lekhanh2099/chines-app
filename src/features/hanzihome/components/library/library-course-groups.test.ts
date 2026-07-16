import { describe, expect, it } from "vitest";

import type { HanziHomeCatalogCourse, HanziHomeCourseBook } from "@/features/hanzihome/types";

import { groupLibraryCourses } from "./library-course-groups";

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
