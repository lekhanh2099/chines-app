import { createEditAdapter } from "./createEditAdapter";

export const exerciseMetadataEditAdapter = createEditAdapter([
 { key: "title", label: "Tiêu đề", required: true },
 { key: "title_vi", label: "Tiêu đề tiếng Việt" },
 { key: "variant", label: "Variant" },
 { key: "difficulty", label: "Độ khó" },
 { key: "skill_focus", label: "Kỹ năng", kind: "string-list" },
]);
