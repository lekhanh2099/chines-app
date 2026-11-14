import { createEditAdapter } from "./createEditAdapter";

export const properNounEditAdapter = createEditAdapter([
 { key: "hanzi", label: "Tên riêng", required: true },
 { key: "pinyin", label: "Pinyin" },
 { key: "meaning_vi", label: "Nghĩa tiếng Việt", kind: "textarea" },
 { key: "meaning_en", label: "Nghĩa tiếng Anh", kind: "textarea" },
]);
