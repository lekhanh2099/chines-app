import { describe, expect, it } from "vitest";

import {
 HANZIHOME_SEARCH_CATEGORIES,
 countSearchResultCategories,
 searchResultCategory,
 splitSearchHighlight,
} from "./search-results";
import { HanziHomeSearchKindSchema } from "./types";

describe("search result categories", () => {
 it("counts every kind once and keeps lesson-related kinds in the lesson tab", () => {
  expect(countSearchResultCategories(HanziHomeSearchKindSchema.options)).toEqual({
   all: 9,
   vocab: 1,
   grammar: 1,
   exercise: 1,
   radical: 1,
   note: 1,
   reading: 1,
   lesson: 3,
  });
  expect(
   HanziHomeSearchKindSchema.options.filter((kind) => searchResultCategory(kind) === "lesson"),
  ).toEqual(["lesson_text", "section", "navigation"]);
  expect(searchResultCategory("reader_document")).toBe("reading");
  expect(countSearchResultCategories([]).all).toBe(0);
 });

 it("gives every non-all category at least one owning kind", () => {
  const owned = new Set(HanziHomeSearchKindSchema.options.map(searchResultCategory));
  expect(HANZIHOME_SEARCH_CATEGORIES.filter((category) => !owned.has(category))).toEqual(["all"]);
 });
});

describe("splitSearchHighlight", () => {
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
