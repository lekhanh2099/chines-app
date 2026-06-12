import { answerToString, asRecord, stringValue } from "../utils";

export function formatAnswer(value: unknown): string {
 if (typeof value === "boolean") return value ? "Đúng" : "Sai";
 return answerToString(value);
}

export function objectText(
 value: unknown,
 keys: string[] = ["zh", "vi", "text", "prompt", "question"],
) {
 const record = asRecord(value);

 for (const key of keys) {
  const text = stringValue(record, key);
  if (text) return text;
 }

 return "";
}
