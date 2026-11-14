import { describe, expect, it } from "vitest";

import { hanziHomeVocabItemSchema } from "@/features/hanzihome/hanzihome-api.schemas";

import { collectVocabChildren, sectionKeysForFilter } from "./vocab-bulk-edit-utils";

const deepWord = hanziHomeVocabItemSchema.parse({
 id: "word-1",
 order: 1,
 hanzi: "学习",
 pinyin: "xuéxí",
 pos: { raw_vi: "động từ", raw_cn: "动", normalized: "verb" },
 meaning: { hanviet: "HỌC TẬP", meaning_vi: "học tập", meaning_en: "study" },
 examples: [{ id: "example-1", order: 1, zh: "我在学习中文。" }],
 runtimeId: "lesson-1__word-1",
 lessonId: "lesson-1",
 category: "Động từ",
 detailSections: [{ id: "section-1", key: "meaning", title: "Nghĩa", lines: ["học"], order: 1 }],
});

describe("vocab bulk edit utils", () => {
 it("maps the section filter to server section keys only on the sections tab", () => {
  expect(sectionKeysForFilter("examples", "meaning")).toBeUndefined();
  expect(sectionKeysForFilter("sections", "all")).toBeUndefined();
  expect(sectionKeysForFilter("sections", "custom")).toEqual(["custom:"]);
  expect(sectionKeysForFilter("sections", "meaning")).toEqual(["meaning"]);
 });

 it("indexes deep vocab sections and examples by child id", () => {
  const { deepItems, localChildren } = collectVocabChildren([deepWord]);
  expect(deepItems).toEqual([deepWord]);
  expect(localChildren.get("section-1")).toMatchObject({
   item: deepWord,
   itemIndex: 0,
   sectionIndex: 0,
  });
  expect(localChildren.get("example-1")).toMatchObject({
   item: deepWord,
   itemIndex: 0,
   exampleIndex: 0,
  });
  expect(localChildren.size).toBe(2);
 });
});
