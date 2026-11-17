import { expect, it } from "vitest";
import type { StaticRadicalData } from "@/features/hanzihome/types";
import {
 changedFields,
 columnValuesFromForm,
 columnValuesFromRadical,
 radicalFormSchema,
 valuesFromRadical,
} from "./radical-edit-utils";

const radical: StaticRadicalData = {
 id: "water",
 index: 85,
 radical: "水",
 nameVi: "Thủy",
 strokes: 4,
 coreMeaning: { modern: "Nước", history: "Dòng nước" },
 variants: [{ form: "氵", note: "Ba chấm | bên trái" }],
 relatedComponents: [{ form: "氺", note: "Phía dưới" }],
 recognition: "Nước",
 distinguish: ["冫 có hai chấm"],
 groups: [{ name: "Nước", chars: ["河", "海"] }],
};

it("round trips the existing form representation without manufacturing changes", () => {
 const values = valuesFromRadical(radical);
 expect(values.variantsText).toBe("氵 | Ba chấm | bên trái");
 expect(values.groupsText).toBe("Nước: 河 海");
 expect(columnValuesFromForm(values)).toEqual(columnValuesFromRadical(radical));
 expect(changedFields(columnValuesFromRadical(radical), columnValuesFromForm(values))).toEqual({});
});

it("keeps empty optional columns and parses actual form delimiters", () => {
 const values = valuesFromRadical(radical);
 const after = columnValuesFromForm({
  ...values,
  nameVi: " ",
  strokes: "",
  recognition: " ",
  variantsText: "\n 氵 | nước | bên trái \n | bỏ dòng thiếu form",
  groupsText: " Nước: 河，海, 洋 \n Không có chữ: \n",
 });
 expect(changedFields(columnValuesFromRadical(radical), after)).toEqual({
  name_vi: null,
  strokes: null,
  recognition: null,
  variants: [{ form: "氵", note: "nước | bên trái" }],
  groups: [{ name: "Nước", chars: ["河", "海", "洋"] }],
 });
});

it("rejects non-positive and fractional strokes at the form input boundary", () => {
 const values = valuesFromRadical(radical);
 for (const strokes of ["0", "-1", "1.5", "abc"]) {
  expect(radicalFormSchema.safeParse({ ...values, strokes }).success).toBe(false);
 }
 expect(radicalFormSchema.safeParse({ ...values, strokes: "" }).success).toBe(true);
 expect(radicalFormSchema.safeParse({ ...values, strokes: " 12 " }).success).toBe(true);
});
