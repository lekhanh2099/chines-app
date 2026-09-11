import { describe, expect, it } from "vitest";

import { HanyuLessonSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";

import { getTextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

import {
 clampTranslationIndex,
 createTranslationAttempt,
 emptyTranslationPracticeState,
 orderedTranslationSegments,
 scoreTranslationAttempt,
 translationAttemptKey,
 translationPracticeStateSchema,
 translationReferenceText,
 translationSourceText,
 translationSegmentSchema,
 translationSegmentsFromLesson,
 translationSegmentsFromTextbook,
 dictationSourcesFromLesson,
} from "./translation-practice";

const segment = translationSegmentSchema.parse({
 id: "segment-1",
 order: 2,
 sourceLabel: "Bài khóa",
 zh: "你好，朋友。",
 pinyin: "Nǐ hǎo, péngyou.",
 vi: "Xin chào, bạn.",
});

describe("HanziHome translation practice", () => {
 it("keeps direction-specific source and reference ownership", () => {
  expect(translationSourceText(segment, "zh-vi")).toBe(segment.zh);
  expect(translationReferenceText(segment, "zh-vi")).toBe(segment.vi);
  expect(translationSourceText(segment, "vi-zh")).toBe(segment.vi);
  expect(translationReferenceText(segment, "vi-zh")).toBe(segment.zh);
 });

 it("scores both directions deterministically and records a typed attempt", () => {
  expect(scoreTranslationAttempt(segment, "zh-vi", "xin chào bạn")).toBe(100);
  expect(scoreTranslationAttempt(segment, "vi-zh", "你好朋友")).toBe(100);
  expect(createTranslationAttempt(segment, "vi-zh", "你好朋友", 1_250)).toEqual({
   segmentId: "segment-1",
   direction: "vi-zh",
   answer: "你好朋友",
   score: 100,
   responseMs: 1_250,
  });
 });

 it("uses stable segment-direction keys and bounded navigation", () => {
  expect(translationAttemptKey("segment-1", "zh-vi")).toBe("segment-1:zh-vi");
  expect(clampTranslationIndex(-1, 3)).toBe(0);
  expect(clampTranslationIndex(8, 3)).toBe(2);
  expect(clampTranslationIndex(8, 0)).toBe(0);
 });

 it("orders source segments without mutating the query result", () => {
  const ordered = orderedTranslationSegments([segment, { ...segment, id: "segment-0", order: 1 }]);
  expect(ordered.map((item) => item.id)).toEqual(["segment-0", "segment-1"]);
  expect(segment.order).toBe(2);
 });

 it("provides a strict initial state for the HanziHome owner", () => {
  expect(translationPracticeStateSchema.parse(emptyTranslationPracticeState)).toEqual(
   emptyTranslationPracticeState,
  );
 });

 it("builds stable segments from lesson text, supplementary reading, and resolved exercises", () => {
  const sourceLesson = HanyuLessonSchema.parse({
   lesson: {
    id: "lesson-1",
    title: { zh: "测试" },
    sections: [
     {
      id: "text-1",
      type: "text",
      order: 1,
      title: "Bài khóa",
      blocks: [
       {
        id: "text-block-1",
        type: "text_narrative",
        order: 1,
        title: "Đoạn văn",
        paragraphs: [
         {
          id: "text-p-2",
          order: 2,
          zh: "Bài khóa hai",
          pinyin: "bài khóa èr",
          vi: "Bài khóa hai",
         },
         {
          id: "text-p-1",
          order: 1,
          zh: "Bài khóa một",
          pinyin: "bài khóa yī",
          vi: "Bài khóa một",
         },
        ],
       },
      ],
     },
     {
      id: "reading-1",
      type: "reading",
      order: 2,
      title: "阅读",
      items: [
       {
        id: "reading-text-1",
        type: "reading_text",
        order: 1,
        title: "段落",
        paragraphs: [
         {
          id: "p-2",
          order: 2,
          zh: "第二句",
          pinyin: "dì èr jù",
          vi: "Câu hai",
         },
         {
          id: "p-1",
          order: 1,
          zh: "第一句",
          pinyin: "dì yī jù",
          vi: "Câu một",
         },
        ],
       },
       {
        id: "reading-text-2",
        type: "reading_text",
        order: 2,
        title: "Đoạn đơn",
        text: "你好",
        pinyin: "nǐ hǎo",
        vi: "Xin chào",
       },
      ],
     },
     {
      id: "exercise-1",
      type: "exercises",
      order: 3,
      title: "Bài tập",
      items: [
       {
        id: "exercise-item-1",
        type: "fill_blank",
        order: 1,
        title: "Điền từ",
        instruction: {
         zh: "用合适的词填空。",
         vi: "Điền từ thích hợp.",
        },
        questions: [
         {
          id: "exercise-question-1",
          prompt: "他是___。",
          answer: "学生",
         },
        ],
       },
       {
        id: "exercise-item-2",
        type: "multiple_choice",
        order: 2,
        title: "Chọn đáp án",
        questions: [
         {
          id: "exercise-question-2",
          prompt: "请选择。",
          choices: [
           { id: "A", text: "正确答案" },
           { id: "B", text: "错误答案" },
          ],
          answer: "A",
         },
        ],
       },
      ],
     },
    ],
   },
  });

  expect(translationSegmentsFromLesson(sourceLesson)).toEqual([
   {
    id: "text-1:text-block-1:text-p-1",
    order: 1,
    sourceLabel: "Bài khóa",
    zh: "Bài khóa một",
    pinyin: "bài khóa yī",
    vi: "Bài khóa một",
   },
   {
    id: "text-1:text-block-1:text-p-2",
    order: 2,
    sourceLabel: "Bài khóa",
    zh: "Bài khóa hai",
    pinyin: "bài khóa èr",
    vi: "Bài khóa hai",
   },
   {
    id: "reading-1:reading-text-1:p-1",
    order: 3,
    sourceLabel: "Bài đọc thêm · 段落",
    zh: "第一句",
    pinyin: "dì yī jù",
    vi: "Câu một",
   },
   {
    id: "reading-1:reading-text-1:p-2",
    order: 4,
    sourceLabel: "Bài đọc thêm · 段落",
    zh: "第二句",
    pinyin: "dì èr jù",
    vi: "Câu hai",
   },
   {
    id: "reading-1:reading-text-2",
    order: 5,
    sourceLabel: "Bài đọc thêm · Đoạn đơn",
    zh: "你好",
    pinyin: "nǐ hǎo",
    vi: "Xin chào",
   },
  ]);
  expect(dictationSourcesFromLesson(sourceLesson)).toEqual([
   {
    id: "text-1",
    label: "Bài khóa",
    entries: [
     {
      id: "text-1:text-block-1:text-p-1",
      zh: "Bài khóa một",
      pinyin: "bài khóa yī",
      vi: "Bài khóa một",
     },
     {
      id: "text-1:text-block-1:text-p-2",
      zh: "Bài khóa hai",
      pinyin: "bài khóa èr",
      vi: "Bài khóa hai",
     },
    ],
   },
   {
    id: "reading-1:reading-text-1",
    label: "Bài đọc thêm · 段落",
    entries: [
     {
      id: "reading-1:reading-text-1:p-1",
      zh: "第一句",
      pinyin: "dì yī jù",
      vi: "Câu một",
     },
     {
      id: "reading-1:reading-text-1:p-2",
      zh: "第二句",
      pinyin: "dì èr jù",
      vi: "Câu hai",
     },
    ],
   },
   {
    id: "reading-1:reading-text-2",
    label: "Bài đọc thêm · Đoạn đơn",
    entries: [
     {
      id: "reading-1:reading-text-2",
      zh: "你好",
      pinyin: "nǐ hǎo",
      vi: "Xin chào",
     },
    ],
   },
   {
    id: "exercise-1:exercise-item-1",
    label: "Bài tập 1 · Điền từ",
    entries: [
     {
      id: "exercise-1:exercise-item-1:exercise-question-1",
      zh: "他是学生。",
      pinyin: "",
      vi: "",
     },
    ],
   },
   {
    id: "exercise-1:exercise-item-2",
    label: "Bài tập 2 · Chọn đáp án",
    entries: [
     {
      id: "exercise-1:exercise-item-2:exercise-question-2",
      zh: "正确答案",
      pinyin: "",
      vi: "",
     },
    ],
   },
  ]);
 });

 it("extracts bilingual translation segments from textbook lessons", () => {
  const tm2Lesson = getTextbookLesson("tm2", 1);
  const tm2Segments = translationSegmentsFromTextbook(tm2Lesson);
  expect(tm2Segments).toHaveLength(14);
  expect(tm2Segments[0]).toEqual({
   id: "business-chinese-tm2-lesson-01-section-03-block-001",
   order: 1,
   sourceLabel: "BÀI KHÓA CHÍNH (主课文)",
   zh: "订购真丝面料",
   pinyin: "",
   vi: "Đặt mua vải lụa tơ tằm",
  });

  const nhipCauLesson = getTextbookLesson("nhip-cau", 1);
  const nhipCauSegments = translationSegmentsFromTextbook(nhipCauLesson);
  expect(nhipCauSegments).toHaveLength(38);
  expect(nhipCauSegments[0]?.zh).toContain("1989年10月30日");
  expect(nhipCauSegments[0]?.vi).toContain("Ngày 30 tháng 10 năm 1989");

  const docHieuLesson = getTextbookLesson("doc-hieu", 1);
  const docHieuSegments = translationSegmentsFromTextbook(docHieuLesson);
  expect(docHieuSegments).toHaveLength(28);
  expect(docHieuSegments[0]?.sourceLabel).toBe("BÀI 1: 天气预报 (Dự báo thời tiết)");

  const tm3Lesson = getTextbookLesson("tm3", 1);
  expect(translationSegmentsFromTextbook(tm3Lesson)).toEqual([]);
  expect(translationSegmentsFromTextbook(undefined)).toEqual([]);
 });
});
