import type { EditAdapter } from "./types";

function asRecord(value: unknown): { [key: string]: unknown } {
 return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function text(value: unknown) {
 return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export const exerciseAnswerKeyEditAdapter: EditAdapter = {
 fields: [
  { key: "question_id", label: "Question ID" },
  { key: "blank_id", label: "Blank ID" },
  { key: "answer", label: "Đáp án", kind: "textarea", required: true },
  { key: "sample_answer", label: "Đáp án mẫu", kind: "textarea" },
  { key: "explanation_vi", label: "Giải thích", kind: "textarea" },
 ],
 toValues: (value) => {
  const answer = asRecord(value);

  return {
   question_id: text(answer.question_id),
   blank_id: text(answer.blank_id),
   answer: text(answer.answer) || text(answer.value) || text(answer.text) || text(value),
   sample_answer: text(answer.sample_answer),
   explanation_vi: text(answer.explanation_vi),
  };
 },
 toNode: (original, values) => {
  if (
   typeof original === "string" ||
   typeof original === "number" ||
   typeof original === "boolean"
  ) {
   return values.answer ?? "";
  }

  const answer = asRecord(original);
  answer.question_id = values.question_id ?? "";
  answer.blank_id = values.blank_id ?? "";
  answer.answer = values.answer ?? "";
  answer.sample_answer = values.sample_answer ?? "";
  answer.explanation_vi = values.explanation_vi ?? "";
  return answer;
 },
};
