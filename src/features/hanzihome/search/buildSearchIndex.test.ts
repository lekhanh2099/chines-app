import { describe, expect, it } from "vitest";
import { HanyuLessonSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { buildHanziHomeLessonSearchItems } from "./buildSearchIndex";

describe("canonical search index nodes", () => {
 it.each([false, true])("indexes reading once when legacy blocks are mirrored: %s", (hasItems) => {
  const readingItems = [
   { id: "reading-one", type: "reading_text", order: 1, title: "希望", text: "希望工程" },
   { id: "reading-two", type: "reading_text", order: 2, title: "学校", text: "返回学校" },
  ];
  const sourceLesson = HanyuLessonSchema.parse({
   lesson: {
    id: "lesson-one",
    title: { zh: "希望工程" },
    sections: [
     {
      id: "reading-section",
      type: "reading",
      order: 1,
      title: "阅读",
      blocks: readingItems,
      ...(hasItems ? { items: readingItems } : {}),
     },
    ],
   },
  });
  const lessons: HanziHomeLesson[] = [
   {
    id: "lesson-one",
    titleZh: "希望工程",
    title: "Hy vọng",
    lessonNumber: 1,
    vocabIds: [],
    grammarPointIds: [],
    vocab: [],
    grammar: [],
    sourceLesson,
   },
  ];
  const index = buildHanziHomeLessonSearchItems(lessons);
  const nodes = index.filter((item) => item.kind === "lesson_text");
  expect(nodes.map((item) => item.id)).toEqual([
   "lesson-text:lesson-one:reading-one",
   "lesson-text:lesson-one:reading-two",
  ]);
  expect(nodes.map((item) => item.targetId)).toEqual(["reading-section", "reading-section"]);
  expect(nodes.map((item) => item.metadata?.contentNodeId)).toEqual(["reading-one", "reading-two"]);
  expect(nodes.map((item) => item.title)).toEqual(["希望", "学校"]);
  expect(new Set(index.map((item) => item.id)).size).toBe(index.length);
 });
});
