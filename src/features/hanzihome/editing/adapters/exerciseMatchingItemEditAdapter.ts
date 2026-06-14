import type { EditAdapter } from "./types";

function asRecord(value: unknown): { [key: string]: unknown } {
 return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function stringValue(record: { [key: string]: unknown }, key: string) {
 const value = record[key];
 return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export const exerciseMatchingItemEditAdapter: EditAdapter = {
 fields: [
  { key: "text", label: "Nội dung", kind: "textarea", required: true },
  { key: "pinyin", label: "Pinyin", kind: "textarea" },
  { key: "vi", label: "Nghĩa tiếng Việt", kind: "textarea" },
  { key: "meaning_vi", label: "Nghĩa khác", kind: "textarea" },
  { key: "label", label: "Nhãn" },
 ],
 toValues: (value) => {
  if (typeof value === "string" || typeof value === "number") {
   return {
    text: String(value),
    pinyin: "",
    vi: "",
    meaning_vi: "",
    label: "",
   };
  }

  const item = asRecord(value);

  return {
   text:
    stringValue(item, "text") ||
    stringValue(item, "zh") ||
    stringValue(item, "value") ||
    stringValue(item, "prompt") ||
    stringValue(item, "answer"),
   pinyin: stringValue(item, "pinyin"),
   vi:
    stringValue(item, "vi") || stringValue(item, "translation_vi") || stringValue(item, "meaning"),
   meaning_vi: stringValue(item, "meaning_vi"),
   label: stringValue(item, "label"),
  };
 },
 toNode: (original, values) => {
  if (typeof original === "string" || typeof original === "number") {
   return values.text ?? "";
  }

  const item = asRecord(original);
  const textKey =
   "text" in item
    ? "text"
    : "zh" in item
      ? "zh"
      : "value" in item
        ? "value"
        : "prompt" in item
          ? "prompt"
          : "text";

  item[textKey] = values.text ?? "";
  item.pinyin = values.pinyin ?? "";
  item.vi = values.vi ?? "";
  item.meaning_vi = values.meaning_vi ?? "";
  item.label = values.label ?? "";

  return item;
 },
};
