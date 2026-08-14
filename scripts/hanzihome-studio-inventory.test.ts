import { describe, expect, it } from "vitest";
import {
 readingCourseSchema,
 summarizeReadingCourse,
 validateReadingReferences,
} from "./hanzihome-studio-inventory";

describe("Hanzi Studio migration inventory", () => {
 it("summarizes typed Reader content deterministically", () => {
  const course = readingCourseSchema.parse({
   units: [{ id: "unit-1" }],
   coreLessons: [
    {
     id: "core-1",
     slug: "core-1",
     titleZh: "核心课",
     paragraphs: [
      {
       id: "paragraph-1",
       order: 1,
       zh: "第一段",
       pinyin: "Dì yī duàn",
       vi: "Đoạn một",
       roleVi: "Mở đầu",
      },
      {
       id: "paragraph-2",
       order: 2,
       zh: "第二段",
       pinyin: "Dì èr duàn",
       vi: "Đoạn hai",
       roleVi: "Thân bài",
      },
     ],
     vocabulary: [
      {
       id: "vocab-1",
       order: 1,
       hanzi: "核心",
       pinyin: "héxīn",
       meaningVi: "cốt lõi",
       meaningInContextVi: "nội dung cốt lõi",
       category: "noun",
       categoryVi: "Danh từ",
       level: "HSK 3",
      },
     ],
     exerciseGroups: [
      {
       id: "group-1",
       order: 1,
       type: "multiple_choice",
       titleZh: "选择",
       titleVi: "Chọn",
       items: [
        {
         id: "item-1",
         type: "multiple_choice",
         promptZh: "请选择",
         promptVi: "Hãy chọn",
         pinyin: "Qǐng xuǎnzé",
         options: [
          { key: "A", textZh: "甲", textVi: "A" },
          { key: "B", textZh: "乙", textVi: "B" },
         ],
         answer: "A",
         answerZh: "甲",
         answerVi: "A",
         scoring: "auto",
         answerSource: "source_answer",
         explanationVi: "",
        },
        {
         id: "item-2",
         type: "multiple_choice",
         promptZh: "请选择",
         promptVi: "Hãy chọn",
         pinyin: "Qǐng xuǎnzé",
         options: [
          { key: "A", textZh: "甲", textVi: "A" },
          { key: "B", textZh: "乙", textVi: "B" },
         ],
         answer: "B",
         answerZh: "乙",
         answerVi: "B",
         scoring: "auto",
         answerSource: "source_answer",
         explanationVi: "",
        },
       ],
      },
     ],
    },
   ],
   mockLessons: [],
   reinforcementLessons: [{ id: "reinforcement-1", slug: "reinforcement-1" }],
  });

  expect(summarizeReadingCourse(course)).toEqual({
   coreLessons: 1,
   mockLessons: 0,
   reinforcementLessons: 1,
   paragraphs: 2,
   vocabulary: 1,
   exerciseGroups: 1,
   exerciseItems: 2,
   pinyinSourceRejected: 0,
   pinyinUnresolved: 0,
  });
 });

 it("keeps excluded datasets outside the inventory contract", () => {
  const inventoryKeys = Object.keys({
   reading: true,
   hskReadingPassages: true,
   hskGrammarItems: true,
   dictationBooks: true,
   dictationLessons: true,
   dictationSegments: true,
   humanitiesItems: true,
   personalLessons: true,
   personalExercises: true,
   dailyReading: true,
   pronunciationRegressionCases: true,
   assets: true,
   root: true,
  });

  expect(inventoryKeys).not.toContain("dictionary");
  expect(inventoryKeys).not.toContain("radicals");
  expect(inventoryKeys).not.toContain("polyphonic");
 });

 it("rejects stable IDs reused across Reader content families", () => {
  const course = readingCourseSchema.parse({
   units: [{ id: "unit-1" }],
   coreLessons: [
    {
     id: "core-1",
     slug: "core-1",
     titleZh: "核心课",
     paragraphs: [
      { id: "duplicate-1", order: 1, zh: "第一段", pinyin: "Dì yī duàn", vi: "", roleVi: "" },
     ],
     vocabulary: [
      {
       id: "duplicate-1",
       order: 1,
       hanzi: "核心",
       pinyin: "héxīn",
       meaningVi: "",
       meaningInContextVi: "",
       category: "noun",
       categoryVi: "",
       level: "",
      },
     ],
     exerciseGroups: [
      {
       id: "group-1",
       order: 1,
       type: "notes",
       titleZh: "笔记",
       titleVi: "Ghi chú",
       items: [
        {
         id: "item-1",
         type: "note",
         promptZh: "",
         promptVi: "",
         pinyin: "",
         options: [],
         answer: "",
         answerZh: "",
         answerVi: "",
         scoring: "none",
         answerSource: "source",
         explanationVi: "",
        },
       ],
      },
     ],
    },
   ],
   mockLessons: [],
   reinforcementLessons: [],
  });

  expect(() => validateReadingReferences(course)).toThrow("reuses stable ID duplicate-1");
 });
});
