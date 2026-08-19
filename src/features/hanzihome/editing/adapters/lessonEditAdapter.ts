import type { JsonFieldValue } from "@/types/json";
import type { EditAdapter } from "./types";

function asRecord(value: JsonFieldValue): { [key: string]: JsonFieldValue } {
 return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function stringValue(record: { [key: string]: JsonFieldValue }, key: string) {
 const value = record[key];
 return typeof value === "string" ? value : "";
}

export const lessonEditAdapter: EditAdapter = {
 fields: [
  { key: "title_zh", label: "Tiêu đề tiếng Trung", required: true },
  { key: "title_pinyin", label: "Pinyin tiêu đề" },
  { key: "title_vi", label: "Tiêu đề tiếng Việt" },
  { key: "title_en", label: "Tiêu đề tiếng Anh" },
  { key: "tags", label: "Tags", kind: "string-list" },
  { key: "source_file", label: "Tệp nguồn" },
 ],
 toValues: (value) => {
  const lesson = asRecord(value);
  const title = asRecord(lesson.title);

  return {
   title_zh: stringValue(title, "zh"),
   title_pinyin: stringValue(title, "pinyin"),
   title_vi: stringValue(title, "vi"),
   title_en: stringValue(title, "en"),
   tags: Array.isArray(lesson.tags)
    ? lesson.tags.filter((tag): tag is string => typeof tag === "string").join("\n")
    : "",
   source_file: stringValue(lesson, "source_file"),
  };
 },
 toNode: (original, values) => {
  const lesson = asRecord(original);
  const title = asRecord(lesson.title);

  return {
   ...lesson,
   title: {
    ...title,
    zh: values.title_zh ?? "",
    pinyin: values.title_pinyin ?? "",
    vi: values.title_vi ?? "",
    en: values.title_en ?? "",
   },
   tags: (values.tags ?? "")
    .split("\n")
    .map((tag) => tag.trim())
    .filter(Boolean),
   source_file: values.source_file ?? "",
  };
 },
};
