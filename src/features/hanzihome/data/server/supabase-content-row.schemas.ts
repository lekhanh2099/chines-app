import { z } from "zod";

const countRelationSchema = z.array(z.object({ count: z.number().int().nonnegative() }));
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

export const courseRowSchema = z.object({
 id: z.string(),
 slug: z.string(),
 title: z.string(),
 subtitle: z.string().nullable(),
 type: z.string(),
 course_order: z.number().int(),
 updated_at: z.string(),
});

export const bookRowSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 title: z.string(),
 short_title: z.string().nullable(),
 book_order: z.number().int(),
 updated_at: z.string(),
});

export const catalogStatsRowSchema = z.object({
 course_id: z.string(),
 book_count: z.number().int().nonnegative(),
 lesson_count: z.number().int().nonnegative(),
 vocab_count: z.number().int().nonnegative(),
 grammar_count: z.number().int().nonnegative(),
 fallback_lesson_id: z.string().nullable(),
 last_lesson_id: z.string().nullable(),
});

const relatedCourseSchema = z
 .union([courseRowSchema, z.array(courseRowSchema)])
 .transform((value) => (Array.isArray(value) ? value[0] : value));
const relatedBookSchema = z
 .union([bookRowSchema, z.array(bookRowSchema)])
 .transform((value) => (Array.isArray(value) ? value[0] : value));

export const lessonSummaryRowSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
 lesson_number: z.number().int().positive(),
 lesson_order: z.number().int().positive(),
 title_zh: z.string(),
 title_pinyin: z.string().nullable().default(null),
 title_vi: z.string().nullable().default(null),
 title_en: z.string().nullable().default(null),
 tags: z.array(z.string()).default([]),
 source_file: z.string().nullable(),
 updated_at: z.string(),
 course: relatedCourseSchema,
 book: relatedBookSchema,
 vocab_count: countRelationSchema,
 grammar_count: countRelationSchema,
});

export const lessonTextRowSchema = z.object({
 id: z.string(),
 lesson_id: z.string(),
 text_key: z.string(),
 title: z.string().nullable().default(null),
 content: z.string(),
 content_format: z.string(),
 updated_at: z.string(),
});

export const lessonSectionRowSchema = z.object({
 id: z.uuid(),
 lesson_id: z.string(),
 source_section_id: z.string(),
 section_key: z.string(),
 section_type: z.string(),
 title: z.string(),
 title_vi: z.string(),
 section_order: z.number().int().positive(),
 payload: z.json(),
 source_file: z.string().nullable(),
 updated_at: z.string(),
});

const vocabExampleRowSchema = z.object({
 id: z.string(),
 vocab_item_id: z.string(),
 example_order: z.number().int().positive(),
 zh: z.string(),
 pinyin: z.string().nullable(),
 vi: z.string().nullable(),
 note: z.string().nullable(),
 updated_at: z.string(),
});

const vocabDetailRowSchema = z.object({
 id: z.string(),
 vocab_item_id: z.string(),
 section_key: z.string(),
 title: z.string(),
 lines: z.array(z.string()),
 section_order: z.number().int().positive(),
 updated_at: z.string(),
});

export const vocabCoreRowSchema = z.object({
 id: z.string(),
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

export const vocabRowSchema = vocabCoreRowSchema.extend({
 examples: z.array(vocabExampleRowSchema).default([]),
 details: z.array(vocabDetailRowSchema).default([]),
});

const grammarExampleRowSchema = z.object({
 id: z.string(),
 grammar_point_id: z.string(),
 example_order: z.number().int().positive(),
 zh: z.string(),
 pinyin: z.string().nullable(),
 vi: z.string().nullable(),
 note: z.string().nullable(),
 updated_at: z.string(),
});

const grammarDetailRowSchema = z.object({
 id: z.string(),
 grammar_point_id: z.string(),
 section_key: z.string(),
 title: z.string(),
 lines: z.array(z.string()),
 section_order: z.number().int().positive(),
 updated_at: z.string(),
});

export const grammarCoreRowSchema = z.object({
 id: z.string(),
 lesson_id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
 point_order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().nullable().default(null),
 clean_title: z.string(),
 level: z.string().nullable().default(null),
 core: z.string(),
 content_md: z.string().nullable().default(null),
 structures_view: z.array(z.string()),
 notes: z.array(z.string()),
 tags: z.array(z.string()).default([]),
 updated_at: z.string(),
});

export const grammarRowSchema = grammarCoreRowSchema.extend({
 examples: z.array(grammarExampleRowSchema).default([]),
 details: z.array(grammarDetailRowSchema).default([]),
});

export const lessonDetailRowSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
 lesson_number: z.number().int().positive(),
 lesson_order: z.number().int().positive(),
 title_zh: z.string(),
 title_pinyin: z.string().nullable().default(null),
 title_vi: z.string().nullable().default(null),
 title_en: z.string().nullable().default(null),
 tags: z.array(z.string()).default([]),
 source_file: z.string().nullable(),
 updated_at: z.string(),
 course: relatedCourseSchema,
 book: relatedBookSchema,
 sections: z.array(lessonSectionRowSchema).default([]),
 texts: z.array(lessonTextRowSchema).default([]),
 vocab: z.array(vocabRowSchema).default([]),
 grammar: z.array(grammarRowSchema).default([]),
});

export const lessonShellRowSchema = lessonDetailRowSchema.omit({
 sections: true,
 vocab: true,
 grammar: true,
});

const relatedLessonSchema = z
 .union([
  z.object({
   id: z.string(),
   lesson_number: z.number().int().positive(),
   lesson_order: z.number().int().positive(),
   title_zh: z.string(),
   title_vi: z.string().nullable().default(null),
  }),
  z.array(
   z.object({
    id: z.string(),
    lesson_number: z.number().int().positive(),
    lesson_order: z.number().int().positive(),
    title_zh: z.string(),
    title_vi: z.string().nullable().default(null),
   }),
  ),
 ])
 .transform((value) => (Array.isArray(value) ? value[0] : value));

export const aggregateVocabRowSchema = vocabCoreRowSchema.extend({ lesson: relatedLessonSchema });
export const aggregateGrammarRowSchema = grammarCoreRowSchema.extend({
 lesson: relatedLessonSchema,
});

export type LessonSummaryRow = z.output<typeof lessonSummaryRowSchema>;
export type LessonDetailRow = z.output<typeof lessonDetailRowSchema>;
export type VocabRow = z.output<typeof vocabRowSchema>;
export type GrammarRow = z.output<typeof grammarRowSchema>;
export type RadicalRow = z.output<typeof radicalRowSchema>;
