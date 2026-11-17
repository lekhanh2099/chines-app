import { z } from "zod";

/**
 * Rows of the retired database-backed course tables, as written by
 * `scripts/export-course-content.mjs`. Only the columns the converter reads are
 * declared; Zod drops the rest.
 */
const deletedAtSchema = z.string().nullable().default(null);

const courseBookRowSchema = z.object({
 id: z.string().min(1),
 course_id: z.string().min(1),
 title: z.string(),
 short_title: z.string().nullable(),
 book_order: z.number().int(),
 deleted_at: deletedAtSchema,
});

const courseLessonRowSchema = z.object({
 id: z.string().min(1),
 book_id: z.string(),
 lesson_number: z.number().int().positive(),
 lesson_order: z.number().int(),
 title_zh: z.string(),
 title_vi: z.string().nullable(),
 deleted_at: deletedAtSchema,
});

const courseSectionRowSchema = z.object({
 id: z.string().min(1),
 lesson_id: z.string(),
 section_type: z.string(),
 title: z.string(),
 title_vi: z.string().nullable(),
 section_order: z.number().int(),
 payload: z.json(),
 deleted_at: deletedAtSchema,
});

const courseTextRowSchema = z.object({
 lesson_id: z.string(),
 text_key: z.string(),
 title: z.string().nullable(),
 content: z.string(),
 deleted_at: deletedAtSchema,
});

const courseVocabRowSchema = z.object({
 id: z.string().min(1),
 lesson_id: z.string(),
 item_order: z.number().int(),
 word: z.string(),
 pinyin: z.string().nullable(),
 han_viet: z.string().nullable(),
 meaning: z.string().nullable(),
 pos_vi: z.string().nullable(),
 pos_zh: z.string().nullable(),
 deleted_at: deletedAtSchema,
});

const courseGrammarPointRowSchema = z.object({
 id: z.string().min(1),
 lesson_id: z.string(),
 point_order: z.number().int(),
 title: z.string(),
 title_vi: z.string().nullable(),
 core: z.string().nullable(),
 structures_view: z.array(z.string()).nullable(),
 notes: z.array(z.string()).nullable(),
 deleted_at: deletedAtSchema,
});

const courseGrammarExampleRowSchema = z.object({
 grammar_point_id: z.string(),
 example_order: z.number().int(),
 zh: z.string(),
 vi: z.string().nullable(),
 note: z.string().nullable(),
 deleted_at: deletedAtSchema,
});

const courseGrammarDetailRowSchema = z.object({
 grammar_point_id: z.string(),
 title: z.string(),
 lines: z.array(z.string()),
 section_order: z.number().int(),
 deleted_at: deletedAtSchema,
});

export const courseExportSchema = z.object({
 books: z.array(courseBookRowSchema),
 lessons: z.array(courseLessonRowSchema),
 sections: z.array(courseSectionRowSchema),
 texts: z.array(courseTextRowSchema),
 vocabItems: z.array(courseVocabRowSchema),
 grammarPoints: z.array(courseGrammarPointRowSchema),
 grammarExamples: z.array(courseGrammarExampleRowSchema),
 grammarDetails: z.array(courseGrammarDetailRowSchema),
});

export type CourseExport = z.output<typeof courseExportSchema>;
export type CourseLessonRow = CourseExport["lessons"][number];
export type CourseSectionRow = CourseExport["sections"][number];

/** Export file name (without `.json`) for each key of {@link courseExportSchema}. */
export const courseExportTables = {
 books: "hanzihome_course_books",
 lessons: "hanzihome_lessons",
 sections: "hanzihome_lesson_sections",
 texts: "hanzihome_lesson_texts",
 vocabItems: "hanzihome_vocab_items",
 grammarPoints: "hanzihome_grammar_points",
 grammarExamples: "hanzihome_grammar_examples",
 grammarDetails: "hanzihome_grammar_detail_sections",
};
