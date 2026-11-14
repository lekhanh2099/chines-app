import { describe, expect, it } from "vitest";

import {
 applyAggregateFilterChange,
 buildLessonByReviewItemId,
 createEmptyAggregateFilters,
} from "./aggregate-library-model";

describe("aggregate library model", () => {
 it("creates a fresh empty filter object each time", () => {
  const first = createEmptyAggregateFilters();
  expect(first).toEqual({ courseId: "", bookId: "", lessonId: "", q: "" });
  expect(createEmptyAggregateFilters()).not.toBe(first);
 });

 it("clears dependent filters when a parent filter changes", () => {
  const current = { courseId: "c1", bookId: "b1", lessonId: "l1", q: "ni" };

  expect(applyAggregateFilterChange(current, "courseId", "c2")).toEqual({
   courseId: "c2",
   bookId: "",
   lessonId: "",
   q: "ni",
  });
  expect(applyAggregateFilterChange(current, "bookId", "b2")).toEqual({
   courseId: "c1",
   bookId: "b2",
   lessonId: "",
   q: "ni",
  });
  expect(applyAggregateFilterChange(current, "q", "hao")).toEqual({ ...current, q: "hao" });
  expect(current.bookId).toBe("b1");
 });

 it("maps an empty lesson list to an empty review lookup", () => {
  expect(buildLessonByReviewItemId([]).size).toBe(0);
 });
});
