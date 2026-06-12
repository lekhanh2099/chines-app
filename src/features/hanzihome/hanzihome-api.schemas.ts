import { z } from "zod";
import { HanyuLessonSchema } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import { DeepVocabularyItemSchema } from "@/features/hanzihome/static-json/schemas/vocab.schema";

export const vocabExampleSchema = z.object({
 id: z.string(),
 zh: z.string().trim().min(1, "Thiếu câu tiếng Trung"),
 pinyin: z.string().optional(),
 vi: z.string().optional(),
 note: z.string().optional(),
});

const vocabDetailSectionSchema = z.object({
 id: z.string(),
 key: z.string().trim().min(1, "Thiếu key"),
 title: z.string().trim().min(1, "Thiếu tiêu đề"),
 lines: z.array(z.string().trim().min(1)).default([]),
});

export const hanziHomeVocabItemSchema = DeepVocabularyItemSchema.extend({
 runtimeId: z.string(),
 lessonId: z.string().optional(),
 category: z.string(),
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
 grammarCount: z.number().optional(),
 vocabIds: z.array(z.string()),
 grammarPointIds: z.array(z.string()),
 vocab: z.array(hanziHomeVocabItemSchema),
 grammar: z.array(grammarViewModelSchema),
 notes: lessonNotesSchema.optional(),
 sourceLesson: HanyuLessonSchema.optional(),
});
