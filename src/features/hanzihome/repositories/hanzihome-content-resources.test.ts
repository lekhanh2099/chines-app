import { describe, expect, it } from "vitest";

import {
 attachLessonVocabularyResource,
 buildLessonSectionResources,
} from "./hanzihome-content-resources";
import { hanziHomeVocabItemSchema, lessonSchema } from "../hanzihome-api.schemas";

describe("attachLessonVocabularyResource", () => {
 it("routes non-reading source sections to their matching modules", () => {
  const lesson = lessonSchema.parse({
   id: "lesson-7",
   courseId: "hanyu-q3",
   bookId: "hanyu-q3-shang",
   lessonNumber: 7,
   titleZh: "成语故事",
   title: "Câu chuyện thành ngữ",
   vocabIds: [],
   grammarPointIds: [],
   vocab: [],
   grammar: [],
   sourceLesson: {
    lesson: {
     id: "lesson-7",
     title: { zh: "成语故事" },
     sections: [
      { id: "text", type: "text", order: 1, title: "课文", blocks: [] },
      { id: "names", type: "proper_nouns", order: 2, title: "专名", items: [] },
      { id: "notes", type: "notes", order: 3, title: "注释", items: [] },
      { id: "summary", type: "summary", order: 4, title: "总结", items: [] },
      { id: "reading", type: "reading", order: 5, title: "阅读", items: [] },
     ],
    },
   },
  });

  expect(
   buildLessonSectionResources(lesson).map((section) => ({
    id: section.id,
    module: new URL(section.href, "https://app.example").searchParams.get("module"),
   })),
  ).toEqual([
   { id: "text", module: "lessonText" },
   { id: "names", module: "vocab" },
   { id: "notes", module: "notes" },
   { id: "summary", module: "overview" },
   { id: "reading", module: "practice" },
  ]);
 });

 it("hydrates lesson vocab and the vocabulary mini-grid from one resource", () => {
  const lesson = lessonSchema.parse({
   id: "lesson-1",
   lessonNumber: 1,
   titleZh: "第一课",
   title: "Bài 1",
   vocabIds: [],
   grammarPointIds: [],
   vocab: [],
   grammar: [],
   sourceLesson: {
    lesson: {
     id: "lesson-1",
     title: { zh: "第一课" },
     sections: [
      {
       id: "vocabulary",
       type: "vocabulary",
       order: 1,
       title: "生词",
       items: [],
      },
     ],
    },
   },
  });
  const item = hanziHomeVocabItemSchema.parse({
   id: "word-1",
   order: 1,
   hanzi: "学习",
   pinyin: "xuéxí",
   pos: { normalized: "verb" },
   meaning: { hanviet: "HỌC TẬP", meaning_vi: "học tập", meaning_en: "study" },
   examples: [],
   runtimeId: "lesson-1__word-1",
   lessonId: "lesson-1",
   category: "Động từ",
  });

  const hydrated = attachLessonVocabularyResource(lesson, {
   lessonId: "lesson-1",
   items: [item],
   total: 1,
  });

  expect(hydrated.vocab).toEqual([item]);
  expect(hydrated.vocabIds).toEqual(["lesson-1__word-1"]);
  expect(hydrated.sourceLesson?.lesson.sections[0]).toEqual(
   expect.objectContaining({
    type: "vocabulary",
    items: [
     expect.objectContaining({
      id: "word-1",
      hanzi: "学习",
      pinyin: "xuéxí",
      hanviet: "HỌC TẬP",
      meaning_vi: "học tập",
      meaning_en: "study",
      pos: "verb",
     }),
    ],
   }),
  );
 });
});
