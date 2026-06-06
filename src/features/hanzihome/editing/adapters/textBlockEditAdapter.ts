import { createEditAdapter } from "./createEditAdapter";

export const textBlockEditAdapter = createEditAdapter([
 { key: "title", label: "Tiêu đề tiếng Trung", required: true },
 { key: "title_vi", label: "Tiêu đề tiếng Việt" },
]);
