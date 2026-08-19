import type { JsonFieldValue } from "@/types/json";
import type { EditAdapter } from "./types";

function asRecord(value: JsonFieldValue): { [key: string]: JsonFieldValue } {
 return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function stringValue(record: { [key: string]: JsonFieldValue }, key: string) {
 const value = record[key];
 return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function stringList(value: JsonFieldValue) {
 return Array.isArray(value)
  ? value.filter((item): item is string => typeof item === "string").join("\n")
  : "";
}

export const vocabEditAdapter: EditAdapter = {
 fields: [
  { key: "hanzi", label: "Chữ Hán", required: true },
  { key: "pinyin", label: "Pinyin" },
  { key: "meaning_vi", label: "Nghĩa tiếng Việt", kind: "textarea", required: true },
  { key: "meaning_en", label: "Nghĩa tiếng Anh", kind: "textarea" },
  { key: "hanviet", label: "Hán Việt" },
  { key: "category", label: "Nhóm từ vựng", required: true },
  { key: "level_tag", label: "Cấp độ" },
  { key: "pos_vi", label: "Từ loại tiếng Việt" },
  { key: "pos_zh", label: "Từ loại tiếng Trung" },
  { key: "tone", label: "Sắc thái / ngữ vực" },
  { key: "tags", label: "Tags", kind: "string-list" },
 ],
 toValues: (value) => {
  const item = asRecord(value);
  const meaning = asRecord(item.meaning);
  const pos = asRecord(item.pos);

  return {
   hanzi: stringValue(item, "hanzi"),
   pinyin: stringValue(item, "pinyin"),
   meaning_vi: stringValue(item, "meaning_vi") || stringValue(meaning, "meaning_vi"),
   meaning_en: stringValue(item, "meaning_en") || stringValue(meaning, "meaning_en"),
   hanviet: stringValue(meaning, "hanviet"),
   category: stringValue(item, "category") || "Từ vựng",
   level_tag: stringValue(item, "level_tag"),
   pos_vi: stringValue(pos, "raw_vi") || stringValue(pos, "normalized"),
   pos_zh: stringValue(pos, "raw_cn"),
   tone: stringValue(item, "tone"),
   tags: stringList(item.tags),
  };
 },
 toNode: (original, values) => {
  const item = asRecord(original);
  item.hanzi = values.hanzi ?? "";
  item.pinyin = values.pinyin ?? "";
  item.category = values.category ?? "Từ vựng";
  item.level_tag = values.level_tag ?? "unknown";
  item.tone = values.tone ?? "";
  item.tags = (values.tags ?? "")
   .split("\n")
   .map((tag) => tag.trim())
   .filter(Boolean);

  if ("meaning" in item) {
   const meaning = asRecord(item.meaning);
   meaning.meaning_vi = values.meaning_vi ?? "";
   meaning.meaning_en = values.meaning_en ?? "";
   meaning.hanviet = values.hanviet ?? "";
   item.meaning = meaning;
  } else {
   item.meaning_vi = values.meaning_vi ?? "";
   item.meaning_en = values.meaning_en ?? "";
  }

  if (item.pos && typeof item.pos === "object" && !Array.isArray(item.pos)) {
   item.pos = {
    ...asRecord(item.pos),
    raw_vi: values.pos_vi ?? "",
    raw_cn: values.pos_zh ?? "",
    normalized: values.pos_vi ?? "unknown",
   };
  } else {
   item.pos = values.pos_vi ?? "unknown";
  }

  return item;
 },
};
