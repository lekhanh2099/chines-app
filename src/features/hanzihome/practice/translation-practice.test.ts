import { describe, expect, it } from "vitest";

import { HanyuLessonSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";

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
} from "./translation-practice";

const segment = translationSegmentSchema.parse({
 id: "segment-1",
 order: 2,
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

 it("builds stable segments from reading paragraphs and root passages", () => {
  const sourceLesson = HanyuLessonSchema.parse({
   lesson: {
    id: "lesson-1",
    title: { zh: "测试" },
    sections: [
     {
      id: "reading-1",
      type: "reading",
      order: 1,
      title: "阅读",
      items: [
       {
        id: "reading-text-1",
        type: "reading_text",
        order: 1,
        title: "段落",
        paragraphs: [
         { id: "p-2", order: 2, zh: "第二句", pinyin: "dì èr jù", vi: "Câu hai" },
         { id: "p-1", order: 1, zh: "第一句", pinyin: "dì yī jù", vi: "Câu một" },
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
    ],
   },
  });

  expect(translationSegmentsFromLesson(sourceLesson)).toEqual([
   { id: "reading-text-1:p-1", order: 1, zh: "第一句", pinyin: "dì yī jù", vi: "Câu một" },
   { id: "reading-text-1:p-2", order: 2, zh: "第二句", pinyin: "dì èr jù", vi: "Câu hai" },
   { id: "reading-text-2", order: 3, zh: "你好", pinyin: "nǐ hǎo", vi: "Xin chào" },
  ]);
 });
});
