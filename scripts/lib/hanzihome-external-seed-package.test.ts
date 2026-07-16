import { describe, expect, it } from "vitest";

import { normalizeBoyaCatalogLabels } from "./hanzihome-external-seed-package";

describe("normalizeBoyaCatalogLabels", () => {
 it("uses the original Boya level semantics instead of ambiguous Vietnamese numbering", () => {
  const result = normalizeBoyaCatalogLabels({
   courses: [
    {
     id: "boya-preintermediate",
     source: "seed",
     slug: "boya-preintermediate",
     title: "Giáo trình Hán ngữ Boya Trung cấp 1",
     course_order: 20,
    },
    {
     id: "boya-intermediate",
     source: "seed",
     slug: "boya-intermediate",
     title: "Giáo trình Hán ngữ Boya Trung cấp 2",
     course_order: 30,
    },
   ],
   books: [
    {
     id: "boya-preintermediate-2",
     source: "seed",
     course_id: "boya-preintermediate",
     title: "Boya Trung cấp 1 · Tập 2",
     book_order: 2,
    },
    {
     id: "boya-intermediate-2",
     source: "seed",
     course_id: "boya-intermediate",
     title: "Boya Trung cấp 2 · Tập 2",
     book_order: 2,
    },
   ],
  });

  expect(result.courses.map((course) => course.title)).toEqual([
   "Boya · Cận trung cấp",
   "Boya · Trung cấp",
  ]);
  expect(result.books.map((book) => book.title)).toEqual([
   "Boya Cận trung cấp · Quyển 2",
   "Boya Trung cấp · Quyển 2",
  ]);
 });
});
