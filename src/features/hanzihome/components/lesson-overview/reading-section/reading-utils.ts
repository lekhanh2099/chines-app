import type { JsonFieldValue } from "@/types/json";
import { answerToString, asRecord, stringValue } from "../utils";

export function formatAnswer(value: JsonFieldValue): string {
 if (typeof value === "boolean") return value ? "Đúng" : "Sai";

 const record = asRecord(value);
 return (
  answerToString(value) ||
  stringValue(record, "answer") ||
  stringValue(record, "answer_zh") ||
  stringValue(record, "sample_answer") ||
  stringValue(record, "correct") ||
  stringValue(record, "correct_sentence") ||
  stringValue(record, "value") ||
  stringValue(record, "text") ||
  stringValue(record, "zh")
 );
}

export function objectText(
 value: JsonFieldValue,
 keys: string[] = ["zh", "vi", "text", "prompt", "question"],
) {
 const record = asRecord(value);

 for (const key of keys) {
  const text = stringValue(record, key);
  if (text) return text;
 }

 return "";
}
