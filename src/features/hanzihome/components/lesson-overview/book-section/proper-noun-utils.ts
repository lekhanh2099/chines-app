import type { JsonFieldValue } from "@/types/json";
import type { JsonObject } from "@/types/json";
import { asRecord, stringValue } from "../utils";

export function stringList(value: JsonFieldValue) {
 if (!Array.isArray(value)) return [];

 return value.filter(
  (entry): entry is string => typeof entry === "string" && Boolean(entry.trim()),
 );
}

export function properNounBackText(record: JsonObject) {
 const flashcard = asRecord(record.flashcard);

 return (
  stringValue(record, "meaning_vi") ||
  stringValue(record, "vi") ||
  stringValue(record, "meaning_en") ||
  stringValue(flashcard, "back")
 );
}

export function properNounFrontText(record: JsonObject) {
 const flashcard = asRecord(record.flashcard);

 return (
  stringValue(record, "hanzi") ||
  stringValue(record, "zh") ||
  stringValue(record, "text") ||
  stringValue(record, "title") ||
  stringValue(flashcard, "front")
 );
}
