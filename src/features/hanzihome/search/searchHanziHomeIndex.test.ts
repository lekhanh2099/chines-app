import { describe, expect, it } from "vitest";
import { searchHanziHomeIndex } from "./searchHanziHomeIndex";
import type { HanziHomeSearchIndexItem } from "./types";

const mockIndex: HanziHomeSearchIndexItem[] = [
 {
  id: "vocab-budan",
  kind: "vocab",
  title: "不但……而且……",
  subtitle: "Giáo trình Hán ngữ Quyển 2 - Bài 7",
  href: "/hanzihome?courseId=course-1&lesson=1&module=vocab",
  searchText: "budan erqie khong nhung ma con bu dan er qie",
  courseId: "course-1",
  lessonId: "lesson-1",
 },
 {
  id: "exercise-1",
  kind: "exercise",
  title: "Sửa câu sai",
  subtitle: "Giáo trình Hán ngữ Quyển 2 - Bài 7 - Bài tập",
  href: "/hanzihome?courseId=course-1&lesson=1&module=practice",
  searchText: "chọn đáp án đúng: 他不但聪明而且很努力 trong ngữ cảnh này",
  courseId: "course-1",
  lessonId: "lesson-1",
 },
 {
  id: "grammar-1",
  kind: "grammar",
  title: "Câu chữ 把",
  subtitle: "Giáo trình Hán ngữ Quyển 3 - Bài 12",
  href: "/hanzihome?courseId=course-1&lesson=2&module=grammar",
  searchText: "cau chu ba cau truc chu ngu + ba + tan ngu + dong tu",
  courseId: "course-1",
  lessonId: "lesson-2",
 },
];

describe("searchHanziHomeIndex", () => {
 it("prioritizes exact title matches over body-only matches", () => {
  const results = searchHanziHomeIndex(mockIndex, "不但");
  expect(results.length).toBe(2);
  // Vocab item with '不但' at the beginning of title should be ranked first
  expect(results[0].item.id).toBe("vocab-budan");
  expect(results[1].item.id).toBe("exercise-1");
  // Body-only match has a snippet extracted
  expect(results[1].matchedSnippet).toBeDefined();
  expect(results[1].matchedSnippet).toContain("不但");
 });

 it("extracts contextual snippet when matched only in searchText", () => {
  const results = searchHanziHomeIndex(mockIndex, "努力");
  expect(results.length).toBe(1);
  expect(results[0].item.id).toBe("exercise-1");
  expect(results[0].matchedSnippet).toContain("努力");
 });

 it("filters correctly by kinds", () => {
  const results = searchHanziHomeIndex(mockIndex, "不但", {
   kinds: ["vocab"],
  });
  expect(results.length).toBe(1);
  expect(results[0].item.id).toBe("vocab-budan");

  const exerciseOnly = searchHanziHomeIndex(mockIndex, "不但", {
   kinds: ["exercise"],
  });
  expect(exerciseOnly.length).toBe(1);
  expect(exerciseOnly[0].item.id).toBe("exercise-1");
 });

 it("returns empty array for empty or whitespace query", () => {
  expect(searchHanziHomeIndex(mockIndex, "")).toEqual([]);
  expect(searchHanziHomeIndex(mockIndex, "   ")).toEqual([]);
 });

 it("normalizes case and accents", () => {
  const results = searchHanziHomeIndex(mockIndex, "cau chu ba");
  expect(results.length).toBe(1);
  expect(results[0].item.id).toBe("grammar-1");
 });
});
