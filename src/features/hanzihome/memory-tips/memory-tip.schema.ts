import { z } from "zod";

export const memoryTipTypeSchema = z.enum([
  "grammar",
  "vocab",
  "formula",
  "custom",
]);

export const memoryTipSourceTypeSchema = z.enum([
  "grammar",
  "vocab",
  "lesson",
  "custom",
  "system",
]);

export const memoryTipScopeSchema = z.enum(["system", "user"]);

export const memoryTipSchema = z.object({
  id: z.string(),
  ownerId: z.string().nullable().optional(),
  scope: memoryTipScopeSchema,
  tipType: memoryTipTypeSchema,
  title: z.string(),
  body: z.string(),
  formula: z.string().nullable().optional(),
  exampleZh: z.string().nullable().optional(),
  examplePinyin: z.string().nullable().optional(),
  exampleVi: z.string().nullable().optional(),
  sourceType: memoryTipSourceTypeSchema,
  sourceLessonId: z.string().nullable().optional(),
  sourceItemId: z.string().nullable().optional(),
  sourceLabel: z.string().nullable().optional(),
  tags: z.array(z.string()),
  weight: z.number(),
  isPinned: z.boolean(),
  isArchived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createMemoryTipPayloadSchema = z.object({
  tipType: memoryTipTypeSchema.default("custom"),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  formula: z.string().trim().optional(),
  exampleZh: z.string().trim().optional(),
  examplePinyin: z.string().trim().optional(),
  exampleVi: z.string().trim().optional(),
  sourceType: memoryTipSourceTypeSchema.default("custom"),
  sourceLessonId: z.string().trim().optional(),
  sourceItemId: z.string().trim().optional(),
  sourceLabel: z.string().trim().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  weight: z.number().int().min(1).max(10).default(1),
  isPinned: z.boolean().default(false),
});

export const updateMemoryTipPayloadSchema =
  createMemoryTipPayloadSchema.partial().extend({
    isArchived: z.boolean().optional(),
  });

export type MemoryTip = z.infer<typeof memoryTipSchema>;
export type MemoryTipType = z.infer<typeof memoryTipTypeSchema>;
export type MemoryTipSourceType = z.infer<typeof memoryTipSourceTypeSchema>;
export type CreateMemoryTipPayload = z.input<
  typeof createMemoryTipPayloadSchema
>;
export type UpdateMemoryTipPayload = z.input<
  typeof updateMemoryTipPayloadSchema
>;
