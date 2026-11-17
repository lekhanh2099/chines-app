import { z } from "zod";

const optionalTextSchema = z
 .string()
 .nullish()
 .transform((value) => value ?? "");

export const radicalRowSchema = z.object({
 id: z.string(),
 radical_index: z.number().int().positive(),
 radical: z.string(),
 name_vi: z.string().nullable().default(null),
 strokes: z.number().int().positive().nullable().default(null),
 core_meaning: z.object({ modern: z.string().optional(), history: z.string().optional() }),
 recognition: z.string().nullable().default(null),
 variants: z.array(z.object({ form: z.string(), note: optionalTextSchema })),
 related_components: z.array(z.object({ form: z.string(), note: optionalTextSchema })),
 distinguish: z.array(z.string()),
 groups: z.array(z.object({ name: z.string(), chars: z.array(z.string()) })),
 updated_at: z.string(),
});

export const vocabCoreRowSchema = z.object({
 id: z.string(),
 word_id: z.string().nullable(),
 lesson_id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
 item_order: z.number().int().positive(),
 word: z.string(),
 pinyin: z.string(),
 han_viet: z.string(),
 meaning: z.string(),
 meaning_en: z.string().nullable().default(null),
 category: z.string(),
 level: z.string().nullable(),
 pos_vi: z.string().nullable(),
 pos_zh: z.string().nullable(),
 tone: z.string().nullable().default(null),
 tags: z.array(z.string()).default([]),
 updated_at: z.string(),
});

export type RadicalRow = z.output<typeof radicalRowSchema>;
