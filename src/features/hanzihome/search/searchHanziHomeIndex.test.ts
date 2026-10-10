import { describe, expect, it } from "vitest";
import { HanyuLessonSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import type { HanziHomeData } from "@/features/hanzihome/types";
import { buildHanziHomeSearchIndex } from "./buildSearchIndex";
import {
 countSearchResultCategories,
 filterSearchResultCategory,
 searchHanziHomeIndex,
 selectSearchNavigationItems,
 splitSearchHighlight,
} from "./searchHanziHomeIndex";
import type { HanziHomeSearchIndexItem, HanziHomeSearchKind, HanziHomeSearchResult } from "./types";

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

describe("canonical search index nodes", () => {
 it.each([false, true])("indexes reading once when legacy blocks are mirrored: %s", (hasItems) => {
  const readingItems = [
   { id: "reading-one", type: "reading_text", order: 1, title: "希望", text: "希望工程" },
   { id: "reading-two", type: "reading_text", order: 2, title: "学校", text: "返回学校" },
  ];
  const sourceLesson = HanyuLessonSchema.parse({
   lesson: {
    id: "lesson-one",
    title: { zh: "希望工程" },
    sections: [
     {
      id: "reading-section",
      type: "reading",
      order: 1,
      title: "阅读",
      blocks: readingItems,
      ...(hasItems ? { items: readingItems } : {}),
     },
    ],
   },
  });
  const data: HanziHomeData = {
   courses: [],
   books: [],
   lessons: [
    {
     id: "lesson-one",
     titleZh: "希望工程",
     title: "Hy vọng",
     lessonNumber: 1,
     vocabIds: [],
     grammarPointIds: [],
     vocab: [],
     grammar: [],
     sourceLesson,
    },
   ],
   radicals: [],
   meta: {
    app: "hanzihome",
    dataset: "fixture",
    version: "1",
    generatedAt: "",
    sourceFiles: [],
    counts: { lessons: 1, vocab: 0, grammarPoints: 0, radicals: 0, flashcards: 0 },
    schemaNote: "",
   },
  };
  const index = buildHanziHomeSearchIndex(data);
  const nodes = index.filter((item) => item.kind === "lesson_text");
  expect(nodes.map((item) => item.id)).toEqual([
   "lesson-text:lesson-one:reading-one",
   "lesson-text:lesson-one:reading-two",
  ]);
  expect(nodes.map((item) => item.targetId)).toEqual(["reading-section", "reading-section"]);
  expect(nodes.map((item) => item.metadata?.contentNodeId)).toEqual(["reading-one", "reading-two"]);
  expect(nodes.map((item) => item.title)).toEqual(["希望", "学校"]);
  expect(new Set(index.map((item) => item.id)).size).toBe(index.length);
 });
});

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

 it("does not turn a course or lesson boost into a match for an unrelated query", () => {
  expect(
   searchHanziHomeIndex(mockIndex, "missing-phrase", {
    courseId: "course-1",
    lessonId: "lesson-1",
    includeGlobal: true,
   }),
  ).toEqual([]);
 });
});

describe("search result presentation data", () => {
 const kinds: HanziHomeSearchKind[] = [
  "vocab",
  "grammar",
  "exercise",
  "radical",
  "lesson_text",
  "section",
  "note",
  "navigation",
 ];
 const results: HanziHomeSearchResult[] = kinds.map((kind) => ({
  item: { id: kind, kind, title: kind, searchText: kind },
  score: 1,
 }));

 it("counts every kind once and keeps all lesson-related kinds in the existing category", () => {
  expect(countSearchResultCategories(results)).toEqual({
   all: 8,
   vocab: 1,
   grammar: 1,
   exercise: 1,
   radical: 1,
   lesson: 4,
  });
  expect(filterSearchResultCategory(results, "all")).toBe(results);
  expect(filterSearchResultCategory(results, "lesson").map((result) => result.item.kind)).toEqual([
   "lesson_text",
   "section",
   "note",
   "navigation",
  ]);
  expect(filterSearchResultCategory(results, "radical").map((result) => result.item.id)).toEqual([
   "radical",
  ]);
  expect(countSearchResultCategories([]).all).toBe(0);
 });

 it("includes global and current-course navigation while preserving order and the ten-item bound", () => {
  const items: HanziHomeSearchIndexItem[] = [
   { id: "excluded-kind", kind: "vocab", title: "词", searchText: "词" },
   {
    id: "other-course",
    kind: "navigation",
    title: "Other",
    searchText: "",
    courseId: "other",
    lessonId: "other",
   },
   {
    id: "current-lesson",
    kind: "navigation",
    title: "Lesson",
    searchText: "",
    lessonId: "lesson-1",
   },
   {
    id: "current-course",
    kind: "navigation",
    title: "Course",
    searchText: "",
    courseId: "course-1",
    lessonId: "lesson-2",
   },
   ...Array.from({ length: 12 }, (_, index): HanziHomeSearchIndexItem => ({
    id: `global-${index}`,
    kind: "navigation",
    title: "Global",
    searchText: "",
   })),
  ];
  const selected = selectSearchNavigationItems(items, {
   courseId: "course-1",
   lessonId: "lesson-1",
  });
  expect(selected.map((item) => item.id)).toEqual([
   "current-lesson",
   "current-course",
   ...Array.from({ length: 8 }, (_, index) => `global-${index}`),
  ]);
  expect(items).toHaveLength(16);
 });

 it("returns original Unicode text around the first case-insensitive match", () => {
  expect(splitSearchHighlight("学习中文，中文很好", " 中文 ")).toEqual({
   before: "学习",
   match: "中文",
   after: "，中文很好",
  });
  expect(splitSearchHighlight("Learn Hanzi", "HANZI")).toEqual({
   before: "Learn ",
   match: "Hanzi",
   after: "",
  });
  expect(splitSearchHighlight("你好", " ")).toEqual({ before: "你好", match: "", after: "" });
  expect(splitSearchHighlight("你好", "再见")).toEqual({ before: "你好", match: "", after: "" });
 });
});
