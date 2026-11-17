import type { JsonFieldValue, JsonObject } from "@/types/json";
import {
 arrayValue,
 asRecord,
 stringValue,
} from "@/features/hanzihome/components/lesson-overview/utils";

const EMPHASIS_PATTERN = /(\*{1,3})(?=\S)([^*\n]+?)\1/gu;
const BLANK_RUN_PATTERN = /[_＿](?:\s?[_＿])+/gu;
const EMPTY_PARENTHESES_PATTERN = /[(（]\s+[)）]/gu;
const LEADING_PICTOGRAPH_PATTERN = /^[\p{Extended_Pictographic}️\s]+/u;

/** Strips markdown emphasis/heading markers and collapses whitespace. */
export function cleanText(value: string) {
 return value
  .replace(EMPHASIS_PATTERN, "$2")
  .replace(/`/gu, "")
  .replace(/^#+\s+/u, "")
  .replace(/\s+/gu, " ")
  .trim();
}

/** Splits on line breaks and cleans each line; empty lines are dropped. */
export function cleanLines(value: string) {
 return value
  .split(/\n+/u)
  .map(cleanText)
  .filter((line) => line.length > 0);
}

/** Rewrites every blank the sources use (`____`, `＿＿`, `( )`) as the reader's `___`. */
export function normalizeBlanks(value: string) {
 return value.replace(BLANK_RUN_PATTERN, "___").replace(EMPTY_PARENTHESES_PATTERN, "___").trim();
}

/** `→` splits prompt from answer in the reader, so prose keeps a different arrow. */
export function withoutAnswerArrow(value: string) {
 return value.replace(/→/gu, "➝");
}

export function stripLeadingPictographs(value: string) {
 return value.replace(LEADING_PICTOGRAPH_PATTERN, "").trim();
}

export function textOf(value: JsonFieldValue): string {
 if (typeof value === "string") return cleanText(value);
 if (typeof value === "number") return String(value);
 return "";
}

export function firstText(record: JsonObject, keys: readonly string[]) {
 for (const key of keys) {
  const text = textOf(record[key]);
  if (text) return text;
 }
 return "";
}

/** Cleaned strings of an array value; nested arrays are joined with ` / `. */
export function textList(value: JsonFieldValue): string[] {
 if (!Array.isArray(value)) return [];
 return value
  .map((entry) => (Array.isArray(entry) ? textList(entry).join(" / ") : textOf(entry)))
  .filter((text) => text.length > 0);
}

export function recordList(value: JsonFieldValue): JsonObject[] {
 if (!Array.isArray(value)) return [];
 return value.map(asRecord).filter((record) => Object.keys(record).length > 0);
}

/** Sorts payload entries by their numeric `order`, keeping source order for ties. */
export function byOrder(records: readonly JsonObject[]) {
 return records
  .map((record, index) => ({ record, index }))
  .sort((left, right) => orderOf(left.record, left.index) - orderOf(right.record, right.index))
  .map((entry) => entry.record);
}

function orderOf(record: JsonObject, index: number) {
 return typeof record.order === "number" ? record.order : index + 1;
}

export function isRecordValue(value: JsonFieldValue) {
 return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function containsHan(value: string) {
 return /\p{Script=Han}/u.test(value);
}

export { arrayValue, asRecord, stringValue };
