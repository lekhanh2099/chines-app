import { describe, expect, it } from "vitest";

import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { readerHasCapability } from "../model/reader-capabilities";
import { lessonTextToReaderDocument } from "./lesson-text.adapter";

type TextSection = Extract<Section, { type: "text" }>;

const textSection: TextSection = {
 id: "section-text",
 type: "text",
 order: 1,
 title: "课文",
 title_vi: "Bài khóa",
 blocks: [
  {
   id: "dialogue",
   type: "text_dialogue",
   order: 2,
   title: "对话",
   title_vi: "Hội thoại",
   scenes: [
    {
     id: "scene-1",
     order: 1,
     summary_vi: "Gặp nhau",
     lines: [
      {
       id: "line-2",
       order: 2,
       speaker: "B",
       zh: "我很好。",
       pinyin: "wǒ hěn hǎo",
       vi: "Tôi khỏe.",
       audio_key: "",
       vocab_refs: [],
       grammar_refs: [],
       notes: [],
      },
      {
       id: "line-1",
       order: 1,
       speaker: "A",
       zh: "你好吗？",
       pinyin: "nǐ hǎo ma",
       vi: "Bạn khỏe không?",
       audio_key: "",
       vocab_refs: [],
       grammar_refs: [],
       notes: [],
      },
     ],
    },
   ],
   lines: [],
   comprehension_questions: [],
  },
  {
   id: "narrative",
   type: "text_narrative",
   order: 1,
   title: "短文",
   title_vi: "Đoạn văn",
   paragraphs: [
    {
     id: "paragraph-1",
     order: 1,
     zh: "今天是星期天。",
     pinyin: "jīntiān shì xīngqītiān",
     vi: "Hôm nay là Chủ nhật.",
     audio_key: "",
     vocab_refs: [],
     grammar_refs: [],
    },
   ],
   lines: [],
   comprehension_questions: [],
  },
 ],
};

describe("lesson text reader adapter", () => {
 it("normalizes textbook blocks into ordered continuous reader sections", () => {
  const result = lessonTextToReaderDocument({
   documentId: "lesson-1:text",
   lessonId: "lesson-1",
   titleZh: "第一课",
   sections: [textSection],
   sectionPathFor: () => ["lesson", "sections", 0],
  });

  expect(result.document.sections.map((section) => section.id)).toEqual(["narrative", "dialogue"]);
  expect(result.document.segments.map((segment) => segment.id)).toEqual([
   "paragraph-1",
   "line-1",
   "line-2",
  ]);
  expect(result.document.segments[1]?.speaker?.label).toBe("A");
  expect(result.document.segments[1]?.role).toBe("Gặp nhau");
  expect(readerHasCapability(result.document, "pinyin")).toBe(true);
  expect(readerHasCapability(result.document, "translation")).toBe(true);
 });

 it("keeps lesson edit paths outside the universal document model", () => {
  const result = lessonTextToReaderDocument({
   documentId: "lesson-1:text",
   lessonId: "lesson-1",
   titleZh: "第一课",
   sections: [textSection],
   sectionPathFor: () => ["lesson", "sections", 4],
  });

  expect(result.segmentBindings.get("line-1")?.path).toEqual([
   "lesson",
   "sections",
   4,
   "blocks",
   0,
   "scenes",
   0,
   "lines",
   1,
  ]);
  expect(result.document.segments[1]).not.toHaveProperty("path");
  expect(result.document.segments[1]).not.toHaveProperty("lessonId");
 });
});
