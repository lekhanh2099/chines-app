import type { JsonFieldValue, JsonValue } from "@/types/json";
import type { JsonObject } from "@/types/json";
import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

import type { BookSection } from "./types";

export function asRecord(value: JsonFieldValue): JsonObject {
 return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

export function stringValue(record: JsonObject, key: string) {
 const value = record[key];
 return typeof value === "string" ? value.trim() : "";
}

export function arrayValue(record: JsonObject, key: string) {
 const value = record[key];
 return Array.isArray(value) ? value : [];
}

export function nonEmptyStrings(value: JsonValue[]) {
 return value.filter(
  (entry): entry is string => typeof entry === "string" && Boolean(entry.trim()),
 );
}

function hasTextLikeValue(value: JsonFieldValue): boolean {
 if (typeof value === "string") return Boolean(value.trim());
 if (typeof value === "number" || typeof value === "boolean") return true;
 if (Array.isArray(value)) return value.some(hasTextLikeValue);

 const record = asRecord(value);
 return Object.values(record).some(hasTextLikeValue);
}

export function answerToString(value: JsonFieldValue): string {
 if (typeof value === "string") return value.trim();
 if (typeof value === "number" || typeof value === "boolean") {
  return String(value);
 }
 if (Array.isArray(value)) return nonEmptyStrings(value).join(" / ");
 return "";
}

export function hasClozeAnswerValue(value: JsonFieldValue): boolean {
 if (typeof value === "string" || typeof value === "number") {
  return Boolean(String(value).trim());
 }

 const record = asRecord(value);
 return Boolean(
  stringValue(record, "answer") ||
  stringValue(record, "answer_zh") ||
  stringValue(record, "value") ||
  stringValue(record, "text") ||
  stringValue(record, "zh") ||
  stringValue(record, "sample_answer") ||
  arrayValue(record, "acceptable_answers").some(hasTextLikeValue),
 );
}

function firstRenderableArray(...arrays: JsonValue[][]): JsonValue[] {
 return arrays.find((values) => values.some(hasTextLikeValue)) ?? [];
}

function mergedRenderableArrays(record: JsonObject, keys: string[]): JsonValue[] {
 return keys.flatMap((key) => arrayValue(record, key)).filter(hasTextLikeValue);
}

const supplementaryVocabKeys = [
 "supplementary_vocabulary",
 "supplementary_words",
 "supplementary_vocab",
 "supplement_vocab",
 "supplemental_vocab",
];

export function getPassageLikeValue(
 record: JsonObject,
 options: { includeText?: boolean } = {},
): JsonFieldValue {
 const directPassageRecord = asRecord(record.passage);
 const directPassageText = answerToString(record.passage);
 const directPassageHasPayload =
  Boolean(directPassageText) || Object.values(directPassageRecord).some(hasTextLikeValue);

 const supplementaryVocabulary = [
  ...mergedRenderableArrays(directPassageRecord, supplementaryVocabKeys),
  ...mergedRenderableArrays(record, supplementaryVocabKeys),
 ];

 if (directPassageHasPayload) {
  return {
   ...directPassageRecord,
   id: stringValue(directPassageRecord, "id") || stringValue(record, "id"),
   title:
    stringValue(directPassageRecord, "title") ||
    stringValue(record, "title") ||
    stringValue(record, "title_vi"),
   title_vi: stringValue(directPassageRecord, "title_vi") || stringValue(record, "title_vi"),
   instruction: directPassageRecord.instruction ?? record.instruction,
   text_with_blanks:
    stringValue(directPassageRecord, "text_with_blanks") ||
    stringValue(directPassageRecord, "passage_with_blanks") ||
    stringValue(directPassageRecord, "passage_blanked") ||
    stringValue(directPassageRecord, "cloze_text") ||
    stringValue(directPassageRecord, "text") ||
    stringValue(directPassageRecord, "zh") ||
    directPassageText,
   completed_text:
    stringValue(directPassageRecord, "completed_text") ||
    stringValue(directPassageRecord, "completed_text_zh") ||
    stringValue(directPassageRecord, "completed_passage") ||
    stringValue(directPassageRecord, "passage_complete") ||
    stringValue(record, "completed_text") ||
    stringValue(record, "completed_text_zh") ||
    stringValue(record, "completed_passage") ||
    stringValue(record, "passage_complete"),
   pinyin: stringValue(directPassageRecord, "pinyin") || stringValue(record, "pinyin"),
   vi:
    stringValue(directPassageRecord, "translation_vi") ||
    stringValue(directPassageRecord, "vi") ||
    stringValue(record, "translation_vi") ||
    stringValue(record, "vi"),
   paragraphs: firstRenderableArray(
    arrayValue(directPassageRecord, "paragraphs"),
    arrayValue(record, "paragraphs"),
   ),
   segments: firstRenderableArray(
    arrayValue(directPassageRecord, "segments"),
    arrayValue(record, "segments"),
   ),
   supplementary_vocabulary: supplementaryVocabulary,
   word_bank: firstRenderableArray(
    arrayValue(directPassageRecord, "word_bank"),
    arrayValue(record, "word_bank"),
   ),
   blanks: firstRenderableArray(
    arrayValue(directPassageRecord, "blanks"),
    arrayValue(record, "blanks"),
   ),
   answers: firstRenderableArray(
    arrayValue(directPassageRecord, "answers"),
    arrayValue(record, "answers"),
   ),
   answer_key: firstRenderableArray(
    arrayValue(directPassageRecord, "answer_key"),
    arrayValue(record, "answer_key"),
   ),
   cloze_answers: firstRenderableArray(
    arrayValue(directPassageRecord, "cloze_answers"),
    arrayValue(record, "cloze_answers"),
   ),
   rendering: directPassageRecord.rendering ?? record.rendering,
  };
 }

 const textWithBlanks =
  stringValue(record, "text_with_blanks") ||
  stringValue(record, "passage_with_blanks") ||
  stringValue(record, "passage_blanked") ||
  stringValue(record, "cloze_text");

 const clozePart = arrayValue(record, "parts")
  .map(asRecord)
  .find((part) => stringValue(part, "type") === "cloze_text");

 const clozePartText = clozePart
  ? arrayValue(clozePart, "items")
     .map((item) => {
      const itemRecord = asRecord(item);
      return (
       stringValue(itemRecord, "text") || stringValue(itemRecord, "zh") || answerToString(item)
      );
     })
     .filter(Boolean)
     .join("\n")
  : "";

 const text =
  textWithBlanks ||
  clozePartText ||
  stringValue(record, "passage_text") ||
  (options.includeText ? stringValue(record, "text") : "");

 const completedText =
  stringValue(record, "completed_text") ||
  stringValue(record, "completed_text_zh") ||
  stringValue(record, "completed_passage") ||
  stringValue(record, "passage_complete");

 const passage = {
  id: stringValue(record, "id"),
  title: stringValue(record, "title_vi") || stringValue(record, "title"),
  title_vi: stringValue(record, "title_vi"),
  instruction: record.instruction,
  text_with_blanks: text,
  completed_text: completedText,
  pinyin: stringValue(record, "pinyin"),
  vi: stringValue(record, "translation_vi") || stringValue(record, "vi"),
  paragraphs: arrayValue(record, "paragraphs"),
  segments: arrayValue(record, "segments"),
  supplementary_vocabulary: supplementaryVocabulary,
  word_bank: arrayValue(record, "word_bank"),
  blanks: arrayValue(record, "blanks"),
  answers: arrayValue(record, "answers"),
  answer_key: arrayValue(record, "answer_key"),
  cloze_answers: arrayValue(record, "cloze_answers"),
  rendering: record.rendering,
 };

 return Object.values(passage).some(hasTextLikeValue) ? passage : undefined;
}

export function getClozeAnswerValues(record: JsonObject) {
 const keys = [
  "blanks",
  "answers",
  "answer_key",
  "cloze_answers",
  "suggested_answers",
  "questions",
 ];

 for (const key of keys) {
  const values = arrayValue(record, key);
  if (values.some(hasClozeAnswerValue)) return values;
 }

 return [];
}

export function sectionTitle(section: Section) {
 return section.title_vi || section.title;
}

export function sectionSubtitle(section: Section) {
 if (section.type === "text") return `${section.blocks.length} phần bài khóa`;
 if (section.type === "vocabulary") {
  return `${section.items.length} từ trong sách`;
 }
 if (section.type === "proper_nouns") {
  return `${section.items.length} tên riêng`;
 }
 if (section.type === "notes") return `${section.items.length} chú thích`;
 if (section.type === "grammar") return `${section.items.length} điểm ngữ pháp`;
 if (section.type === "exercises") {
  return `${section.items.length} nhóm bài tập`;
 }
 if (section.type === "communication") {
  return `${section.items.length} hội thoại`;
 }
 if (section.type === "reading") return `${section.items.length} bài đọc`;
 if (section.type === "character_writing") {
  return `${section.items.length} chữ luyện viết`;
 }

 if (section.type === "summary") {
  const sectionRecord = asRecord(section);
  const summaryRecord = asRecord(sectionRecord.summary);
  const contentRecord = asRecord(sectionRecord.content);

  const itemCount =
   section.items.length +
   section.blocks.length +
   arrayValue(sectionRecord, "lesson_parts").length +
   arrayValue(summaryRecord, "lesson_parts").length +
   arrayValue(contentRecord, "lesson_parts").length +
   arrayValue(sectionRecord, "key_sentences").length +
   arrayValue(summaryRecord, "key_sentences").length +
   arrayValue(contentRecord, "key_sentences").length +
   arrayValue(sectionRecord, "main_patterns").length +
   arrayValue(summaryRecord, "main_patterns").length +
   arrayValue(contentRecord, "main_patterns").length +
   arrayValue(sectionRecord, "exercise_types").length +
   arrayValue(summaryRecord, "exercise_types").length +
   arrayValue(contentRecord, "exercise_types").length;

  return itemCount > 0 ? `${itemCount} mục tổng kết` : "Tổng kết bài";
 }

 return undefined;
}

export function getBookSections(sourceLesson: HanziHomeLesson["sourceLesson"]): BookSection[] {
 return (sourceLesson?.lesson.sections ?? [])
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((section) => ({
   id: section.id,
   title: sectionTitle(section),
   subtitle: sectionSubtitle(section),
   type: section.type,
   order: section.order,
   section,
  }));
}

export function sectionEmptyReason(section: Section): string {
 return stringValue(asRecord(section), "empty_reason_vi");
}
