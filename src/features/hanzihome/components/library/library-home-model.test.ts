import { describe, expect, it } from "vitest";

import type { HanziHomeCatalogCourse, HanziHomeCourseBook } from "@/features/hanzihome/types";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { LibraryCourseGroup, LibraryCourseGroupKey } from "./library-course-groups";
import {
 buildLibraryCollectionOrder,
 excludeHiddenLibraryCollections,
 filterLibraryGroups,
 filterLibraryTextbooks,
 filterVisibleLibraryCollectionIds,
} from "./library-home-model";

function course(id: string, title: string): HanziHomeCatalogCourse {
 return {
  id,
  slug: id,
  title,
  type: "hanyu",
  order: 1,
  stats: { bookCount: 0, lessonCount: 0, vocabCount: 0, grammarCount: 0 },
 };
}

function group(key: LibraryCourseGroupKey, courses: HanziHomeCatalogCourse[]): LibraryCourseGroup {
 return {
  key,
  title: key,
  description: "",
  isDraft: false,
  courses,
  bookCount: 0,
  lessonCount: 0,
 };
}

const groups = [
 group("hanyu", [course("hanyu-q2", "Hán ngữ quyển 2")]),
 group("boya", [course("boya-elementary", "Boya sơ cấp")]),
 group("listening", [course("listening-1", "Nghe")]),
];
const books: HanziHomeCourseBook[] = [
 { id: "boya-book-1", courseId: "boya-elementary", title: "Tập Một", order: 1 },
];
const textbooks: TextbookBookSummary[] = [
 { id: "nhip-cau-1", key: "nhip-cau", label: "Nhịp cầu", lessons: [] },
];
const getGroupTitle = (key: LibraryCourseGroupKey) => `Nhóm ${key}`;

describe("library home model", () => {
 it("filters groups by category and by group, course or book text", () => {
  const keys = (filter: string, searchTerm: string) =>
   filterLibraryGroups({ groups, books, filter, searchTerm, getGroupTitle }).map(
    (item) => item.key,
   );

  expect(keys("all", "")).toEqual(["hanyu", "boya", "listening"]);
  expect(keys("hanyu", "")).toEqual(["hanyu"]);
  expect(keys("boya", "")).toEqual(["boya"]);
  expect(keys("specialized", "")).toEqual(["listening"]);
  expect(keys("all", "nhóm hanyu")).toEqual(["hanyu"]);
  expect(keys("all", "tập một")).toEqual(["boya"]);
 });

 it("shows static textbooks only for all and specialized filters", () => {
  expect(filterLibraryTextbooks(textbooks, "all", "nhịp")).toEqual(textbooks);
  expect(filterLibraryTextbooks(textbooks, "specialized", "")).toEqual(textbooks);
  expect(filterLibraryTextbooks(textbooks, "hanyu", "")).toEqual([]);
  expect(filterLibraryTextbooks(textbooks, "all", "boya")).toEqual([]);
 });

 it("keeps saved order first, appends new collections once and filters to visible ids", () => {
  const order = buildLibraryCollectionOrder(
   ["static:nhip-cau-1", "group:boya", "group:missing"],
   groups,
   textbooks,
  );

  expect(order).toEqual([
   "static:nhip-cau-1",
   "group:boya",
   "group:missing",
   "group:hanyu",
   "group:listening",
  ]);
  expect(filterVisibleLibraryCollectionIds(order, [groups[0]], textbooks)).toEqual([
   "static:nhip-cau-1",
   "group:hanyu",
  ]);
 });
});

describe("hidden library collections", () => {
 const ids = ["group:hanyu", "static:khau-ngu", "group:boya"];

 it("drops hidden collections from the grid and keeps the saved order", () => {
  expect(excludeHiddenLibraryCollections(ids, ["static:khau-ngu"], false)).toEqual([
   "group:hanyu",
   "group:boya",
  ]);
 });

 it("lists every collection while the learner reviews hidden ones", () => {
  expect(excludeHiddenLibraryCollections(ids, ["static:khau-ngu"], true)).toEqual(ids);
 });
});
