import type { JsonFieldValue, JsonObject } from "@/types/json";

import {
 asRecord,
 cleanLines,
 firstText,
 isRecordValue,
 recordList,
 textList,
 textOf,
} from "./conversion-text";

/** One source answer: the answer itself plus the meaning/explanation lines that follow it. */
export type SourceAnswer = { text: string; notes: string[] };

const NO_ANSWER: SourceAnswer = { text: "", notes: [] };

const ANSWER_TEXT_KEYS = [
 "answer_zh",
 "answer_text",
 "correct",
 "correct_sentence",
 "correct_answer",
 "correct_zh",
 "corrected",
 "correct_sample",
 "full_answer",
 "sample_answer_zh",
 "suggested_answer",
 "answer_sample",
 "output",
 "answer_label",
 "completed_paragraph",
 "answered_paragraph",
 "value",
];

const ANSWER_MEANING_KEYS = [
 "answer_vi",
 "sample_answer_vi",
 "correct_vi",
 "answer_zh_vi",
 "alternative_answers_vi",
 "given_word_vi",
 "explanation_vi",
 "answer_note_vi",
 "note_vi",
 "note",
];

const ANSWER_LABEL_KEYS = [
 "blank",
 "blank_number",
 "blank_no",
 "blank_index",
 "blank_marker",
 "index",
 "number",
 "label",
 "question_order",
 "question_index",
];

function multilineText(value: JsonFieldValue) {
 if (Array.isArray(value)) return textList(value).join(" / ");
 return typeof value === "string" ? cleanLines(value).join("\n") : textOf(value);
}

function answerValueText(record: JsonObject): string {
 const answer = record.answer;
 if (typeof answer === "boolean") {
  return typeof record.answer_source === "string"
   ? textOf(record.answer_source)
   : answer
     ? "Đúng"
     : "Sai";
 }
 if (Array.isArray(answer)) return textList(answer).join(" / ");
 if (isRecordValue(answer)) return firstText(asRecord(answer), ["zh", "text", "answer", "vi"]);
 return multilineText(answer);
}

function sampleAnswerText(record: JsonObject): string {
 const sample = record.sample_answer;
 if (Array.isArray(sample)) return textList(sample).join("\n");
 if (isRecordValue(sample)) return firstText(asRecord(sample), ["zh", "text", "answer"]);
 return multilineText(sample);
}

function answerOrderText(record: JsonObject): string {
 const order = record.answer_order;
 return Array.isArray(order) ? textList(order).join(" ") : textOf(order);
}

function answerNotes(record: JsonObject, text: string): string[] {
 const notes = ANSWER_MEANING_KEYS.map((key) => multilineText(record[key]));
 notes.push(firstText(asRecord(record.sample_answer), ["vi"]));
 notes.push(firstText(asRecord(record.answer), ["vi"]));
 const accepted = [
  ...textList(record.acceptable_answers),
  textOf(record.acceptable_answers),
  ...textList(record.alternative_answers),
 ].filter((entry) => entry && entry !== text);
 if (accepted.length > 0) notes.push(`Cũng chấp nhận: ${accepted.join(" / ")}`);
 const hint = textOf(record.answer_hint);
 if (hint) notes.push(`Gợi ý: ${hint}`);
 const patterns = textList(record.expected_patterns);
 if (patterns.length > 0) notes.push(`Mẫu cần dùng: ${patterns.join(" / ")}`);
 const quotes = recordList(record.evidence)
  .map((evidence) => textOf(evidence.quote))
  .filter(Boolean);
 if (quotes.length > 0) notes.push(`Dẫn chứng: ${quotes.join(" / ")}`);
 return notes.filter((note, index) => note && note !== text && notes.indexOf(note) === index);
}

/** The answer a question/answer-key record carries, or an empty answer when it has none. */
export function answerFromRecord(record: JsonObject): SourceAnswer {
 const text =
  answerValueText(record) ||
  firstText(record, ANSWER_TEXT_KEYS) ||
  sampleAnswerText(record) ||
  answerOrderText(record) ||
  firstText(record, ["answer_vi", "sample_answer_vi"]);
 const accepted = [...textList(record.acceptable_answers), ...textList(record.alternative_answers)];
 if (!text && accepted.length > 0) {
  return { text: accepted.join(" / "), notes: answerNotes(record, accepted.join(" / ")) };
 }
 return text ? { text, notes: answerNotes(record, text) } : NO_ANSWER;
}

/** An entry of `answer_key` / `answers` / `blanks` …: a bare string or an answer record. */
export function answerFromEntry(entry: JsonFieldValue): SourceAnswer {
 if (Array.isArray(entry)) return { text: textList(entry).join(" / "), notes: [] };
 if (isRecordValue(entry)) {
  const record = asRecord(entry);
  const answer = answerFromRecord(record);
  const dialogue = textList(record.dialogue);
  return hasAnswer(answer) || dialogue.length === 0
   ? answer
   : { text: dialogue.join("\n"), notes: [] };
 }
 const text = multilineText(entry);
 return text ? { text, notes: [] } : NO_ANSWER;
}

/** `(3)`-style label of an answer-key entry, when the source numbers it. */
export function answerEntryLabel(entry: JsonFieldValue): string {
 if (!isRecordValue(entry)) return "";
 const label = firstText(asRecord(entry), ANSWER_LABEL_KEYS);
 return label ? `(${label})` : "";
}

export function answerEntryQuestionId(entry: JsonFieldValue): string {
 return isRecordValue(entry) ? textOf(asRecord(entry).question_id) : "";
}

/** Answer and notes on one line, for `Đáp án: →` blocks where each line is one answer. */
export function answerOnOneLine(answer: SourceAnswer) {
 return [answer.text, ...answer.notes].map((line) => line.replace(/\n+/gu, " ")).join(" — ");
}

export function hasAnswer(answer: SourceAnswer) {
 return answer.text.length > 0;
}
