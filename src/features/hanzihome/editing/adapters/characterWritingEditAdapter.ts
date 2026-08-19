import { createEditAdapter } from "./createEditAdapter";

export const characterWritingEditAdapter = createEditAdapter([
 { key: "hanzi", label: "Chữ Hán", required: true },
 { key: "pinyin", label: "Pinyin" },
 { key: "radical", label: "Bộ thủ" },
 { key: "note_vi", label: "Ghi chú", kind: "textarea" },
]);
