import { createEditAdapter } from "./createEditAdapter";

export const sectionEditAdapter = createEditAdapter([
 { key: "title", label: "Tiêu đề tiếng Trung", required: true },
 { key: "title_vi", label: "Tiêu đề tiếng Việt" },
 { key: "empty_reason_vi", label: "Lý do để trống", kind: "textarea" },
]);
