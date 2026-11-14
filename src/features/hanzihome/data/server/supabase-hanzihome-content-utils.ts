import { JsonObjectSchema, type JsonValue } from "@/types/json";
import "server-only";

import { z } from "zod";

import { SectionSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import {
 ImportanceLevelSchema,
 PartOfSpeechSchema,
} from "@/features/hanzihome/schemas/vocab.schema";
import type { HanziHomeLesson, StaticRadicalData } from "@/features/hanzihome/types";
import { lessonSectionRowSchema, type RadicalRow } from "./supabase-content-row.schemas";

export function groupBy<T, K>(items: T[], getKey: (item: T) => K) {
 const grouped = new Map<K, T[]>();

 for (const item of items) {
  const key = getKey(item);
  const group = grouped.get(key);

  if (group) {
   group.push(item);
  } else {
   grouped.set(key, [item]);
  }
 }

 return grouped;
}

export function countFromRelation(value: Array<{ count: number }>) {
 return value[0]?.count ?? 0;
}

export function normalizeText(value: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>) {
 return value?.trim() ?? "";
}

export function isMissingRequiredText(value: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>) {
 return normalizeText(value).length === 0;
}

export function normalizePos(value: z.infer<z.ZodNullable<z.ZodString>>) {
 const normalized = value?.trim().toLowerCase().replaceAll(" ", "_") ?? "unknown";
 const parsed = PartOfSpeechSchema.safeParse(normalized);
 return parsed.success ? parsed.data : "unknown";
}

export function normalizeLevel(value: z.infer<z.ZodNullable<z.ZodString>>) {
 const parsed = ImportanceLevelSchema.safeParse(value ?? "unknown");
 return parsed.success ? parsed.data : "unknown";
}

export function radicalRowToViewModel(row: RadicalRow): StaticRadicalData {
 return {
  id: row.id,
  index: row.radical_index,
  radical: row.radical,
  nameVi: row.name_vi ?? undefined,
  strokes: row.strokes,
  coreMeaning: row.core_meaning,
  recognition: row.recognition ?? undefined,
  variants: row.variants,
  relatedComponents: row.related_components,
  distinguish: row.distinguish,
  groups: row.groups,
  editMeta: {
   entityType: "radical",
   entityId: row.id,
   dbId: row.id,
   updatedAt: row.updated_at,
   order: row.radical_index,
   orderField: "radical_index",
  },
 };
}

function removeDeletedNestedNodes(value: JsonValue): JsonValue {
 if (Array.isArray(value)) {
  return value
   .filter((item): item is JsonValue => item !== undefined)
   .filter(
    (item) =>
     !item ||
     typeof item !== "object" ||
     Array.isArray(item) ||
     !JsonObjectSchema.parse(item).deleted_at,
   )
   .map(removeDeletedNestedNodes);
 }
 if (!value || typeof value !== "object") return value;
 const parsedValue = JsonObjectSchema.parse(value);
 return Object.fromEntries(
  Object.entries(parsedValue).map(([key, item]) => [
   key,
   item === undefined ? undefined : removeDeletedNestedNodes(item),
  ]),
 );
}

export function lessonSectionRowToSection(row: z.infer<typeof lessonSectionRowSchema>): Section {
 const payload = removeDeletedNestedNodes(row.payload);
 if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
  throw new Error(`HanziHome section ${row.id} payload is not an object`);
 }
 return SectionSchema.parse({
  ...payload,
  id: row.source_section_id || row.section_key,
  order: row.section_order,
  title: row.title,
  title_vi: row.title_vi,
 });
}

export function matchesTextQuery(values: string[], query: string) {
 const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
 return (
  !normalizedQuery ||
  values.some((value) => value.toLocaleLowerCase("vi-VN").includes(normalizedQuery))
 );
}

export function buildMeta(lessons: HanziHomeLesson[], radicals: StaticRadicalData[] = []) {
 return {
  app: "hanzihome",
  dataset: "supabase",
  version: "2",
  generatedAt: "",
  sourceFiles: [],
  counts: {
   lessons: lessons.length,
   vocab: lessons.reduce((sum, lesson) => sum + (lesson.vocabCount ?? lesson.vocab.length), 0),
   grammarPoints: lessons.reduce(
    (sum, lesson) => sum + (lesson.grammarCount ?? lesson.grammar.length),
    0,
   ),
   radicals: radicals.length,
   flashcards: 0,
  },
  schemaNote: "Runtime content is loaded from normalized Supabase tables.",
 };
}

export function entityLessonId(entityId: string) {
 return entityId.includes("__") ? entityId.slice(0, entityId.indexOf("__")) : "";
}
