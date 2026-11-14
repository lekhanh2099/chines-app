import type { ComponentProps } from "react";
import { z } from "zod";

import type { Checkbox } from "@/components/ui/forms/checkbox";
import type { VocabularyItem } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { JsonObjectSchema, type JsonObject } from "@/types/json";

import { asRecord, stringValue } from "../lesson-overview/utils";

type EditableItemMap = {
 lesson: VocabularyItem;
 deep: HanziHomeVocabItem;
};
export type EditableItem = EditableItemMap[keyof EditableItemMap];
export const ManagerTabSchema = z.enum(["vocab", "sections", "examples"]);
export type ManagerTab = z.infer<typeof ManagerTabSchema>;
export const ScopeSchema = z.enum(["lesson", "book", "course"]);
export type Scope = z.infer<typeof ScopeSchema>;
export const SelectionModeSchema = z.enum(["ids", "filter"]);
export type SelectionMode = z.infer<typeof SelectionModeSchema>;
export const BulkOperationSchema = z.enum(["soft_delete", "restore", "purge"]);
export type BulkOperation = z.infer<typeof BulkOperationSchema>;
export type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
export type CheckboxState = Parameters<
 NonNullable<ComponentProps<typeof Checkbox>["onCheckedChange"]>
>[0];
export type CoreRow = {
 id: string;
 hanzi: string;
 pinyin: string;
 meaningVi: string;
 pos: string;
 category: string;
};

export const PAGE_SIZE = 25;
export const SECTION_FILTERS = [
 ["all", "Tất cả loại"],
 ["meaning", "Nghĩa"],
 ["word_formation", "Logic / cấu tạo"],
 ["comparison", "So sánh"],
 ["collocations", "Kết hợp thường gặp"],
 ["warnings", "Lưu ý lỗi sai"],
 ["culture", "Văn hóa và ngữ cảnh"],
 ["notes", "Ghi chú"],
 ["custom", "Khác"],
];

export function coreRow<TItem extends EditableItem>(
 item: TItem,
 getId: (item: TItem) => string,
): CoreRow {
 const record = asRecord(item);
 const meaning = asRecord(record.meaning);
 const pos = asRecord(record.pos);
 return {
  id: getId(item),
  hanzi: item.hanzi,
  pinyin: item.pinyin,
  meaningVi: stringValue(meaning, "meaning_vi") || stringValue(record, "meaning_vi"),
  // Lesson-shaped items carry the normalized POS as a plain string.
  pos:
   typeof record.pos === "string"
    ? record.pos
    : stringValue(pos, "raw_vi") || stringValue(pos, "normalized"),
  category: stringValue(record, "category") || "Từ vựng",
 };
}

// JsonObjectSchema.parse returns a new object, so the edited record itself is
// the save payload (mutating it never reached the cloned item).
export function applyCore(item: EditableItem, row: CoreRow): JsonObject {
 const record = JsonObjectSchema.parse(structuredClone(item));
 const meaning = asRecord(record.meaning);
 const pos = asRecord(record.pos);
 record.hanzi = row.hanzi.trim();
 record.pinyin = row.pinyin.trim();
 record.category = row.category.trim() || "Từ vựng";
 record.meaning = {
  ...meaning,
  meaning_vi: row.meaningVi.trim(),
  short_definition_vi: row.meaningVi.trim(),
 };
 // Lesson-shaped items keep the meaning flat; mapVocabItem prefers that field,
 // so leaving it stale would silently drop the edit.
 if (typeof record.meaning_vi === "string") record.meaning_vi = row.meaningVi.trim();
 record.pos = { ...pos, raw_vi: row.pos.trim(), normalized: row.pos.trim() || "unknown" };
 return record;
}

/**
 * Collects the deep (normalized) vocab items and indexes their detail sections
 * and examples by child id, so manager rows can resolve their local edit path.
 */
export function collectVocabChildren<TItem extends EditableItem>(items: TItem[]) {
 const deepItems = items.filter((item): item is TItem & HanziHomeVocabItem => "runtimeId" in item);
 const sections = deepItems.flatMap((item, itemIndex) =>
  (item.detailSections ?? []).map((section, sectionIndex) => ({
   item,
   itemIndex,
   section,
   sectionIndex,
  })),
 );
 const examples = deepItems.flatMap((item, itemIndex) =>
  item.examples.map((example, exampleIndex) => ({ item, itemIndex, example, exampleIndex })),
 );
 const localChildren = new Map(
  [...sections, ...examples].map((entry) => {
   const child = "section" in entry ? entry.section : entry.example;
   return [child.id, entry];
  }),
 );
 return { deepItems, localChildren };
}

export function sectionKeysForFilter(tab: ManagerTab, sectionFilter: string) {
 return tab !== "sections" || sectionFilter === "all"
  ? undefined
  : sectionFilter === "custom"
    ? ["custom:"]
    : [sectionFilter];
}
