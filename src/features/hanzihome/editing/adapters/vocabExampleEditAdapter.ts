import { createEditAdapter } from "./createEditAdapter";

export const vocabExampleEditAdapter = createEditAdapter([
 { key: "zh", label: "Câu tiếng Trung", kind: "textarea", required: true },
 { key: "pinyin", label: "Pinyin", kind: "textarea" },
 { key: "vi", label: "Nghĩa tiếng Việt", kind: "textarea" },
 { key: "note", label: "Ghi chú", kind: "textarea" },
 { key: "analysis_vi", label: "Phân tích", kind: "textarea" },
 { key: "grammar_refs", label: "Grammar refs", kind: "string-list" },
 { key: "vocab_refs", label: "Vocab refs", kind: "string-list" },
]);
