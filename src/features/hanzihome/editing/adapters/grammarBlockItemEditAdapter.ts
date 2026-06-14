import type { EditAdapter } from "./types";

function asRecord(value: unknown): { [key: string]: unknown } {
 return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function text(value: unknown) {
 return typeof value === "string" ? value : "";
}

export const grammarBlockItemEditAdapter: EditAdapter = {
 fields: [
  { key: "aspect", label: "Khía cạnh" },
  { key: "left_label", label: "Nhãn bên trái" },
  { key: "left_value", label: "Nội dung bên trái", kind: "textarea" },
  { key: "right_label", label: "Nhãn bên phải" },
  { key: "right_value", label: "Nội dung bên phải", kind: "textarea" },
  { key: "wrong", label: "Câu sai", kind: "textarea" },
  { key: "correct", label: "Câu đúng", kind: "textarea" },
  { key: "explanation_vi", label: "Giải thích", kind: "textarea" },
 ],
 toValues: (value) => {
  const item = asRecord(value);
  const left = asRecord(item.left);
  const right = asRecord(item.right);

  return {
   aspect: text(item.aspect),
   left_label: text(left.label),
   left_value: text(left.value),
   right_label: text(right.label),
   right_value: text(right.value),
   wrong: text(item.wrong),
   correct: text(item.correct),
   explanation_vi: text(item.explanation_vi),
  };
 },
 toNode: (original, values) => {
  const item = asRecord(original);
  const hasComparison =
   Boolean(values.left_label?.trim()) ||
   Boolean(values.left_value?.trim()) ||
   Boolean(values.right_label?.trim()) ||
   Boolean(values.right_value?.trim());

  item.aspect = values.aspect ?? "";
  item.wrong = values.wrong ?? "";
  item.correct = values.correct ?? "";
  item.explanation_vi = values.explanation_vi ?? "";

  if (hasComparison) {
   item.left = {
    ...asRecord(item.left),
    label: values.left_label ?? "",
    value: values.left_value ?? "",
   };
   item.right = {
    ...asRecord(item.right),
    label: values.right_label ?? "",
    value: values.right_value ?? "",
   };
  }

  return item;
 },
};
