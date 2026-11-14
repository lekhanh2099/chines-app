import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace", () => ({
 BusinessChineseStudyWorkspace: () => null,
}));

import BusinessChinesePage from "./page";

describe("BusinessChinesePage", () => {
 it("defaults to Quyển 3, Bài 1 with Quyển 2 hidden from catalog", async () => {
  const result = await BusinessChinesePage({ searchParams: Promise.resolve({}) });

  expect(result).toMatchObject({
   props: {
    lesson: {
     id: "business-chinese-tm3-lesson-01",
     number: 1,
     sections: expect.arrayContaining([
      expect.objectContaining({ title: "📌 GIỚI THIỆU TỔNG QUAN" }),
     ]),
    },
    books: [expect.objectContaining({ key: "tm3" })],
   },
  });
  expect(result.props.books).not.toEqual(
   expect.arrayContaining([expect.objectContaining({ key: "tm2" })]),
  );
 });

 it("selects the requested lesson in Quyển 3", async () => {
  const result = await BusinessChinesePage({
   searchParams: Promise.resolve({ lesson: "10" }),
  });

  expect(result).toMatchObject({
   props: {
    lesson: { id: "business-chinese-tm3-lesson-10", number: 10 },
   },
  });
 });

 it("falls back to Quyển 3, Bài 1 for invalid query values or when tm2 is requested", async () => {
  const result = await BusinessChinesePage({
   searchParams: Promise.resolve({ book: "tm2", lesson: "1x" }),
  });

  expect(result).toMatchObject({
   props: {
    lesson: { id: "business-chinese-tm3-lesson-01", number: 1 },
   },
  });
 });
});
