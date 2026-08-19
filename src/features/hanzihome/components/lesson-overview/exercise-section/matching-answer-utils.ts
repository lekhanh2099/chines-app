import type { JsonFieldValue, JsonValue } from "@/types/json";
import { answerToString, asRecord, stringValue } from "../utils";
import {
 matchingItemText,
 normalizeIndex,
 numberFromRecordKeys,
 letterLabel,
} from "./exercise-utils";

export type MatchingAnswerView = {
 id: string;
 leftLabel: string;
 rightLabel: string;
 leftText: string;
 rightText: string;
 explanation: string;
};

export function matchingAnswerText({
 answerValue,
 index,
 leftItems,
 rightItems,
}: {
 answerValue: JsonFieldValue;
 index: number;
 leftItems: JsonValue[];
 rightItems: JsonValue[];
}): MatchingAnswerView {
 if (
  typeof answerValue === "string" ||
  typeof answerValue === "number" ||
  typeof answerValue === "boolean"
 ) {
  const rawAnswer = answerToString(answerValue);
  const match = rawAnswer.match(/^\s*(\d+|[A-Za-z])\s*(?:->|→|-|:|=)\s*(\d+|[A-Za-z])\s*$/);

  const rawLeft = match?.[1] || `${index + 1}`;
  const rawRight = match?.[2] || rawAnswer || "?";

  const leftNumber = Number.parseInt(rawLeft, 10);
  const leftIndex = Number.isFinite(leftNumber)
   ? normalizeIndex(leftNumber, leftItems.length)
   : null;

  const rightNumber = Number.parseInt(rawRight, 10);
  const rightLetterIndex = /^[A-Za-z]$/.test(rawRight)
   ? rawRight.toUpperCase().charCodeAt(0) - 65
   : null;

  const rightIndex = Number.isFinite(rightNumber)
   ? normalizeIndex(rightNumber, rightItems.length)
   : normalizeIndex(rightLetterIndex, rightItems.length);

  return {
   id: `${index}`,
   leftLabel: leftIndex !== null ? `${leftIndex + 1}` : rawLeft,
   rightLabel: rightIndex !== null ? letterLabel(rightIndex) : rawRight,
   leftText: leftIndex !== null ? matchingItemText(leftItems[leftIndex]) : "",
   rightText: rightIndex !== null ? matchingItemText(rightItems[rightIndex]) : "",
   explanation: "",
  };
 }

 const answer = asRecord(answerValue);

 const leftNumber = numberFromRecordKeys(answer, [
  "left_index",
  "left_order",
  "prompt_index",
  "question_index",
  "a_index",
  "from_index",
  "left",
  "from",
 ]);

 const rightNumber = numberFromRecordKeys(answer, [
  "right_index",
  "right_order",
  "answer_index",
  "b_index",
  "to_index",
  "right",
  "to",
 ]);

 const leftIndex = normalizeIndex(leftNumber, leftItems.length);
 const rightIndex = normalizeIndex(rightNumber, rightItems.length);

 const rawLeft =
  stringValue(answer, "left_label") ||
  stringValue(answer, "left_id") ||
  stringValue(answer, "from") ||
  stringValue(answer, "left");

 const rawRight =
  stringValue(answer, "right_label") ||
  stringValue(answer, "right_id") ||
  stringValue(answer, "to") ||
  stringValue(answer, "right") ||
  stringValue(answer, "answer") ||
  stringValue(answer, "value");

 const letterRightIndex =
  /^[A-Za-z]$/.test(rawRight) && rightItems.length > 0
   ? rawRight.toUpperCase().charCodeAt(0) - 65
   : null;

 const normalizedRightIndex = rightIndex ?? normalizeIndex(letterRightIndex, rightItems.length);

 const leftLabel = leftIndex !== null ? `${leftIndex + 1}` : rawLeft || `${index + 1}`;

 const rightLabel =
  normalizedRightIndex !== null ? letterLabel(normalizedRightIndex) : rawRight || "?";

 const leftText = leftIndex !== null ? matchingItemText(leftItems[leftIndex]) : "";
 const rightText =
  normalizedRightIndex !== null ? matchingItemText(rightItems[normalizedRightIndex]) : "";

 const explanation =
  stringValue(answer, "explanation_vi") ||
  stringValue(answer, "note_vi") ||
  stringValue(answer, "reason_vi");

 return {
  id: stringValue(answer, "id") || `${index}`,
  leftLabel,
  rightLabel,
  leftText,
  rightText,
  explanation,
 };
}
