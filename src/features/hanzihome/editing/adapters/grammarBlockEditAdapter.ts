import { createEditAdapter } from "./createEditAdapter";

export const grammarBlockEditAdapter = createEditAdapter([
 { key: "title", label: "Tiêu đề block", required: true },
 { key: "content_vi", label: "Nội dung", kind: "textarea" },
 { key: "pattern", label: "Công thức", kind: "textarea" },
 { key: "meaning_vi", label: "Ý nghĩa", kind: "textarea" },
 { key: "notes_vi", label: "Ghi chú", kind: "string-list" },
]);
