import { z } from "zod";

export const canonicalEntityTypeSchema = z.enum([
 "course",
 "book",
 "lesson",
 "section",
 "lesson_text",
 "vocab_item",
 "vocab_example",
 "vocab_detail_section",
 "grammar_point",
 "grammar_example",
 "grammar_detail_section",
]);

export const canonicalMutationOperationSchema = z.enum([
 "create",
 "update",
 "delete",
 "restore",
 "reorder",
]);

export const mutationEnvelopeSchema = z.object({
 reason: z.string().trim().min(1).default("Cập nhật nội dung HanziHome"),
 expectedUpdatedAt: z.iso.datetime({ offset: true }).optional(),
 changes: z.record(z.string(), z.unknown()).default({}),
});

export const mutationResponseSchema = z.object({
 item: z.record(z.string(), z.unknown()),
});

export type CanonicalEntityType = z.infer<typeof canonicalEntityTypeSchema>;
export type CanonicalMutationOperation = z.infer<typeof canonicalMutationOperationSchema>;
export type MutationEnvelope = z.infer<typeof mutationEnvelopeSchema>;

const nullableText = z.string().nullable().optional();
const positiveInteger = z.number().int().positive();

const courseFields = z.object({
 slug: z.string().trim().min(2),
 title: z.string().trim().min(1),
 subtitle: nullableText,
 type: z.string().trim().min(1),
 course_order: positiveInteger.optional(),
});
const bookFields = z.object({
 course_id: z.string().min(1),
 title: z.string().trim().min(1),
 short_title: nullableText,
 book_order: positiveInteger.optional(),
});
const lessonFields = z.object({
 course_id: z.string().min(1),
 book_id: z.string().min(1),
 lesson_number: positiveInteger,
 lesson_order: positiveInteger.optional(),
 title_zh: z.string().trim().min(1),
 title_pinyin: nullableText,
 title_vi: nullableText,
 title_en: nullableText,
 tags: z.array(z.string()).optional(),
 source_file: nullableText,
});
const sectionFields = z.object({
 lesson_id: z.string().min(1),
 source_section_id: z.string().min(1),
 section_key: z.string().min(1),
 section_type: z.string().min(1),
 title: z.string(),
 title_vi: z.string(),
 section_order: positiveInteger.optional(),
 payload: z.record(z.string(), z.unknown()),
 source_file: nullableText,
});
const lessonTextFields = z.object({
 lesson_id: z.string().min(1),
 text_key: z.string().trim().min(1),
 title: nullableText,
 content: z.string(),
 content_format: z.enum(["markdown", "plain"]),
});
const vocabItemFields = z.object({
 lesson_id: z.string().min(1),
 course_id: z.string().min(1),
 book_id: z.string().min(1),
 item_order: positiveInteger.optional(),
 word: z.string().trim().min(1),
 pinyin: z.string().trim().min(1),
 han_viet: z.string(),
 meaning: z.string().trim().min(1),
 meaning_en: nullableText,
 category: z.string().trim().min(1),
 level: nullableText,
 pos_vi: nullableText,
 pos_zh: nullableText,
 tone: nullableText,
 tags: z.array(z.string()).optional(),
 source_file: nullableText,
});
const vocabExampleFields = z.object({
 vocab_item_id: z.string().min(1),
 lesson_id: z.string().min(1),
 example_order: positiveInteger.optional(),
 zh: z.string().trim().min(1),
 pinyin: nullableText,
 vi: nullableText,
 note: nullableText,
});
const vocabDetailFields = z.object({
 vocab_item_id: z.string().min(1),
 lesson_id: z.string().min(1),
 section_key: z.string().trim().min(1),
 title: z.string().trim().min(1),
 lines: z.array(z.string()),
 section_order: positiveInteger.optional(),
});
const grammarPointFields = z.object({
 lesson_id: z.string().min(1),
 course_id: z.string().min(1),
 book_id: z.string().min(1),
 point_order: positiveInteger.optional(),
 title: z.string().trim().min(1),
 title_vi: nullableText,
 clean_title: z.string().trim().min(1),
 level: nullableText,
 core: z.string(),
 content_md: nullableText,
 structures_view: z.array(z.string()),
 notes: z.array(z.string()),
 tags: z.array(z.string()).optional(),
});
const grammarExampleFields = z.object({
 grammar_point_id: z.string().min(1),
 lesson_id: z.string().min(1),
 example_order: positiveInteger.optional(),
 zh: z.string().trim().min(1),
 pinyin: nullableText,
 vi: nullableText,
 note: nullableText,
});
const grammarDetailFields = z.object({
 grammar_point_id: z.string().min(1),
 lesson_id: z.string().min(1),
 section_key: z.string().trim().min(1),
 title: z.string().trim().min(1),
 lines: z.array(z.string()),
 section_order: positiveInteger.optional(),
});

const createChangesSchemas: Record<CanonicalEntityType, z.ZodType> = {
 course: courseFields.strict(),
 book: bookFields.strict(),
 lesson: lessonFields.strict(),
 section: sectionFields.strict(),
 lesson_text: lessonTextFields.strict(),
 vocab_item: vocabItemFields.strict(),
 vocab_example: vocabExampleFields.strict(),
 vocab_detail_section: vocabDetailFields.strict(),
 grammar_point: grammarPointFields.strict(),
 grammar_example: grammarExampleFields.strict(),
 grammar_detail_section: grammarDetailFields.strict(),
};

function updateSchema(schema: z.ZodObject<z.ZodRawShape>) {
 return schema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one changed field is required");
}

const updateChangesSchemas: Record<CanonicalEntityType, z.ZodType> = {
 course: updateSchema(courseFields.omit({ course_order: true })),
 book: updateSchema(bookFields.omit({ course_id: true, book_order: true })),
 lesson: updateSchema(lessonFields.omit({ course_id: true, book_id: true, lesson_order: true })),
 section: updateSchema(
  sectionFields.omit({
   lesson_id: true,
   source_section_id: true,
   section_key: true,
   section_order: true,
  }),
 ),
 lesson_text: updateSchema(lessonTextFields.omit({ lesson_id: true, text_key: true })),
 vocab_item: updateSchema(
  vocabItemFields.omit({ lesson_id: true, course_id: true, book_id: true, item_order: true }),
 ),
 vocab_example: updateSchema(
  vocabExampleFields.omit({ vocab_item_id: true, lesson_id: true, example_order: true }),
 ),
 vocab_detail_section: updateSchema(
  vocabDetailFields.omit({
   vocab_item_id: true,
   lesson_id: true,
   section_key: true,
   section_order: true,
  }),
 ),
 grammar_point: updateSchema(
  grammarPointFields.omit({ lesson_id: true, course_id: true, book_id: true, point_order: true }),
 ),
 grammar_example: updateSchema(
  grammarExampleFields.omit({ grammar_point_id: true, lesson_id: true, example_order: true }),
 ),
 grammar_detail_section: updateSchema(
  grammarDetailFields.omit({
   grammar_point_id: true,
   lesson_id: true,
   section_key: true,
   section_order: true,
  }),
 ),
};

const reorderChangesSchemas: Partial<Record<CanonicalEntityType, z.ZodType>> = {
 course: z.object({ course_order: positiveInteger }).strict(),
 book: z.object({ book_order: positiveInteger }).strict(),
 lesson: z.object({ lesson_order: positiveInteger }).strict(),
 section: z.object({ section_order: positiveInteger }).strict(),
 vocab_item: z.object({ item_order: positiveInteger }).strict(),
 vocab_example: z.object({ example_order: positiveInteger }).strict(),
 vocab_detail_section: z.object({ section_order: positiveInteger }).strict(),
 grammar_point: z.object({ point_order: positiveInteger }).strict(),
 grammar_example: z.object({ example_order: positiveInteger }).strict(),
 grammar_detail_section: z.object({ section_order: positiveInteger }).strict(),
};

export function getCanonicalChangesSchema(
 entityType: CanonicalEntityType,
 operation: CanonicalMutationOperation,
) {
 if (operation === "create") return createChangesSchemas[entityType];
 if (operation === "update") return updateChangesSchemas[entityType];
 if (operation === "reorder") {
  return reorderChangesSchemas[entityType] ?? z.never();
 }
 return z.object({}).strict();
}
