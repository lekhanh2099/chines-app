import type { Exercise } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import {
 answerToString,
 arrayValue,
 asRecord,
 hasClozeAnswerValue,
 nonEmptyStrings,
 stringValue,
} from "../utils";

export function promptToString(value: unknown): string {
 if (typeof value === "string") return value.trim();
 if (Array.isArray(value)) return nonEmptyStrings(value).join(" / ");

 const record = asRecord(value);

 return (
  stringValue(record, "zh") ||
  stringValue(record, "vi") ||
  stringValue(record, "text") ||
  stringValue(record, "prompt") ||
  stringValue(record, "question")
 );
}

export function objectText(value: unknown, keys: string[]) {
 const record = asRecord(value);

 for (const key of keys) {
  const text = stringValue(record, key);
  if (text) return text;
 }

 return "";
}

export function formatAnswer(value: unknown): string {
 if (typeof value === "boolean") return value ? "Đúng" : "Sai";
 return answerToString(value);
}

export function firstArraySource(
 record: Record<string, unknown>,
 keys: string[],
 predicate: (value: unknown) => boolean = () => true,
) {
 for (const key of keys) {
  const values = arrayValue(record, key);
  if (values.some(predicate)) return { key, values };
 }

 return null;
}

export const CLOZE_MARKER_PATTERN =
 /(?:[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]|\d+|[（(]\s*\d+\s*[）)]|\[\s*\d+\s*\])\s*(?:[_＿]{2,}|…{2,}|\.\.\.+)/g;

export function passageTextForDiagnostics(passage: unknown) {
 if (typeof passage === "string") return passage.trim();

 const record = asRecord(passage);
 const directText =
  stringValue(record, "text_with_blanks") ||
  stringValue(record, "passage_with_blanks") ||
  stringValue(record, "passage_blanked") ||
  stringValue(record, "cloze_text") ||
  stringValue(record, "passage_text") ||
  stringValue(record, "text") ||
  stringValue(record, "zh");

 if (directText) return directText;

 return arrayValue(record, "paragraphs")
  .map((paragraph) => stringValue(asRecord(paragraph), "zh"))
  .filter(Boolean)
  .join("\n");
}

export function firstTextByKeys(record: Record<string, unknown>, keys: string[]) {
 for (const key of keys) {
  const text = stringValue(record, key);
  if (text) return text;
 }

 return "";
}

export function hasExercisePassagePayload(record: Record<string, unknown>) {
 const directPassage = record.passage;
 const hasDirectPassage =
  Boolean(answerToString(directPassage)) || Object.keys(asRecord(directPassage)).length > 0;

 return (
  hasDirectPassage ||
  arrayValue(record, "paragraphs").length > 0 ||
  arrayValue(record, "segments").length > 0 ||
  ["text_with_blanks", "passage_with_blanks", "passage_blanked", "cloze_text", "passage_text"].some(
   (key) => Boolean(stringValue(record, key)),
  )
 );
}

export function lineTextFromValue(value: unknown) {
 if (typeof value === "string" || typeof value === "number") {
  return answerToString(value);
 }

 const record = asRecord(value);

 return (
  stringValue(record, "zh") ||
  stringValue(record, "text") ||
  stringValue(record, "sentence") ||
  stringValue(record, "prompt") ||
  stringValue(record, "question") ||
  stringValue(record, "answer") ||
  answerToString(value)
 );
}

export function modelLineEntries(record: Record<string, unknown>) {
 return ["model", "model_a", "model_b", "prompt_a", "prompt_b"]
  .map((key) => ({ key, value: stringValue(record, key) }))
  .filter((entry) => Boolean(entry.value));
}

export function answerFromRecord(record: Record<string, unknown>) {
 const answerRecord = asRecord(record.answer);
 const acceptableAnswers = nonEmptyStrings(arrayValue(record, "acceptable_answers"));
 const givenWords = [
  stringValue(record, "given"),
  stringValue(record, "given_word"),
  ...nonEmptyStrings(arrayValue(record, "given_words")),
 ].filter(Boolean);

 return (
  stringValue(record, "sample_answer") ||
  stringValue(record, "sample_answer_zh") ||
  stringValue(record, "suggested_answer") ||
  stringValue(record, "suggested_answer_zh") ||
  stringValue(record, "answer_sample") ||
  stringValue(record, "full_answer") ||
  stringValue(record, "correct") ||
  stringValue(record, "correct_sentence") ||
  formatAnswer(record.answer) ||
  stringValue(answerRecord, "zh") ||
  stringValue(answerRecord, "vi") ||
  stringValue(record, "correct_answer_label") ||
  acceptableAnswers.join(" / ") ||
  (givenWords.length > 0 ? `Từ cho sẵn: ${givenWords.join(" / ")}` : "")
 );
}

export function promptFromQuestionRecord(record: Record<string, unknown>) {
 const nestedQuestion = asRecord(record.question);
 const statement = asRecord(record.statement);
 const givenWords = [
  stringValue(record, "given"),
  stringValue(record, "given_word"),
  ...nonEmptyStrings(arrayValue(record, "given_words")),
 ].filter(Boolean);
 const prompt =
  promptToString(record.prompt) ||
  stringValue(record, "prompt") ||
  stringValue(record, "prompt_zh") ||
  stringValue(record, "wrong") ||
  stringValue(record, "wrong_sentence") ||
  stringValue(record, "response_prompt") ||
  stringValue(record, "question") ||
  stringValue(nestedQuestion, "zh") ||
  stringValue(nestedQuestion, "vi") ||
  stringValue(statement, "zh") ||
  stringValue(statement, "vi") ||
  stringValue(record, "text");

 if (prompt && givenWords.length > 0) {
  return `${prompt}（${givenWords.join(" / ")}）`;
 }

 return prompt || "Câu hỏi";
}

export function firstArrayByKeys(record: Record<string, unknown>, keys: string[]) {
 for (const key of keys) {
  const values = arrayValue(record, key);
  if (values.length > 0) return { key, values };
 }

 return null;
}

export function letterLabel(index: number) {
 return String.fromCharCode(65 + index);
}

export function numberFromRecordKeys(record: Record<string, unknown>, keys: string[]) {
 for (const key of keys) {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
   const parsed = Number.parseInt(value, 10);
   if (Number.isFinite(parsed)) return parsed;
  }
 }

 return null;
}

export function normalizeIndex(value: number | null, length: number) {
 if (value === null) return null;
 if (value >= 0 && value < length) return value;
 if (value >= 1 && value <= length) return value - 1;
 return null;
}

export function matchingItemText(value: unknown) {
 const record = asRecord(value);
 return (
  stringValue(record, "text") ||
  stringValue(record, "zh") ||
  stringValue(record, "label") ||
  stringValue(record, "prompt") ||
  stringValue(record, "value") ||
  answerToString(value)
 );
}

export function isReadingClozeExercise(item: Exercise, passage: unknown, answers: unknown[]) {
 const record = asRecord(item);
 const rendering = asRecord(record.rendering);
 const renderer = stringValue(rendering, "renderer");
 const variant = stringValue(record, "variant");
 const isReadingCloze =
  item.type === "reading_fill_blank" || variant.includes("cloze") || renderer.includes("cloze");
 if (!isReadingCloze) return null;

 const passageText = passageTextForDiagnostics(passage);
 const markerCount = passageText.match(CLOZE_MARKER_PATTERN)?.length ?? 0;
 const answerCount = answers.filter(hasClozeAnswerValue).length;
 const readingReference =
  stringValue(record, "reading_ref") ||
  stringValue(record, "reading_id") ||
  stringValue(record, "linked_reading_id");

 return {
  renderer,
  variant,
  markerCount,
  answerCount,
  readingReference,
 };
}
