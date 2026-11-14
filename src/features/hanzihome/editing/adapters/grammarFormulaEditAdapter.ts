import { createEditAdapter } from "./createEditAdapter";

export const grammarFormulaEditAdapter = createEditAdapter([
 { key: "label", label: "Nhãn" },
 { key: "pattern", label: "Công thức", kind: "textarea", required: true },
]);
