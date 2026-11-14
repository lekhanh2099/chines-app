import { createEditAdapter } from "./createEditAdapter";

export const exerciseDialogueLineEditAdapter = createEditAdapter([
 { key: "speaker", label: "Người nói" },
 { key: "text", label: "Nội dung", kind: "textarea", required: true },
 { key: "zh", label: "Tiếng Trung", kind: "textarea" },
 { key: "vi", label: "Nghĩa tiếng Việt", kind: "textarea" },
]);
