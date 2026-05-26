import { z } from "zod";

const nullableOptionalStringSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().optional(),
);

export const vocabExampleSchema = z.object({
  zh: z.string().trim().min(1, "Thiếu câu tiếng Trung"),
  pinyin: z.string().optional(),
  vi: z.string().optional(),
  note: z.string().optional(),
});

export const vocabDetailSectionSchema = z.object({
  key: z.string().trim().min(1, "Thiếu key"),
  title: z.string().trim().min(1, "Thiếu tiêu đề"),
  lines: z.array(z.string().trim().min(1)).default([]),
});

export const vocabViewModelSchema = z.object({
  id: z.string(),
  lessonId: z.string().optional(),
  word: z.string(),
  pinyin: z.string(),
  hanViet: z.string(),
  meaning: z.string(),
  category: z.string(),
  level: z.string().optional(),
  pos: z
    .object({
      vi: z.string().optional(),
      zh: z.string().optional(),
    })
    .optional(),
  examplesParsed: z.array(vocabExampleSchema),
  detailSections: z.array(vocabDetailSectionSchema),
});

export const grammarViewModelSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  contentMd: z.string().optional(),
  cleanTitle: z.string(),
  core: z.string(),
  structuresView: z.array(z.string()),
  examplesParsed: z.array(vocabExampleSchema),
  notes: z.array(z.string()),
  detailSections: z.array(vocabDetailSectionSchema).optional(),
});

export const lessonNotesSchema = z.object({
  overviewMarkdown: z.string().optional(),
  grammarSummary: z.string().optional(),
  vocabularyText: z.string().optional(),
  properNounsText: z.string().optional(),
  applicationMarkdown: z.string().optional(),
  personalNote: z.string().optional(),
});

export const courseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  type: z.string(),
  order: z.number(),
});

export const catalogCourseSchema = courseSchema.extend({
  stats: z.object({
    bookCount: z.number(),
    lessonCount: z.number(),
    vocabCount: z.number(),
    grammarCount: z.number(),
  }),
  lastLessonId: z.string().optional(),
  fallbackLessonId: z.string().optional(),
});

export const bookSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  shortTitle: z.string().optional(),
  order: z.number(),
});

export const lessonSchema = z.object({
  id: z.string(),
  lessonNumber: z.number(),
  titleZh: z.string(),
  titleVi: z.string().optional(),
  title: z.string(),
  sourceFile: z.string().optional(),
  courseId: z.string().optional(),
  courseTitle: z.string().optional(),
  bookId: z.string().optional(),
  bookTitle: z.string().optional(),
  bookOrder: z.number().optional(),
  lessonOrder: z.number().optional(),
  vocabCategories: z
    .array(
      z.object({
        nameVi: z.string(),
        words: z.array(z.string()),
      }),
    )
    .optional(),
  vocabCount: z.number().optional(),
  vocabIds: z.array(z.string()),
  grammarPointIds: z.array(z.string()),
  vocab: z.array(vocabViewModelSchema),
  grammar: z.array(grammarViewModelSchema),
  isDraft: z.boolean().optional(),
  isDbBacked: z.boolean().optional(),
  draftId: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  notes: lessonNotesSchema.optional(),
});

export const updateHanziHomeVocabPayloadSchema = z.object({
  lessonId: z.string().trim().min(1),
  word: z.string().trim().min(1, "Thiếu từ"),
  pinyin: z.string().trim().min(1, "Thiếu pinyin"),
  hanViet: z.string().trim().min(1, "Thiếu Hán Việt"),
  meaning: z.string().trim().min(1, "Thiếu nghĩa"),
  category: z.string().trim().min(1, "Thiếu nhóm từ"),
  level: z.string().trim().optional(),
  pos: z
    .object({
      vi: z.string().trim().optional(),
      zh: z.string().trim().optional(),
    })
    .optional(),
  examplesParsed: z.array(vocabExampleSchema),
  detailSections: z.array(vocabDetailSectionSchema),
});

export const createHanziHomeVocabPayloadSchema =
  updateHanziHomeVocabPayloadSchema;

export const updateHanziHomeGrammarPayloadSchema = z.object({
  lessonId: z.string().trim().min(1),
  title: z.string().trim().min(1, "Thiếu tiêu đề"),
  cleanTitle: z.string().trim().min(1, "Thiếu tiêu đề sạch"),
  core: z.string().trim(),
  contentMd: nullableOptionalStringSchema,
  structuresView: z.array(z.string().trim().min(1)).default([]),
  notes: z.array(z.string().trim().min(1)).default([]),
  examplesParsed: z.array(vocabExampleSchema).default([]),
  detailSections: z.array(vocabDetailSectionSchema).default([]),
});

export const createHanziHomeGrammarPayloadSchema =
  updateHanziHomeGrammarPayloadSchema;

export const updateHanziHomeLessonPayloadSchema = z.object({
  lessonNumber: z.number().int().positive(),
  lessonOrder: z.number().int().positive(),
  titleZh: z.string().trim().min(1, "Thiếu tên bài tiếng Trung"),
  titleVi: z.string().trim().optional(),
});

export type UpdateHanziHomeVocabPayload = z.infer<
  typeof updateHanziHomeVocabPayloadSchema
>;
export type CreateHanziHomeVocabPayload = z.infer<
  typeof createHanziHomeVocabPayloadSchema
>;
export type UpdateHanziHomeGrammarPayload = z.infer<
  typeof updateHanziHomeGrammarPayloadSchema
>;
export type CreateHanziHomeGrammarPayload = z.infer<
  typeof createHanziHomeGrammarPayloadSchema
>;
export type UpdateHanziHomeLessonPayload = z.infer<
  typeof updateHanziHomeLessonPayloadSchema
>;
