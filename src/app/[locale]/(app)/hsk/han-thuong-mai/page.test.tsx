import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace", () => ({
 BusinessChineseStudyWorkspace: () => null,
}));

import BusinessChinesePage from "./page";

describe("BusinessChinesePage", () => {
 it("defaults to Quyển 2, Bài 1", async () => {
  const result = await BusinessChinesePage({ searchParams: Promise.resolve({}) });

  expect(result).toMatchObject({
   props: {
    lesson: {
     id: "business-chinese-tm2-lesson-01",
     number: 1,
     sections: expect.arrayContaining([
      expect.objectContaining({ title: "📌 GIỚI THIỆU TỔNG QUAN" }),
     ]),
    },
    books: expect.arrayContaining([expect.objectContaining({ key: "tm2" })]),
   },
  });
 });

 it("selects the requested book and lesson", async () => {
  const result = await BusinessChinesePage({
   searchParams: Promise.resolve({ book: "tm3", lesson: "10" }),
  });

  expect(result).toMatchObject({
   props: {
    lesson: { id: "business-chinese-tm3-lesson-10", number: 10 },
   },
  });
 });

 it("falls back to Quyển 2, Bài 1 for invalid query values", async () => {
  const result = await BusinessChinesePage({
   searchParams: Promise.resolve({ book: "other", lesson: "1x" }),
  });

  expect(result).toMatchObject({
   props: {
    lesson: { id: "business-chinese-tm2-lesson-01", number: 1 },
   },
  });
 });
});
