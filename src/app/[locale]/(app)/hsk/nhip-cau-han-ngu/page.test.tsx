import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace", () => ({
 BusinessChineseStudyWorkspace: () => null,
}));

import {
 getTextbookCatalog,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";

import ChineseBridgePage from "./page";

describe("ChineseBridgePage", () => {
 it("defaults to Nhịp cầu Hán ngữ, Bài 1 with the selected lesson detail", async () => {
  const result = await ChineseBridgePage({ searchParams: Promise.resolve({}) });
  const lesson = getTextbookLesson("nhip-cau", 1);

  expect(lesson?.sections.length).toBeGreaterThan(0);
  expect(result).toHaveProperty("props.lesson", lesson);
  expect(result).toMatchObject({
   key: lesson?.id,
   props: { lesson: { bookKey: "nhip-cau", number: 1 } },
  });
 });

 it("selects the final lesson without switching to another curriculum", async () => {
  const result = await ChineseBridgePage({
   searchParams: Promise.resolve({ book: "tm3", lesson: "15" }),
  });
  const lesson = getTextbookLesson("nhip-cau", 15);

  expect(lesson?.sections.length).toBeGreaterThan(0);
  expect(result).toHaveProperty("props.lesson", lesson);
  expect(result).toMatchObject({
   key: lesson?.id,
   props: { lesson: { bookKey: "nhip-cau", number: 15 } },
  });
 });

 it.each(["bad", "1x", "0", "-1", "16", "1.5", "", "Infinity"])(
  "falls back to Bài 1 for invalid lesson query %s",
  async (lesson) => {
   const result = await ChineseBridgePage({ searchParams: Promise.resolve({ lesson }) });

   expect(result).toHaveProperty("props.lesson", getTextbookLesson("nhip-cau", 1));
  },
 );

 it("falls back to Bài 1 for repeated lesson query values", async () => {
  const result = await ChineseBridgePage({
   searchParams: Promise.resolve({ lesson: ["2", "15"] }),
  });

  expect(result).toHaveProperty("props.lesson", getTextbookLesson("nhip-cau", 1));
 });

 it("passes all four books as summaries without unrelated lesson detail", async () => {
  const result = await ChineseBridgePage({ searchParams: Promise.resolve({ lesson: "2" }) });
  const catalog = getTextbookCatalog();

  expect(result).toHaveProperty("props.books", catalog);
  expect(catalog.map((book) => book.key)).toEqual(["tm2", "tm3", "nhip-cau", "doc-hieu"]);
  expect(catalog.map((book) => book.lessons.length)).toEqual([10, 10, 15, 18]);
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
