import { JsonValueSchema, type JsonFieldValue } from "@/types/json";
import { z } from "zod";

import { memoryTipSchema, type MemoryTip } from "./memory-tip.schema";

export const memoryTipRowSchema = z.object({
 id: z.string(),
 owner_id: z.string().nullable(),
 scope: z.enum(["system", "user"]),
 tip_type: z.enum(["grammar", "vocab", "formula", "custom"]),
 title: z.string(),
 body: z.string(),
 formula: z.string().nullable(),
 example_zh: z.string().nullable(),
 example_pinyin: z.string().nullable(),
 example_vi: z.string().nullable(),
 source_type: z.enum(["grammar", "vocab", "lesson", "custom", "system"]),
 source_lesson_id: z.string().nullable(),
 source_item_id: z.string().nullable(),
 source_label: z.string().nullable(),
 tags: z.array(z.string()),
 weight: z.number(),
 is_pinned: z.boolean(),
 is_archived: z.boolean(),
 created_at: z.string(),
 updated_at: z.string(),
});

export function mapMemoryTipRow(row: JsonFieldValue): MemoryTip {
 const parsed = memoryTipRowSchema.parse(row);

 return memoryTipSchema.parse({
  id: parsed.id,
  ownerId: parsed.owner_id,
  scope: parsed.scope,
  tipType: parsed.tip_type,
  title: parsed.title,
  body: parsed.body,
  formula: parsed.formula,
  exampleZh: parsed.example_zh,
  examplePinyin: parsed.example_pinyin,
  exampleVi: parsed.example_vi,
  sourceType: parsed.source_type,
  sourceLessonId: parsed.source_lesson_id,
  sourceItemId: parsed.source_item_id,
  sourceLabel: parsed.source_label,
  tags: parsed.tags,
  weight: parsed.weight,
  isPinned: parsed.is_pinned,
  isArchived: parsed.is_archived,
  createdAt: parsed.created_at,
  updatedAt: parsed.updated_at,
 });
}

export function mapMemoryTipRows(
 rows: z.infer<z.ZodNullable<z.ZodArray<typeof JsonValueSchema>>>,
): MemoryTip[] {
 return (rows ?? []).map(mapMemoryTipRow);
}
