import { createEditAdapter } from "./createEditAdapter";

export const vocabDetailSectionEditAdapter = createEditAdapter([
 { key: "title", label: "Tiêu đề" },
 { key: "lines", label: "Các dòng nội dung", kind: "string-list" },
 { key: "title_vi", label: "Tiêu đề tiếng Việt" },
 { key: "zh", label: "Nội dung tiếng Trung", kind: "textarea" },
 { key: "pinyin", label: "Pinyin", kind: "textarea" },
 { key: "vi", label: "Nghĩa tiếng Việt", kind: "textarea" },
 { key: "meaning_vi", label: "Nghĩa / giải thích", kind: "textarea" },
 { key: "pattern", label: "Mẫu / kết hợp" },
 { key: "note_vi", label: "Ghi chú", kind: "textarea" },
]);
