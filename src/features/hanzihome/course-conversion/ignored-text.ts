import type { JsonValue } from "@/types/json";

import type { IgnoredTextCoverage } from "./conversion-coverage";
import type { CourseLesson } from "./course-book.schema";

/** Keys whose values are identifiers, bookkeeping, pinyin or raw import copies. */
const SKIPPED_KEYS = new Set([
 "id",
 "type",
 "variant",
 "canonical_variant",
 "order",
 "level",
 "tags",
 "difficulty",
 "skill_focus",
 "rendering",
 "grading",
 "flashcard",
 "pos_detail",
 "pos",
 "practice",
 "audio_key",
 "audio_keys",
 "source_origin",
 "source_raw",
 "source_ref",
 "source_refs",
 "source_paragraphs",
 "source_answer_paragraphs",
 "source_content",
 "source_answer_content",
 "source_table_columns",
 "coverage",
 "coverage_contract",
 "coverage_summary",
 "coverage_total",
 "coverage_note_vi",
 "data_update_report",
 "pos_review",
 "vocab_refs",
 "grammar_refs",
 "proper_noun_refs",
 "evidence",
 "meaning_en",
 "function_en",
 "answer_type",
 "response_type",
 "label",
 "key",
 "speaker",
 "blank_id",
 "question_id",
 "situation_id",
 "paragraph_id",
 "references",
]);

const MINIMUM_CHARACTERS = 4;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_.-]+$/u;

function isSkippedKey(key: string) {
 return (
  SKIPPED_KEYS.has(key) ||
  key.includes("pinyin") ||
  key.endsWith("_ref") ||
  key.endsWith("_refs") ||
  key.endsWith("_id") ||
  key.startsWith("empty_")
 );
}

/** Text reduced to the characters that survive every rewrite the converter applies. */
function comparable(value: string) {
 return value.replace(/[^\p{L}\p{N}]/gu, "");
}

function emittedText(lesson: CourseLesson) {
 const parts: string[] = [];
 for (const section of lesson.sections) {
  parts.push(section.title);
  for (const block of section.blocks) {
   parts.push(block.text, block.translation ?? "", block.speaker ?? "");
   block.rows.forEach((row) => parts.push(...row));
  }
 }
 for (const word of lesson.vocab) parts.push(word.hanzi, word.meaning);
 return comparable(parts.join("\n"));
}

/**
 * Lists every substantial string of a section payload that does not appear in
 * the converted lesson, grouped by its payload path, so ignored fields show up
 * in the coverage report instead of disappearing silently.
 */
export function findIgnoredText(
 lesson: CourseLesson,
 sections: readonly { sectionType: string; payload: JsonValue }[],
): IgnoredTextCoverage[] {
 const emitted = emittedText(lesson);
 const ignored: IgnoredTextCoverage[] = [];
 const visit = (value: JsonValue, path: string, sectionType: string) => {
  if (typeof value === "string") {
   const missing = value
    .split(/\n+/u)
    .map(comparable)
    .some((line) => line.length >= MINIMUM_CHARACTERS && !emitted.includes(line));
   if (missing && !IDENTIFIER_PATTERN.test(value.trim())) {
    ignored.push({
     lessonId: lesson.id,
     sectionType,
     path,
     characters: value.length,
     sample: value.replace(/\s+/gu, " ").slice(0, 80),
    });
   }
   return;
  }
  if (Array.isArray(value)) {
   value.forEach((entry) => visit(entry, `${path}[]`, sectionType));
   return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, entry] of Object.entries(value)) {
   if (entry !== undefined && !isSkippedKey(key)) visit(entry, `${path}.${key}`, sectionType);
  }
 };
 sections.forEach((section) => visit(section.payload, "", section.sectionType));
 return ignored;
}
