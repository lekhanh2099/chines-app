import { createEditAdapter } from "./createEditAdapter";

export const textParagraphEditAdapter = createEditAdapter([
 { key: "zh", label: "Tiếng Trung", kind: "textarea", required: true },
 { key: "pinyin", label: "Pinyin", kind: "textarea" },
 { key: "vi", label: "Nghĩa tiếng Việt", kind: "textarea" },
 { key: "vocab_refs", label: "Vocab refs", kind: "string-list" },
 { key: "grammar_refs", label: "Grammar refs", kind: "string-list" },
]);
