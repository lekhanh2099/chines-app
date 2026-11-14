import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace", () => ({
 BusinessChineseStudyWorkspace: () => null,
}));

import {
 getTextbookCatalogForBookKeys,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

import ReadingComprehensionPage from "./page";

describe("ReadingComprehensionPage", () => {
 it("defaults to Đọc hiểu, Bài 1 with the selected lesson detail", async () => {
  const result = await ReadingComprehensionPage({ searchParams: Promise.resolve({}) });
  const lesson = getTextbookLesson("doc-hieu", 1);

  expect(lesson?.sections.length).toBeGreaterThan(0);
  expect(result).toHaveProperty("props.lesson", lesson);
  expect(result).toMatchObject({
   key: lesson?.id,
   props: { lesson: { bookKey: "doc-hieu", number: 1 } },
  });
 });

 it("selects the final lesson without switching to another curriculum", async () => {
  const result = await ReadingComprehensionPage({
   searchParams: Promise.resolve({ book: "tm3", lesson: "18" }),
  });
  const lesson = getTextbookLesson("doc-hieu", 18);

  expect(lesson?.sections.length).toBeGreaterThan(0);
  expect(result).toHaveProperty("props.lesson", lesson);
  expect(result).toMatchObject({
   key: lesson?.id,
   props: { lesson: { bookKey: "doc-hieu", number: 18 } },
  });
 });

 it.each(["bad", "1x", "0", "-1", "19", "1.5", "", "Infinity"])(
  "falls back to Bài 1 for invalid lesson query %s",
  async (lesson) => {
   const result = await ReadingComprehensionPage({ searchParams: Promise.resolve({ lesson }) });

   expect(result).toHaveProperty("props.lesson", getTextbookLesson("doc-hieu", 1));
  },
 );

 it("falls back to Bài 1 for repeated lesson query values", async () => {
  const result = await ReadingComprehensionPage({
   searchParams: Promise.resolve({ lesson: ["2", "18"] }),
  });

  expect(result).toHaveProperty("props.lesson", getTextbookLesson("doc-hieu", 1));
 });

 it("passes the scoped textbook book as summary without unrelated lesson detail", async () => {
  const result = await ReadingComprehensionPage({
   searchParams: Promise.resolve({ lesson: "2" }),
  });
  const catalog = getTextbookCatalogForBookKeys(["doc-hieu"]);

  expect(result).toHaveProperty("props.books", catalog);
  expect(catalog.map((book) => book.key)).toEqual(["doc-hieu"]);
  expect(catalog.map((book) => book.lessons.length)).toEqual([18]);
  for (const book of catalog) {
   expect(Object.keys(book).toSorted()).toEqual(["id", "key", "label", "lessons"]);
   for (const lesson of book.lessons) {
    expect(Object.keys(lesson).toSorted()).toEqual([
     "bookKey",
     "id",
     "number",
     "title",
     "vocabCount",
    ]);
   }
  }
 });
});
