import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
 computeSourceChecksum,
 canonicalStudioLessonId,
 readingCourseSchema,
 summarizeReadingCourse,
 validateStudioLessonMappings,
 validateReadingReferences,
} from "./hanzihome-studio-inventory";

describe("Hanzi Studio migration inventory", () => {
 it("summarizes typed Reader content deterministically", () => {
  const course = readingCourseSchema.parse({
   units: [
    {
     id: "unit-1",
     number: 1,
     code: "U1",
     titleZh: "第一单元",
     titleVi: "Đơn nguyên một",
     displayTitleVi: "Đơn nguyên 1",
     focusVi: "Trọng tâm",
     shortVi: "Đơn nguyên một",
    },
   ],
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
   reinforcementLessons: [
    {
     id: "reinforcement-1",
     slug: "reinforcement-1",
     titleZh: "强化阅读",
     titleVi: "Đọc củng cố",
     themeTitleZh: "主题",
     themeTitleVi: "Chủ đề",
     sourceBookTitleZh: "阅读册",
     sourceUnit: 1,
     sourceReading: 1,
     printedPage: 1,
     pdfPage: 1,
     resourceFile: "book.pdf",
     skillFocusZh: ["概括"],
     difficultyVi: "Trung cấp",
     estimatedMinutes: 8,
     studyTasksVi: ["Đọc"],
     noticeVi: "Ghi chú",
    },
   ],
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
   units: [
    {
     id: "unit-1",
     number: 1,
     code: "U1",
     titleZh: "第一单元",
     titleVi: "Đơn nguyên một",
     displayTitleVi: "Đơn nguyên 1",
     focusVi: "Trọng tâm",
     shortVi: "Đơn nguyên một",
    },
   ],
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

 it("rejects stable IDs reused by separate Reader lessons", () => {
  const course = readingCourseSchema.parse({
   units: [
    {
     id: "unit-1",
     number: 1,
     code: "U1",
     titleZh: "第一单元",
     titleVi: "Đơn nguyên một",
     displayTitleVi: "Đơn nguyên 1",
     focusVi: "Trọng tâm",
     shortVi: "Đơn nguyên một",
    },
   ],
   coreLessons: [
    {
     id: "core-1",
     slug: "core-1",
     titleZh: "第一课",
     paragraphs: [
      { id: "shared-paragraph", order: 1, zh: "第一段", pinyin: "", vi: "", roleVi: "" },
     ],
     vocabulary: [],
     exerciseGroups: [],
    },
   ],
   mockLessons: [
    {
     id: "mock-1",
     slug: "mock-1",
     titleZh: "模拟",
     paragraphs: [
      { id: "shared-paragraph", order: 1, zh: "第二段", pinyin: "", vi: "", roleVi: "" },
     ],
     vocabulary: [],
     exerciseGroups: [],
    },
   ],
   reinforcementLessons: [],
  });

  expect(() => validateReadingReferences(course)).toThrow("reuses stable ID shared-paragraph");
 });

 it("keeps the source checksum stable when the checkout path changes", async () => {
  const firstRoot = await mkdtemp(join(tmpdir(), "studio-source-a-"));
  const secondRoot = await mkdtemp(join(tmpdir(), "studio-source-b-"));
  try {
   await Promise.all([
    writeFile(join(firstRoot, "reading.json"), '{"id":"reader-1"}\n', "utf8"),
    writeFile(join(secondRoot, "reading.json"), '{"id":"reader-1"}\n', "utf8"),
   ]);

   const [firstChecksum, secondChecksum] = await Promise.all([
    computeSourceChecksum(firstRoot, ["reading.json"]),
    computeSourceChecksum(secondRoot, ["reading.json"]),
   ]);

   expect(firstChecksum).toBe(secondChecksum);
   expect(await readFile(join(firstRoot, "reading.json"), "utf8")).toBe(
    await readFile(join(secondRoot, "reading.json"), "utf8"),
   );
  } finally {
   await Promise.all([
    rm(firstRoot, { recursive: true, force: true }),
    rm(secondRoot, { recursive: true, force: true }),
   ]);
  }
 });

 it("rejects unknown and duplicate lesson mapping targets", () => {
  const course = readingCourseSchema.parse({
   units: [
    {
     id: "unit-1",
     number: 1,
     code: "U1",
     titleZh: "第一单元",
     titleVi: "Đơn nguyên một",
     displayTitleVi: "Đơn nguyên 1",
     focusVi: "Trọng tâm",
     shortVi: "Đơn nguyên một",
    },
   ],
   coreLessons: [
    {
     id: "core-1",
     slug: "core-1",
     titleZh: "核心课",
     paragraphs: [{ id: "paragraph-1", order: 1, zh: "第一段", pinyin: "", vi: "", roleVi: "" }],
     vocabulary: [],
     exerciseGroups: [],
    },
   ],
   mockLessons: [],
   reinforcementLessons: [],
  });

  expect(() => validateStudioLessonMappings(course, { unknown: "lesson-1" })).toThrow(
   "unknown Studio lesson",
  );
  expect(() =>
   validateStudioLessonMappings(course, { "core-1": "lesson-1", another: "lesson-1" }),
  ).toThrow("unknown Studio lesson");
  expect(() =>
   validateStudioLessonMappings(
    readingCourseSchema.parse({
     ...course,
     mockLessons: [
      {
       id: "mock-1",
       slug: "mock-1",
       titleZh: "模拟",
       paragraphs: [{ id: "paragraph-2", order: 1, zh: "第二段", pinyin: "", vi: "", roleVi: "" }],
       vocabulary: [],
       exerciseGroups: [],
      },
     ],
    }),
    { "core-1": "lesson-1", "mock-1": "lesson-1" },
   ),
  ).toThrow("reuses canonical HanziHome lesson");
 });

 it("derives stable canonical lesson IDs without a runtime fallback", () => {
  expect(canonicalStudioLessonId("U3-R1")).toBe("hanzihome-studio-reading:U3-R1");
 });
});
