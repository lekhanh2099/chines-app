import type { JsonFieldValue } from "@/types/json";
import type { JsonObject } from "@/types/json";
import type { EditAdapter, EditFieldDefinition } from "./types";

const fields: EditFieldDefinition[] = [
 {
  key: "promptZh",
  label: "Câu hỏi tiếng Trung",
  kind: "textarea",
  description: "TTS sẽ đọc nội dung nghe trước, rồi mới đọc câu hỏi này.",
 },
 {
  key: "explanationVi",
  label: "Giải thích tiếng Việt",
  kind: "textarea",
 },
 { key: "transcript", label: "录音文本", kind: "json" },
 { key: "options", label: "Các lựa chọn", kind: "json" },
 { key: "answer", label: "Đáp án", kind: "json" },
 { key: "metadata", label: "Metadata", kind: "json" },
];

function asRecord(value: JsonFieldValue): JsonObject {
 return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function jsonField(record: JsonObject, key: string) {
 return JSON.stringify(record[key] ?? null, null, 2);
}

export const listeningItemEditAdapter: EditAdapter = {
 fields,
 toValues: (value) => {
  const record = asRecord(value);
  return {
   promptZh: typeof record.promptZh === "string" ? record.promptZh : "",
   explanationVi: typeof record.explanationVi === "string" ? record.explanationVi : "",
   transcript: jsonField(record, "transcript"),
   options: jsonField(record, "options"),
   answer: jsonField(record, "answer"),
   metadata: jsonField(record, "metadata"),
  };
 },
 toNode: (original, values) => {
  const output = asRecord(original);
  const promptZh = values.promptZh?.trim();
  const explanationVi = values.explanationVi?.trim();

  if (promptZh) output.promptZh = promptZh;
  else delete output.promptZh;

  if (explanationVi) output.explanationVi = explanationVi;
  else delete output.explanationVi;

  output.transcript = JSON.parse(values.transcript ?? "null");
  output.options = JSON.parse(values.options ?? "null");
  output.answer = JSON.parse(values.answer ?? "null");
  output.metadata = JSON.parse(values.metadata ?? "null");
  return output;
 },
};
