import type { JsonFieldValue } from "@/types/json";
import type { EditAdapter, EditFieldDefinition } from "./types";

function asEditableRecord(value: JsonFieldValue): { [key: string]: JsonFieldValue } {
 return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function fieldToString(value: JsonFieldValue, kind: EditFieldDefinition["kind"]) {
 if (kind === "string-list") {
  return Array.isArray(value)
   ? value.filter((item): item is string => typeof item === "string").join("\n")
   : "";
 }

 if (kind === "json") {
  return JSON.stringify(value ?? null, null, 2);
 }

 if (kind === "boolean") {
  return typeof value === "boolean" ? String(value) : "false";
 }

 return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function stringToFieldValue(
 value: string,
 kind: EditFieldDefinition["kind"],
 fallback: JsonFieldValue,
) {
 if (kind === "string-list") {
  return value
   .split("\n")
   .map((item) => item.trim())
   .filter(Boolean);
 }

 if (kind === "number") {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
 }

 if (kind === "boolean") {
  return value === "true";
 }

 if (kind === "json") {
  return JSON.parse(value);
 }

 return value;
}

export function createEditAdapter(fields: EditFieldDefinition[]): EditAdapter {
 return {
  fields,
  toValues: (value) => {
   const record = asEditableRecord(value);

   return Object.fromEntries(
    fields.map((field) => [field.key, fieldToString(record[field.key], field.kind)]),
   );
  },
  toNode: (original, values) => {
   const output = asEditableRecord(original);

   for (const field of fields) {
    const value = values[field.key] ?? "";
    output[field.key] = stringToFieldValue(value, field.kind, output[field.key]);
   }

   return output;
  },
 };
}
