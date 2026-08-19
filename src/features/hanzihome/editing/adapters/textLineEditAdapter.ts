import { createEditAdapter } from "./createEditAdapter";

export const textLineEditAdapter = createEditAdapter([
 { key: "speaker", label: "Người nói" },
 { key: "zh", label: "Tiếng Trung", kind: "textarea", required: true },
 { key: "pinyin", label: "Pinyin", kind: "textarea" },
 { key: "vi", label: "Nghĩa tiếng Việt", kind: "textarea" },
 { key: "notes", label: "Ghi chú", kind: "string-list" },
 { key: "vocab_refs", label: "Vocab refs", kind: "string-list" },
 { key: "grammar_refs", label: "Grammar refs", kind: "string-list" },
]);
