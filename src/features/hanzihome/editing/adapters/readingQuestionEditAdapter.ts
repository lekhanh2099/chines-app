import { createEditAdapter } from "./createEditAdapter";

export const readingQuestionEditAdapter = createEditAdapter([
 { key: "question", label: "Câu hỏi", kind: "textarea", required: true },
 { key: "prompt", label: "Đề bài", kind: "textarea" },
 { key: "answer", label: "Đáp án", kind: "textarea" },
 { key: "explanation_vi", label: "Giải thích", kind: "textarea" },
]);
