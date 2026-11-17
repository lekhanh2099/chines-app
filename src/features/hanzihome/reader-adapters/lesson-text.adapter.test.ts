import { describe, expect, it } from "vitest";

import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
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
 it("preserves optional titles and meanings without inventing section headings", () => {
  const document = lessonTextToReaderDocument({
   documentId: "untitled:text",
   lessonId: "untitled",
   titleZh: "",
   sections: [
    {
     ...textSection,
     blocks: textSection.blocks.map((block) => ({ ...block, title: "", title_vi: "" })),
    },
   ],
  });
  expect(document.title).toBeUndefined();
  expect(document.sections.map((section) => section.title)).toEqual(["", ""]);
  expect(document.segments[0]?.vi).toBe("Hôm nay là Chủ nhật.");
  expect(document.segments[1]?.vi).toBe("Bạn khỏe không?");
 });

 it("normalizes textbook blocks into ordered continuous reader sections", () => {
  const document = lessonTextToReaderDocument({
   documentId: "lesson-1:text",
   lessonId: "lesson-1",
   titleZh: "第一课",
   sections: [textSection],
  });

  expect(document.sections.map((section) => section.id)).toEqual(["narrative", "dialogue"]);
  expect(document.segments.map((segment) => segment.id)).toEqual([
   "paragraph-1",
   "line-1",
   "line-2",
  ]);
  expect(document.segments[1]?.speaker?.label).toBe("A");
  expect(document.segments[1]?.role).toBe("Gặp nhau");
  expect(document.capabilities).toContain("pinyin");
  expect(document.capabilities).toContain("translation");
 });
});
