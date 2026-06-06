import { createEditAdapter } from "./createEditAdapter";

export const readingEditAdapter = createEditAdapter([
 { key: "title", label: "Tiêu đề", required: true },
 { key: "title_vi", label: "Tiêu đề tiếng Việt" },
 { key: "text", label: "Nội dung", kind: "textarea" },
 { key: "pinyin", label: "Pinyin", kind: "textarea" },
 { key: "vi", label: "Nghĩa tiếng Việt", kind: "textarea" },
]);
