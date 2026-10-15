import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace", () => ({
 BusinessChineseStudyWorkspace: () => null,
}));

import {
 getTextbookCatalogForBookKeys,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

import SpokenChinesePage from "./page";

describe("SpokenChinesePage", () => {
 it("opens the first source lesson, Bài 1, by default", async () => {
  const result = await SpokenChinesePage({ searchParams: Promise.resolve({}) });
  const books = getTextbookCatalogForBookKeys(["khau-ngu"]);
  expect(result).toHaveProperty("props.lesson", getTextbookLesson("khau-ngu", 1));
  expect(result).toHaveProperty("props.books", books);
  expect(books.map((book) => book.key)).toEqual(["khau-ngu"]);
  expect(books[0]?.lessons.map((lesson) => lesson.number)).toEqual([
   1, 2, 3, 4, 5, 21, 6, 7, 8, 9, 10, 22, 11, 12, 13, 14, 15, 23, 16, 17, 18, 19, 20, 24,
  ]);
  for (const lesson of books[0]?.lessons ?? []) {
   expect(Object.keys(lesson).toSorted()).toEqual([
    "bookKey",
    "id",
    "number",
    "title",
    "vocabCount",
   ]);
  }
 });

 it.each(Array.from({ length: 24 }, (_, index) => index + 1))(
  "opens source lesson or review %i without renumbering the twenty core lessons",
  async (number) => {
   const result = await SpokenChinesePage({
    searchParams: Promise.resolve({ book: "tm3", lesson: String(number) }),
   });
   expect(result).toHaveProperty("props.lesson", getTextbookLesson("khau-ngu", number));
  },
 );

 it.each(["0", "25", "-1", "bad", "3x", "3.5", "", "Infinity"])(
  "returns to Bài 1 for missing or invalid source lesson %s",
  async (lesson) => {
   const result = await SpokenChinesePage({ searchParams: Promise.resolve({ lesson }) });
   expect(result).toHaveProperty("props.lesson", getTextbookLesson("khau-ngu", 1));
  },
 );

 it("rejects repeated lesson values", async () => {
  const result = await SpokenChinesePage({
   searchParams: Promise.resolve({ lesson: ["5", "9"] }),
  });
  expect(result).toHaveProperty("props.lesson", getTextbookLesson("khau-ngu", 1));
 });
});
