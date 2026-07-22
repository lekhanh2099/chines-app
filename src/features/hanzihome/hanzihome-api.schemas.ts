import { z } from "zod";
import { HanyuLessonSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import { runtimeDeepVocabularyItemSchema } from "@/features/hanzihome/schemas/runtime-content.schema";
import { VocabularyExampleSchema } from "@/features/hanzihome/schemas/vocab.schema";
import { userLearningStateSchema } from "@/features/hanzihome/schemas/learning-state.schema";

const editableRecordMetaSchema = z.object({
 entityType: z.string(),
 entityId: z.string(),
 dbId: z.string(),
 updatedAt: z.string(),
 parentEntityType: z.string().optional(),
 parentEntityId: z.string().optional(),
 sectionDbId: z.string().optional(),
 fieldPath: z.array(z.union([z.string(), z.number()])).optional(),
 order: z.number().optional(),
 orderField: z.string().optional(),
});

export const vocabExampleSchema = z.object({
 id: z.string(),
 zh: z.string().trim().min(1, "Thiếu câu tiếng Trung"),
 pinyin: z.string().optional(),
 vi: z.string().optional(),
 note: z.string().optional(),
 editMeta: editableRecordMetaSchema.optional(),
});

const detailSectionSchema = z.object({
 id: z.string(),
 key: z.string().trim().min(1, "Thiếu key"),
 title: z.string().trim().min(1, "Thiếu tiêu đề"),
 lines: z.array(z.string().trim().min(1)).default([]),
});

const vocabDetailSectionSchema = detailSectionSchema.extend({
 order: z.number().int().positive(),
 editMeta: editableRecordMetaSchema.optional(),
});

export const hanziHomeVocabItemSchema = runtimeDeepVocabularyItemSchema.extend({
 examples: z.array(
  VocabularyExampleSchema.extend({ editMeta: editableRecordMetaSchema.optional() }),
 ),
 runtimeId: z.string(),
 lessonId: z.string().optional(),
 category: z.string(),
 tone: z.string().optional(),
 detailSections: z.array(vocabDetailSectionSchema).optional(),
 editMeta: editableRecordMetaSchema.optional(),
});

export const grammarViewModelSchema = z.object({
 id: z.string(),
 title: z.string().optional(),
 titleVi: z.string().optional(),
 level: z.string().optional(),
 tags: z.array(z.string()).optional(),
 contentMd: z.string().optional(),
 cleanTitle: z.string(),
 core: z.string(),
 structuresView: z.array(z.string()),
 examplesParsed: z.array(vocabExampleSchema),
 notes: z.array(z.string()),
 detailSections: z.array(detailSectionSchema).optional(),
 editMeta: editableRecordMetaSchema.optional(),
});

export const lessonNotesSchema = z.object({
 overviewMarkdown: z.string().optional(),
 lessonTextMarkdown: z.string().optional(),
 exerciseMarkdown: z.string().optional(),
 readingMarkdown: z.string().optional(),
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
 updatedAt: z.string().optional(),
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
 updatedAt: z.string().optional(),
});

export const lessonSchema = z.object({
 id: z.string(),
 legacyLessonId: z.string().optional(),
 lessonNumber: z.number(),
 titleZh: z.string(),
 title: z.string(),
 titlePinyin: z.string().optional(),
 titleEn: z.string().optional(),
 tags: z.array(z.string()).optional(),
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
 grammarCount: z.number().optional(),
 vocabIds: z.array(z.string()),
 grammarPointIds: z.array(z.string()),
 vocab: z.array(hanziHomeVocabItemSchema),
 grammar: z.array(grammarViewModelSchema),
 notes: lessonNotesSchema.optional(),
 sourceLesson: HanyuLessonSchema.optional(),
 editMeta: editableRecordMetaSchema.optional(),
 editableRecords: z.record(z.string(), editableRecordMetaSchema).optional(),
});

const radicalSchema = z.object({
 id: z.string(),
 index: z.number().int().positive(),
 radical: z.string(),
 nameVi: z.string().optional(),
 strokes: z.number().int().positive().nullable().optional(),
 coreMeaning: z.object({
  modern: z.string().optional(),
  history: z.string().optional(),
 }),
 recognition: z.string().optional(),
 variants: z.array(z.object({ form: z.string(), note: z.string() })),
 relatedComponents: z.array(z.object({ form: z.string(), note: z.string() })).optional(),
 distinguish: z.array(z.string()),
 groups: z.array(z.object({ name: z.string(), chars: z.array(z.string()) })).optional(),
 editMeta: editableRecordMetaSchema.optional(),
});

const metaSchema = z.object({
 app: z.string(),
 dataset: z.string(),
 version: z.string(),
 generatedAt: z.string(),
 sourceFiles: z.array(z.string()),
 counts: z.object({
  lessons: z.number().int().nonnegative(),
  vocab: z.number().int().nonnegative(),
  grammarPoints: z.number().int().nonnegative(),
  radicals: z.number().int().nonnegative(),
  flashcards: z.number().int().nonnegative(),
 }),
 schemaNote: z.string().optional(),
});

export const hanziHomeCatalogSchema = z.object({
 source: z.enum(["db", "empty"]),
 courses: z.array(catalogCourseSchema),
 books: z.array(bookSchema),
 lessons: z.array(lessonSchema),
 radicals: z.array(radicalSchema),
 meta: metaSchema,
});

const aggregateVocabItemSchema = z.object({
 id: z.string(),
 courseId: z.string(),
 bookId: z.string(),
 lessonId: z.string(),
 lessonNumber: z.number().int().positive(),
 lessonOrder: z.number().int().positive(),
 lessonTitle: z.string(),
 word: z.string(),
 pinyin: z.string(),
 hanViet: z.string(),
 meaning: z.string(),
 category: z.string(),
 level: z.string().nullable().optional(),
 pos: z
  .object({
   vi: z.string().nullable().optional(),
   zh: z.string().nullable().optional(),
  })
  .nullable()
  .optional(),
});

const aggregateGrammarItemSchema = z.object({
 id: z.string(),
 courseId: z.string(),
 bookId: z.string(),
 lessonId: z.string(),
 lessonNumber: z.number().int().positive(),
 lessonOrder: z.number().int().positive(),
 lessonTitle: z.string(),
 title: z.string(),
 cleanTitle: z.string(),
 core: z.string(),
});

export const catalogApiResponseSchema = z.object({ catalog: hanziHomeCatalogSchema });
export const courseLessonsApiResponseSchema = z.object({ lessons: z.array(lessonSchema) });
export const lessonApiResponseSchema = z.object({ lesson: lessonSchema });
export const lessonVocabularyApiResponseSchema = z.object({
 resource: z.object({
  lessonId: z.string(),
  items: z.array(hanziHomeVocabItemSchema),
  total: z.number().int().nonnegative(),
 }),
});
export const aggregateApiResponseSchema = z.object({
 items: z.array(z.union([aggregateVocabItemSchema, aggregateGrammarItemSchema])),
});
export const learningStateApiResponseSchema = z.object({ state: userLearningStateSchema });
