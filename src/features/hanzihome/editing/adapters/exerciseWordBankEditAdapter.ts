import type { EditAdapter } from "./types";

export const exerciseWordBankEditAdapter: EditAdapter = {
 fields: [{ key: "items", label: "Từ cho sẵn", kind: "string-list", required: true }],
 toValues: (value) => ({
  items: Array.isArray(value)
   ? value.filter((item): item is string => typeof item === "string").join("\n")
   : "",
 }),
 toNode: (_original, values) =>
  (values.items ?? "")
   .split("\n")
   .map((item) => item.trim())
   .filter(Boolean),
};
