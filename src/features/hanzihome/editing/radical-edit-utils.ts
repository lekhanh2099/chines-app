import { z } from "zod";
import type { JsonObject } from "@/types/json";
import type { StaticRadicalData } from "@/features/hanzihome/types";

export type RadicalFormValues = {
 radical: string;
 nameVi: string;
 strokes: string;
 modernMeaning: string;
 historyMeaning: string;
 recognition: string;
 variantsText: string;
 relatedComponentsText: string;
 distinguishText: string;
 groupsText: string;
};

const radicalComponentSchema = z.object({
 form: z.string().trim().min(1),
 note: z.string(),
});

const radicalGroupSchema = z.object({
 name: z.string().trim().min(1),
 chars: z.array(z.string().trim().min(1)),
});

export const radicalColumnValuesSchema = z.strictObject({
 radical: z.string().trim().min(1, "Thiếu bộ thủ"),
 name_vi: z.string().nullable(),
 strokes: z.number().int().positive().nullable(),
 core_meaning: z.object({
  modern: z.string(),
  history: z.string(),
 }),
 recognition: z.string().nullable(),
 variants: z.array(radicalComponentSchema),
 related_components: z.array(radicalComponentSchema),
 distinguish: z.array(z.string()),
 groups: z.array(radicalGroupSchema),
});

export function isValidRadicalStrokeText(value: string) {
 return value === "" || /^[1-9]\d*$/.test(value);
}

export const radicalFormSchema = z.object({
 radical: z.string().trim().min(1, "Thiếu bộ thủ"),
 nameVi: z.string(),
 strokes: z.string().trim().refine(isValidRadicalStrokeText, "Số nét phải là số dương."),
 modernMeaning: z.string(),
 historyMeaning: z.string(),
 recognition: z.string(),
 variantsText: z.string(),
 relatedComponentsText: z.string(),
 distinguishText: z.string(),
 groupsText: z.string(),
});

function renderComponentLines(components: StaticRadicalData["relatedComponents"]) {
 return (components ?? []).map((component) => `${component.form} | ${component.note}`).join("\n");
}

function parseComponentLines(value: string) {
 return value
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
   const [form = "", ...noteParts] = line.split("|");
   return {
    form: form.trim(),
    note: noteParts.join("|").trim(),
   };
  })
  .filter((component) => component.form);
}

function renderGroups(groups: StaticRadicalData["groups"]) {
 return (groups ?? []).map((group) => `${group.name}: ${group.chars.join(" ")}`).join("\n");
}

function parseGroups(value: string) {
 return value
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
   const [name = "", charsText = ""] = line.split(":");
   return {
    name: name.trim(),
    chars: charsText
     .split(/[\s,，]+/)
     .map((char) => char.trim())
     .filter(Boolean),
   };
  })
  .filter((group) => group.name && group.chars.length > 0);
}

function renderStringList(values: StaticRadicalData["distinguish"]) {
 return (values ?? []).join("\n");
}

function parseStringList(value: string) {
 return value
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
}

export function valuesFromRadical(radical: StaticRadicalData): RadicalFormValues {
 return {
  radical: radical.radical,
  nameVi: radical.nameVi ?? "",
  strokes: radical.strokes ? String(radical.strokes) : "",
  modernMeaning: radical.coreMeaning.modern ?? "",
  historyMeaning: radical.coreMeaning.history ?? "",
  recognition: radical.recognition ?? "",
  variantsText: renderComponentLines(radical.variants),
  relatedComponentsText: renderComponentLines(radical.relatedComponents),
  distinguishText: renderStringList(radical.distinguish),
  groupsText: renderGroups(radical.groups),
 };
}

export function columnValuesFromForm(values: RadicalFormValues) {
 return {
  radical: values.radical.trim(),
  name_vi: values.nameVi.trim() || null,
  strokes: values.strokes.trim() ? Number(values.strokes.trim()) : null,
  core_meaning: {
   modern: values.modernMeaning.trim(),
   history: values.historyMeaning.trim(),
  },
  recognition: values.recognition.trim() || null,
  variants: parseComponentLines(values.variantsText),
  related_components: parseComponentLines(values.relatedComponentsText),
  distinguish: parseStringList(values.distinguishText),
  groups: parseGroups(values.groupsText),
 };
}

export function columnValuesFromRadical(radical: StaticRadicalData) {
 return {
  radical: radical.radical,
  name_vi: radical.nameVi ?? null,
  strokes: radical.strokes ?? null,
  core_meaning: {
   modern: radical.coreMeaning.modern ?? "",
   history: radical.coreMeaning.history ?? "",
  },
  recognition: radical.recognition ?? null,
  variants: radical.variants,
  related_components: radical.relatedComponents ?? [],
  distinguish: radical.distinguish,
  groups: radical.groups ?? [],
 };
}

export function changedFields(before: JsonObject, after: JsonObject): JsonObject {
 return Object.fromEntries(
  Object.entries(after).filter(
   ([key, value]) => JSON.stringify(before[key]) !== JSON.stringify(value),
  ),
 );
}
