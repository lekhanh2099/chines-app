import { describe, expect, it } from "vitest";

import {
 businessChineseMeta,
 getBusinessChineseBookSummaries,
 getBusinessChineseLesson,
} from "./business-chinese-data";

describe("Business Chinese route content", () => {
 it("keeps the two uploaded course books and all twenty lessons", () => {
  const books = getBusinessChineseBookSummaries();

  expect(books.map((book) => book.key)).toEqual(["tm2", "tm3"]);
  expect(books.map((book) => book.lessonCount)).toEqual([10, 10]);
  expect(businessChineseMeta.lessonCount).toBe(20);
 });

 it("keeps the source vocabulary inventory", () => {
  const books = getBusinessChineseBookSummaries();
  const totalVocabulary = books.reduce((sum, book) => sum + book.vocabularyCount, 0);

  expect(totalVocabulary).toBe(393);
  expect(businessChineseMeta.vocabCount).toBe(393);
 });

 it("preserves representative source lesson titles", () => {
  expect(getBusinessChineseLesson("tm2", 1).title).toContain("订购真丝面料");
  expect(getBusinessChineseLesson("tm3", 1).title).toContain("开户汇款");
 });
});
