import type {
 HanyuLesson,
 Section,
} from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import type { BookSection } from "./types";

export function asRecord(value: unknown): Record<string, unknown> {
 return value && typeof value === "object" && !Array.isArray(value)
  ? (value as Record<string, unknown>)
  : {};
}

export function stringValue(record: Record<string, unknown>, key: string) {
 const value = record[key];
 return typeof value === "string" ? value.trim() : "";
}

export function arrayValue(record: Record<string, unknown>, key: string) {
 const value = record[key];
 return Array.isArray(value) ? value : [];
}

export function nonEmptyStrings(value: unknown[]) {
 return value.filter(
  (entry): entry is string =>
   typeof entry === "string" && Boolean(entry.trim()),
 );
}

export function answerToString(value: unknown): string {
 if (typeof value === "string") return value.trim();
 if (typeof value === "number" || typeof value === "boolean")
  return String(value);
 if (Array.isArray(value)) return nonEmptyStrings(value).join(" / ");
 return "";
}

export function sectionTitle(section: Section) {
 return section.title_vi || section.title;
}

export function sectionSubtitle(section: Section) {
 if (section.type === "text") return `${section.blocks.length} phần bài khóa`;
 if (section.type === "vocabulary")
  return `${section.items.length} từ trong sách`;
 if (section.type === "proper_nouns")
  return `${section.items.length} tên riêng`;
 if (section.type === "notes") return `${section.items.length} chú thích`;
 if (section.type === "grammar") return `${section.items.length} điểm ngữ pháp`;
 if (section.type === "exercises")
  return `${section.items.length} nhóm bài tập`;
 if (section.type === "communication")
  return `${section.items.length} hội thoại`;
 if (section.type === "reading") return `${section.items.length} bài đọc`;
 if (section.type === "character_writing")
  return `${section.items.length} chữ luyện viết`;
 if (section.type === "summary") {
  const sectionRecord = asRecord(section);
  const summaryRecord = asRecord(sectionRecord.summary);
  const contentRecord = asRecord(sectionRecord.content);
  const itemCount =
   section.items.length +
   section.blocks.length +
   arrayValue(sectionRecord, "lesson_parts").length +
   arrayValue(summaryRecord, "lesson_parts").length +
   arrayValue(contentRecord, "lesson_parts").length +
   arrayValue(sectionRecord, "key_sentences").length +
   arrayValue(summaryRecord, "key_sentences").length +
   arrayValue(contentRecord, "key_sentences").length +
   arrayValue(sectionRecord, "main_patterns").length +
   arrayValue(summaryRecord, "main_patterns").length +
   arrayValue(contentRecord, "main_patterns").length +
   arrayValue(sectionRecord, "exercise_types").length +
   arrayValue(summaryRecord, "exercise_types").length +
   arrayValue(contentRecord, "exercise_types").length;

  return itemCount > 0 ? `${itemCount} mục tổng kết` : "Tổng kết bài";
 }
 return undefined;
}

export function getBookSections(
 sourceLesson: HanyuLesson | undefined,
): BookSection[] {
 return (sourceLesson?.lesson.sections ?? [])
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((section) => ({
   id: section.id,
   title: sectionTitle(section),
   subtitle: sectionSubtitle(section),
   type: section.type,
   order: section.order,
   section,
  }));
}

export function sectionEmptyReason(section: Section): string {
 return stringValue(asRecord(section), "empty_reason_vi");
}
