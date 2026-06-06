import type { EditAdapter } from "./types";

function asRecord(value: unknown): { [key: string]: unknown } {
 return value && typeof value === "object" && !Array.isArray(value)
  ? { ...value }
  : {};
}

function editableText(value: unknown) {
 if (Array.isArray(value)) {
  return value
   .filter((item): item is string => typeof item === "string")
   .join("\n");
 }

 return typeof value === "string" || typeof value === "number"
  ? String(value)
  : "";
}

function preserveTextShape(original: unknown, value: string) {
 if (Array.isArray(original)) {
  return value
   .split("\n")
   .map((item) => item.trim())
   .filter(Boolean);
 }

 return value;
}

export const exerciseQuestionEditAdapter: EditAdapter = {
 fields: [
  { key: "prompt", label: "Đề bài", kind: "textarea", required: true },
  { key: "choices", label: "Lựa chọn", kind: "string-list" },
  { key: "answer", label: "Đáp án", kind: "textarea" },
  { key: "acceptable_answers", label: "Đáp án chấp nhận", kind: "string-list" },
  { key: "sample_answers", label: "Đáp án mẫu", kind: "string-list" },
  { key: "explanation_vi", label: "Giải thích", kind: "textarea" },
 ],
 toValues: (value) => {
  const question = asRecord(value);

  return {
   prompt: editableText(question.prompt),
   choices: editableText(question.choices),
   answer: editableText(question.answer),
   acceptable_answers: editableText(question.acceptable_answers),
   sample_answers: editableText(question.sample_answers),
   explanation_vi: editableText(question.explanation_vi),
  };
 },
 toNode: (original, values) => {
  const question = asRecord(original);

  for (const key of [
   "prompt",
   "choices",
   "answer",
   "acceptable_answers",
   "sample_answers",
   "explanation_vi",
  ]) {
   if (key in question || Boolean(values[key]?.trim())) {
    question[key] = preserveTextShape(question[key], values[key] ?? "");
   }
  }

  return question;
 },
};
