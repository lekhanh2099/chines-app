import type { JsonObject } from "@/types/json";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import { z } from "zod";

const LessonNoteHeadingTagSchema = z.enum(["h1", "h2", "h3"]);

function textNode(text: string, format = 0) {
 return {
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text,
  type: "text",
  version: 1,
 };
}

function paragraph(text: string) {
 return {
  children: [textNode(text)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "paragraph",
  version: 1,
  textFormat: 0,
  textStyle: "",
 };
}

function heading(text: string, tag: z.infer<typeof LessonNoteHeadingTagSchema> = "h2") {
 return {
  children: [textNode(text, 1)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "heading",
  tag,
  version: 1,
 };
}

export function createLessonReadingContent(lesson: HanziHomeLesson): JsonObject {
 const grammarLines = lesson.grammar.slice(0, 8).map((point, index) => {
  const structure = point.structuresView[0] ? ` — ${point.structuresView[0]}` : "";

  return `${index + 1}. ${point.cleanTitle}${structure}`;
 });
 const vocabLines = lesson.vocab.slice(0, 20).map((word, index) => {
  return `${index + 1}. ${word.hanzi} — ${word.pinyin} — ${getVocabDisplayMeaning(word)}`;
 });

 return {
  root: {
   children: [
    heading(`Bài ${lesson.lessonNumber}: ${lesson.titleZh}`, "h1"),
    paragraph(""),
    heading("Chốt mẫu cần nhớ"),
    ...(grammarLines.length > 0
     ? grammarLines.map(paragraph)
     : [paragraph("Chưa có ngữ pháp trong bài này.")]),
    paragraph(""),
    heading("Từ vựng trọng tâm"),
    ...(vocabLines.length > 0
     ? vocabLines.map(paragraph)
     : [paragraph("Chưa có từ vựng trong bài này.")]),
   ],
   direction: "ltr",
   format: "",
   indent: 0,
   type: "root",
   version: 1,
  },
 };
}

export function createPersonalNoteContent(lesson: HanziHomeLesson): JsonObject {
 return {
  root: {
   children: [
    heading(`Ghi chú: ${lesson.title}`),
    paragraph(""),
    paragraph("Những điểm dễ quên: "),
    paragraph(""),
    paragraph("Câu mẫu tự đặt: "),
    paragraph(""),
    paragraph("Lỗi sai của mình: "),
   ],
   direction: "ltr",
   format: "",
   indent: 0,
   type: "root",
   version: 1,
  },
 };
}
