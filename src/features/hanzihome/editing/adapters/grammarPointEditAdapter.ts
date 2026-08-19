import type { JsonFieldValue } from "@/types/json";
import type { EditAdapter } from "./types";

function asRecord(value: JsonFieldValue): { [key: string]: JsonFieldValue } {
 return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function text(value: JsonFieldValue) {
 return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function stringList(value: JsonFieldValue) {
 return Array.isArray(value)
  ? value.filter((item): item is string => typeof item === "string").join("\n")
  : "";
}

export const grammarPointEditAdapter: EditAdapter = {
 fields: [
  { key: "title", label: "Tiêu đề", required: true },
  { key: "title_vi", label: "Tiêu đề tiếng Việt" },
  { key: "cleanTitle", label: "Tiêu đề hiển thị", required: true },
  { key: "level", label: "Cấp độ" },
  { key: "core", label: "Ý nghĩa chính", kind: "textarea" },
  { key: "contentMd", label: "Nội dung Markdown", kind: "textarea" },
  { key: "structuresView", label: "Công thức hiển thị", kind: "string-list" },
  { key: "notes", label: "Ghi chú", kind: "string-list" },
  { key: "tags", label: "Tags", kind: "string-list" },
 ],
 toValues: (value) => {
  const point = asRecord(value);

  return {
   title: text(point.title) || text(point.cleanTitle),
   title_vi: text(point.title_vi) || text(point.titleVi),
   cleanTitle: text(point.cleanTitle) || text(point.title),
   level: text(point.level),
   core: text(point.core),
   contentMd: text(point.contentMd),
   structuresView: stringList(point.structuresView),
   notes: stringList(point.notes),
   tags: stringList(point.tags),
  };
 },
 toNode: (original, values) => {
  const point = asRecord(original);
  const title = values.title ?? "";

  point.title = title;
  point.cleanTitle = values.cleanTitle ?? title;
  if ("titleVi" in point) {
   point.titleVi = values.title_vi ?? "";
  } else if ("title_vi" in point || values.title_vi?.trim()) {
   point.title_vi = values.title_vi ?? "";
  }
  if ("level" in point || values.level?.trim()) {
   point.level = values.level ?? "";
  }
  if ("core" in point || values.core?.trim()) {
   point.core = values.core ?? "";
  }
  point.contentMd = values.contentMd ?? "";
  if ("structuresView" in point || values.structuresView?.trim()) {
   point.structuresView = (values.structuresView ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  }
  point.notes = (values.notes ?? "")
   .split("\n")
   .map((item) => item.trim())
   .filter(Boolean);
  point.tags = (values.tags ?? "")
   .split("\n")
   .map((tag) => tag.trim())
   .filter(Boolean);

  return point;
 },
};
