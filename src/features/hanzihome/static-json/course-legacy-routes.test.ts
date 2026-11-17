import { describe, expect, it } from "vitest";

import { legacyCourseLessonHref } from "./course-legacy-routes";

describe("legacy course routes", () => {
 it("maps a course, book, lesson and module to the converted lesson tab", () => {
  expect(
   legacyCourseLessonHref({
    courseId: "hanyu-q2",
    bookId: "hanyu-q2-shang",
    lesson: "3",
    module: "vocab",
   }),
  ).toBe("/textbooks/hanyu-q2-shang?lesson=3&tab=vocab");
 });

 it("finds the book of a course that contains the lesson number", () => {
  expect(legacyCourseLessonHref({ courseId: "hanyu-q2", lesson: "20" })).toBe(
   "/textbooks/hanyu-q2-xia?lesson=20",
  );
 });

 it("opens the first lesson when the lesson is unknown", () => {
  expect(legacyCourseLessonHref({ courseId: "hanyu-q3" })).toMatch(
   /^\/textbooks\/hanyu-q3-shang\?lesson=\d+$/u,
  );
 });

 it("keeps an explicit book when two volumes share lesson numbers", () => {
  expect(
   legacyCourseLessonHref({
    courseId: "boya-nine-volume-second-edition",
    bookId: "boya-9e-advanced-2",
    lesson: "3",
   }),
  ).toBe("/textbooks/boya-9e-advanced-2?lesson=3");
 });

 it("leaves other courses alone", () => {
  expect(legacyCourseLessonHref({ courseId: "hanzihome-studio-grammar", lesson: "1" })).toBeNull();
  expect(legacyCourseLessonHref({})).toBeNull();
 });
});
