import type { JsonObject, JsonValue } from "@/types/json";

import {
 asRecord,
 firstText,
 isRecordValue,
 recordList,
 textList,
 textOf,
} from "./conversion-text";
import type { ExerciseOutput } from "./exercise-output";

const WORD_KEYS = ["hanzi", "character", "word"];
const BLANK_OR_QUESTION_PATTERN = /[_＿]{2,}|[?？]|[(（]\s+[)）]/u;

/** Entries that are vocabulary-like records (`hanzi` + meaning), in source order. */
export function wordEntries(entries: readonly JsonValue[]): JsonObject[] {
 return recordList([...entries]).filter((record) => firstText(record, WORD_KEYS).length > 0);
}

function nestedWords(record: JsonObject): JsonObject[] {
 const nested = [...recordList(record.characters), ...recordList(record.sub_entries)];
 return nested.length > 0 && !firstText(record, WORD_KEYS)
  ? nested
  : [record, ...recordList(record.sub_entries)];
}

/** Vocabulary-like records as table rows under `Từ | Pinyin | Nghĩa | Ví dụ`; empty columns are left out. */
export function wordTableRows(records: readonly JsonObject[]): string[][] {
 const rows = records.flatMap(nestedWords).map((record) => [
  firstText(record, WORD_KEYS),
  textOf(record.pinyin),
  [textOf(record.meaning_vi), textOf(record.note_vi)].filter(Boolean).join(" · "),
  [
   firstText(record, ["example", "example_word", "word_in_lesson"]),
   textOf(record.example_vi),
   recordList(record.phrases)
    .map((phrase) => textOf(phrase.text))
    .join("、"),
  ]
   .filter(Boolean)
   .join(" — "),
 ]);
 const headers = ["Từ", "Pinyin", "Nghĩa", "Ví dụ"];
 const kept = headers.map((_, column) => rows.some((row) => (row[column] ?? "") !== ""));
 const keep = (row: string[]) => row.filter((_, column) => kept[column]);
 return rows.length > 0 ? [keep(headers), ...rows.map(keep)] : [];
}

export function writeWordTable(records: readonly JsonObject[], output: ExerciseOutput) {
 output.table(wordTableRows(records));
}

/** A list of records as a table with one column per key; an `answer` column stays hidden. */
export function writeRecordTable(
 records: readonly JsonObject[],
 headers: readonly string[],
 output: ExerciseOutput,
) {
 if (records.length === 0) return;
 const keys = Object.keys(records[0] ?? {}).filter((key) => key !== "id" && key !== "order");
 const titles =
  headers.length === keys.length
   ? [...headers]
   : keys.map((key) => (key === "answer" ? "Đáp án" : key));
 const rows = records.map((record) => keys.map((key) => textOf(record[key])));
 const answerColumn = keys.indexOf("answer");
 if (answerColumn < 0) output.table([titles, ...rows]);
 else
  output.answerTable(
   [titles, ...rows],
   [answerColumn],
   rows.filter((row) => row[answerColumn]).length,
  );
}

function drillText(entry: JsonValue): string {
 if (Array.isArray(entry)) return textList(entry).join(" / ");
 if (!isRecordValue(entry)) return textOf(entry);
 const record = asRecord(entry);
 const sides = [textOf(record.left), textOf(record.middle), textOf(record.right)].filter(Boolean);
 if (sides.length > 0) return sides.join(" / ");
 return (
  firstText(record, ["text", "zh"]) ||
  Object.entries(record)
   .filter(([key]) => !["id", "order", "pinyin", "vi"].includes(key))
   .map(([, value]) => textOf(value))
   .filter(Boolean)
   .join(" / ")
 );
}

function isDrillRecord(record: JsonObject) {
 return !["prompt", "question", "answer", "sample_answer", "sentence", "situation", "prompts"].some(
  (key) => record[key] !== undefined,
 );
}

/**
 * Phrase lists that are read or substituted rather than answered: minimal
 * pairs become a two-column table, phrases with a meaning a `Từ | Nghĩa`
 * table, bare phrases a `a | b | c` drill. Returns false when the entries are
 * questions.
 */
export function writeDrillList(entries: readonly JsonValue[], output: ExerciseOutput) {
 const records = entries.map((entry) => (isRecordValue(entry) ? asRecord(entry) : {}));
 if (entries.some((entry, index) => isRecordValue(entry) && !isDrillRecord(records[index] ?? {}))) {
  return false;
 }
 if (
  records.every((record) => textOf(record.left) && textOf(record.right) && !textOf(record.middle))
 ) {
  const side = (record: JsonObject, name: string) =>
   [textOf(record[`${name}_zh`]), textOf(record[name]), textOf(record[`${name}_vi`])]
    .filter(Boolean)
    .join(" · ");
  output.table([
   ["A", "B"],
   ...records.map((record) => [side(record, "left"), side(record, "right")]),
  ]);
  return true;
 }
 const texts = entries.map(drillText);
 if (texts.some((text) => !text || BLANK_OR_QUESTION_PATTERN.test(text))) return false;
 const meanings = records.map((record) => textOf(record.vi));
 if (meanings.some(Boolean)) {
  output.table([["Từ", "Nghĩa"], ...texts.map((text, index) => [text, meanings[index] ?? ""])]);
 } else {
  output.wordBank(texts);
 }
 return true;
}
