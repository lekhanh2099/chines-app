import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { hasRenderableValue } from "../CommonCards";
import { arrayValue, asRecord, stringValue } from "../utils";

export type SummaryGroup = {
 id: string;
 title: string;
 items: Array<{ id: string; label: string; detail?: string }>;
};

function titleFromValue(value: unknown, fallback: string) {
 if (typeof value === "string") return value;

 const record = asRecord(value);

 return (
  stringValue(record, "title_vi") ||
  stringValue(record, "title") ||
  stringValue(record, "pattern") ||
  stringValue(record, "zh") ||
  stringValue(record, "text") ||
  stringValue(record, "label") ||
  stringValue(record, "id") ||
  fallback
 );
}

function detailFromValue(value: unknown) {
 const record = asRecord(value);

 return (
  stringValue(record, "meaning_vi") ||
  stringValue(record, "vi") ||
  stringValue(record, "pinyin") ||
  stringValue(record, "note_vi") ||
  stringValue(record, "grammar_ref")
 );
}

function groupFromArray(
 sectionId: string,
 id: string,
 title: string,
 values: unknown[],
 fallbackLabel: string,
): SummaryGroup | null {
 const visibleValues = values.filter(hasRenderableValue);
 if (visibleValues.length === 0) return null;

 return {
  id: `${sectionId}-${id}`,
  title,
  items: visibleValues.map((value, index) => ({
   id: `${sectionId}-${id}-${index}`,
   label: titleFromValue(value, `${fallbackLabel} ${index + 1}`),
   detail: detailFromValue(value),
  })),
 };
}

function collectArrays(record: Record<string, unknown>, keys: string[]): unknown[] {
 return keys.flatMap((key) => arrayValue(record, key));
}

export function buildSummaryGroups(section: Section): SummaryGroup[] {
 const sectionRecord = asRecord(section);
 const embeddedSummary = asRecord(sectionRecord.summary);
 const contentSummary = asRecord(sectionRecord.content);
 const coverage = {
  ...asRecord(sectionRecord.coverage_total),
  ...asRecord(embeddedSummary.coverage_total),
  ...asRecord(contentSummary.coverage_total),
  ...asRecord(sectionRecord.coverage),
  ...asRecord(embeddedSummary.coverage),
  ...asRecord(contentSummary.coverage),
 };

 const coverageEntries = Object.entries(coverage)
  .filter(([, value]) => typeof value === "boolean")
  .map(([key, value]) => ({
   id: `${section.id}-coverage-${key}`,
   label: key.replaceAll("_", " "),
   detail: value ? "Đã có dữ liệu" : "Chưa có dữ liệu",
  }));

 const remainingCheckValue = coverage.remaining_check_needed;
 const remainingChecks =
  typeof remainingCheckValue === "string"
   ? [remainingCheckValue]
   : arrayValue(coverage, "remaining_check_needed");

 return [
  groupFromArray(
   section.id,
   "lesson-parts",
   "Phần trong bài",
   [
    ...collectArrays(sectionRecord, ["lesson_parts"]),
    ...collectArrays(embeddedSummary, ["lesson_parts"]),
    ...collectArrays(contentSummary, ["lesson_parts"]),
   ],
   "Phần",
  ),
  groupFromArray(
   section.id,
   "grammar-points",
   "Điểm ngữ pháp",
   [
    ...collectArrays(sectionRecord, ["grammar_points"]),
    ...collectArrays(embeddedSummary, ["grammar_points"]),
    ...collectArrays(contentSummary, ["grammar_points"]),
   ],
   "Ngữ pháp",
  ),
  groupFromArray(
   section.id,
   "patterns",
   "Mẫu câu / câu trọng tâm",
   [
    ...collectArrays(sectionRecord, [
     "key_patterns",
     "key_sentence_patterns",
     "key_sentences",
     "main_patterns",
    ]),
    ...collectArrays(embeddedSummary, [
     "key_patterns",
     "key_sentence_patterns",
     "key_sentences",
     "main_patterns",
    ]),
    ...collectArrays(contentSummary, [
     "key_patterns",
     "key_sentence_patterns",
     "key_sentences",
     "main_patterns",
    ]),
   ],
   "Câu",
  ),
  groupFromArray(
   section.id,
   "exercise-types",
   "Dạng bài tập",
   [
    ...collectArrays(sectionRecord, ["exercise_types"]),
    ...collectArrays(embeddedSummary, ["exercise_types"]),
    ...collectArrays(contentSummary, ["exercise_types"]),
   ],
   "Dạng",
  ),
  coverageEntries.length > 0
   ? {
      id: `${section.id}-coverage`,
      title: "Coverage dữ liệu",
      items: coverageEntries,
     }
   : null,
  groupFromArray(section.id, "remaining-checks", "Cần kiểm tra thêm", remainingChecks, "Mục"),
 ].filter((group): group is SummaryGroup => Boolean(group));
}
