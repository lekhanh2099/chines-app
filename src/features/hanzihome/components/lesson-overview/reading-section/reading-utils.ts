import type { JsonFieldValue } from "@/types/json";
import { answerToString, asRecord, stringValue } from "../utils";

export function formatAnswer(value: JsonFieldValue): string {
 if (typeof value === "boolean") return value ? "Đúng" : "Sai";
 return answerToString(value);
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
