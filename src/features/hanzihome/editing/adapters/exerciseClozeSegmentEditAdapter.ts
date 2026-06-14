import type { EditAdapter } from "./types";

function asRecord(value: unknown): { [key: string]: unknown } {
 return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function text(value: unknown) {
 return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export const exerciseClozeSegmentEditAdapter: EditAdapter = {
 fields: [
  { key: "text", label: "Nội dung segment", kind: "textarea", required: true },
  { key: "blank_id", label: "Blank ID" },
 ],
 toValues: (value) => {
  const segment = asRecord(value);
  return {
   text: text(segment.text) || text(segment.zh) || text(value),
   blank_id: text(segment.blank_id),
  };
 },
 toNode: (original, values) => {
  if (typeof original === "string" || typeof original === "number") {
   return values.text ?? "";
  }

  const segment = asRecord(original);
  segment.text = values.text ?? "";
  if ("blank_id" in segment || Boolean(values.blank_id?.trim())) {
   segment.blank_id = values.blank_id ?? "";
  }
  return segment;
 },
};
