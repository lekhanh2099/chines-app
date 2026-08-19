import type { JsonValue } from "@/types/json";
import type { JsonObject } from "@/types/json";
import { z } from "zod";
import { answerToString, arrayValue, asRecord, hasClozeAnswerValue, stringValue } from "../utils";
import type { ClozeAnswer, PassageLine } from "./types";

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

export const BLANK_MARKER_SOURCE =
 "(?:([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]|\\d+)|[（(]\\s*(\\d+)\\s*[）)]|\\[\\s*(\\d+)\\s*\\])\\s*(?:[_＿]{2,}|…{2,}|\\.\\.\\.+)";

export const PLAIN_BLANK_SOURCE = "[_＿]{2,}|…{2,}|\\.\\.\\.+";

const CIRCLED_NUMBER_MAP: Record<string, number> = {
 "①": 1,
 "②": 2,
 "③": 3,
 "④": 4,
 "⑤": 5,
 "⑥": 6,
 "⑦": 7,
 "⑧": 8,
 "⑨": 9,
 "⑩": 10,
 "⑪": 11,
 "⑫": 12,
 "⑬": 13,
 "⑭": 14,
 "⑮": 15,
 "⑯": 16,
 "⑰": 17,
 "⑱": 18,
 "⑲": 19,
 "⑳": 20,
};

export function blankLabelToNumber(label: string): Nullable<number> {
 if (label in CIRCLED_NUMBER_MAP) return CIRCLED_NUMBER_MAP[label];

 const direct = Number.parseInt(label, 10);
 return Number.isFinite(direct) ? direct : null;
}

function numberValue(record: JsonObject, key: string): Nullable<number> {
 const value = record[key];

 if (typeof value === "number" && Number.isFinite(value)) return value;
 if (typeof value !== "string") return null;

 const direct = Number.parseInt(value.trim(), 10);
 return Number.isFinite(direct) ? direct : null;
}

function numberFromLabelSuffix(label: string): Nullable<number> {
 const direct = Number.parseInt(label, 10);
 if (Number.isFinite(direct)) return direct;

 const suffix = label.match(/(\d+)$/)?.[1];
 const suffixNumber = suffix ? Number.parseInt(suffix, 10) : Number.NaN;

 return Number.isFinite(suffixNumber) ? suffixNumber : null;
}

export function answerIndexFromRecord(record: JsonObject) {
 const directNumber =
  numberValue(record, "blank") ??
  numberValue(record, "blank_no") ??
  numberValue(record, "blankNo") ??
  numberValue(record, "index") ??
  numberValue(record, "number") ??
  numberValue(record, "question_no") ??
  numberValue(record, "questionNo") ??
  numberValue(record, "order") ??
  numberValue(record, "blank_number");

 if (directNumber !== null) return directNumber;

 const label =
  stringValue(record, "blank_id") ||
  stringValue(record, "question_id") ||
  stringValue(record, "label");

 if (label) return numberFromLabelSuffix(label);

 const id = stringValue(record, "id");
 return /^\d+$/.test(id) ? Number.parseInt(id, 10) : null;
}

function answerTextFromRecord(record: JsonObject) {
 return (
  stringValue(record, "answer") ||
  stringValue(record, "answer_zh") ||
  stringValue(record, "value") ||
  stringValue(record, "text") ||
  stringValue(record, "zh") ||
  stringValue(record, "sample_answer") ||
  arrayValue(record, "acceptable_answers").map(answerToString).filter(Boolean).join(" / ")
 );
}

function normalizeClozeAnswers(values: JsonValue[]): ClozeAnswer[] {
 return values.flatMap((value, index): ClozeAnswer[] => {
  if (typeof value === "string" || typeof value === "number") {
   const answer = answerToString(value);

   return answer
    ? [
       {
        key: `${index + 1}`,
        label: `${index + 1}`,
        answer,
       },
      ]
    : [];
  }

  const record = asRecord(value);
  const answer = answerTextFromRecord(record);
  if (!answer) return [];

  const answerIndex = answerIndexFromRecord(record);
  const stableKey =
   stringValue(record, "blank_id") ||
   stringValue(record, "question_id") ||
   stringValue(record, "id") ||
   `${answerIndex ?? index + 1}`;

  return [
   {
    key: stableKey,
    label: answerIndex ? `${answerIndex}` : stableKey,
    answer,
    pinyin: stringValue(record, "answer_pinyin") || stringValue(record, "pinyin"),
    note:
     stringValue(record, "explanation_vi") ||
     stringValue(record, "note_vi") ||
     stringValue(record, "answer_vi") ||
     stringValue(record, "usage_note_vi"),
   },
  ];
 });
}

function firstNonEmptyAnswerSource(passageRecord: JsonObject, answers: JsonValue[]) {
 if (answers.length > 0) return answers;

 const sourceKeys = [
  "blanks",
  "answers",
  "answer_key",
  "cloze_answers",
  "suggested_answers",
  "questions",
 ];

 for (const key of sourceKeys) {
  const values = arrayValue(passageRecord, key);
  if (values.some(hasClozeAnswerValue)) return values;
 }

 return [];
}

export function clozeAnswersFromSources(passageRecord: JsonObject, answers: JsonValue[]) {
 const normalizedAnswers = normalizeClozeAnswers(firstNonEmptyAnswerSource(passageRecord, answers));
 const answerMap = new Map<string, ClozeAnswer>();

 for (const answer of normalizedAnswers) {
  if (!answerMap.has(answer.label)) answerMap.set(answer.label, answer);
  if (!answerMap.has(answer.key)) answerMap.set(answer.key, answer);
 }

 return {
  answerMap,
  answerList: normalizedAnswers,
 };
}

export function getBlankMarkerFromMatch(match: RegExpMatchArray): string {
 return match[1] || match[2] || match[3] || "";
}

function hasBlankMarkers(text: string) {
 return new RegExp(BLANK_MARKER_SOURCE, "g").test(text);
}

function hasPlainBlanks(text: string) {
 return new RegExp(PLAIN_BLANK_SOURCE, "g").test(text);
}

export function shouldRenderAsCloze(
 text: string,
 answerMap: Map<string, ClozeAnswer>,
 rendererId: string,
) {
 if (answerMap.size === 0) return false;
 if (hasBlankMarkers(text)) return true;

 const normalizedRendererId = rendererId.toLowerCase();
 return (
  hasPlainBlanks(text) &&
  (normalizedRendererId.includes("cloze") ||
   normalizedRendererId.includes("fill_blank") ||
   normalizedRendererId.includes("fill-blank"))
 );
}

export function withMissingBlankNumbers(
 text: string,
 answerMap: Map<string, ClozeAnswer>,
 nextBlankNumber: () => number,
) {
 if (hasBlankMarkers(text) || answerMap.size === 0) return text;

 return text.replace(new RegExp(PLAIN_BLANK_SOURCE, "g"), (match) => {
  return `${nextBlankNumber()}${match}`;
 });
}

export function fillClozeBlanksWithAnswers(
 text: string,
 answerMap: Map<string, ClozeAnswer>,
 rendererId: string,
) {
 if (!text || answerMap.size === 0) return text;

 let didFill = false;
 const filledMarkedBlanks = text.replace(
  new RegExp(BLANK_MARKER_SOURCE, "g"),
  (match: string, directMarker?: string, parenMarker?: string, bracketMarker?: string) => {
   const marker = directMarker || parenMarker || bracketMarker || "";
   const blankNumber = blankLabelToNumber(marker);
   const label = blankNumber ? `${blankNumber}` : marker;
   const answer = answerMap.get(label);

   if (!answer) return match;

   didFill = true;
   return answer.answer;
  },
 );

 if (didFill) return filledMarkedBlanks;
 if (!shouldRenderAsCloze(text, answerMap, rendererId)) return text;

 let plainBlankIndex = 0;
 return text.replace(new RegExp(PLAIN_BLANK_SOURCE, "g"), (match) => {
  plainBlankIndex += 1;
  const answer = answerMap.get(`${plainBlankIndex}`);

  if (!answer) return match;

  didFill = true;
  return answer.answer;
 });
}

export function completedTextFromPassageLines(
 lines: PassageLine[],
 answerMap: Map<string, ClozeAnswer>,
 rendererId: string,
) {
 const sourceText = lines.map((line) => line.zh).join("\n\n");
 if (!sourceText) return "";

 const completedText = fillClozeBlanksWithAnswers(sourceText, answerMap, rendererId);
 return completedText !== sourceText ? completedText : "";
}

export function passageLinesFromParagraphs(
 paragraphs: JsonValue[],
 itemId: string,
 answerMap: Map<string, ClozeAnswer>,
) {
 let plainBlankIndex = 0;
 const nextBlankNumber = () => {
  plainBlankIndex += 1;
  return plainBlankIndex;
 };

 return paragraphs.flatMap((paragraphValue, index): PassageLine[] => {
  if (typeof paragraphValue === "string") {
   const text = withMissingBlankNumbers(paragraphValue.trim(), answerMap, nextBlankNumber);

   return text
    ? [
       {
        id: `${itemId}-passage-paragraph-${index}`,
        zh: text,
       },
      ]
    : [];
  }

  const paragraph = asRecord(paragraphValue);
  const zh =
   stringValue(paragraph, "zh") ||
   stringValue(paragraph, "text") ||
   stringValue(paragraph, "text_with_blanks") ||
   stringValue(paragraph, "completed_text");

  if (!zh) return [];

  return [
   {
    id: stringValue(paragraph, "id") || `${itemId}-passage-paragraph-${index}`,
    zh: withMissingBlankNumbers(zh, answerMap, nextBlankNumber),
    pinyin: stringValue(paragraph, "pinyin"),
    vi:
     stringValue(paragraph, "vi") ||
     stringValue(paragraph, "translation_vi") ||
     stringValue(paragraph, "meaning_vi"),
   },
  ];
 });
}

export function clozeTextFromSegments(segments: JsonValue[]) {
 return segments
  .map((segmentValue, index) => {
   const segment = asRecord(segmentValue);

   if (stringValue(segment, "type") === "blank") {
    const marker = answerIndexFromRecord(segment) ?? index + 1;
    return ` ${marker}______ `;
   }

   return (
    stringValue(segment, "text") || stringValue(segment, "zh") || answerToString(segmentValue)
   );
  })
  .join("");
}
