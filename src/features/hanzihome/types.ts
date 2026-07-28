import type { JsonObject, JsonValue } from "@/types/json";
import type { HanyuLesson } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import type { DeepVocabularyItem } from "@/features/hanzihome/schemas/vocab.types";
import { z } from "zod";
import {
 hanziReaderFontSchema,
 hanziReaderSizeSchema,
 learningStatusSchema,
 lessonTextRevealModeSchema,
 moduleSchema,
 progressItemSchema,
 reviewResultSchema,
 userLearningStateSchema,
} from "@/features/hanzihome/schemas/learning-state.schema";

export type HanziHomeModule = z.infer<typeof moduleSchema>;

export type LearningStatus = z.infer<typeof learningStatusSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;

export type HanziHomeCourseType = string;

export type HanziHomeCourse = {
 id: string;
 slug: string;
 title: string;
 subtitle?: string;
 type: HanziHomeCourseType;
 order: number;
 updatedAt?: string;
};

export type HanziHomeCourseBook = {
 id: string;
 courseId: string;
 title: string;
 shortTitle?: string;
 order: number;
 updatedAt?: string;
};

export const EditableFieldPathSchema = z.array(z.union([z.string(), z.number()]));
const NullableStrokeCountSchema = z.number().nullable();

export const HanziHomeEditableRecordMetaSchema = z.object({
 entityType: z.string(),
 entityId: z.string(),
 dbId: z.string(),
 updatedAt: z.string(),
 parentEntityType: z.string().optional(),
 parentEntityId: z.string().optional(),
 sectionDbId: z.string().optional(),
 fieldPath: EditableFieldPathSchema.optional(),
 order: z.number().optional(),
 orderField: z.string().optional(),
});
export type HanziHomeEditableRecordMeta = z.infer<typeof HanziHomeEditableRecordMetaSchema>;

export type StaticRadicalData = {
 id: string;
 index: number;
 radical: string;
 nameVi?: string;
 strokes?: z.infer<typeof NullableStrokeCountSchema>;
 coreMeaning: {
  modern?: string;
  history?: string;
 };
 recognition?: string;
 variants: Array<{
  form: string;
  note: string;
 }>;
 relatedComponents?: Array<{
  form: string;
  note: string;
 }>;
 distinguish: string[];
 groups?: Array<{
  name: string;
  chars: string[];
 }>;
 editMeta?: HanziHomeEditableRecordMeta;
};

export type HanziHomeMeta = {
 app: string;
 dataset: string;
 version: string;
 generatedAt: string;
 sourceFiles: string[];
 counts: {
  lessons: number;
  vocab: number;
  grammarPoints: number;
  radicals: number;
  flashcards: number;
 };
 schemaNote?: string;
};

export type VocabExample = {
 id: string;
 zh: string;
 pinyin?: string;
 vi?: string;
 note?: string;
 editMeta?: HanziHomeEditableRecordMeta;
};

export type VocabDetailSection = {
 id: string;
 key: string;
 title: string;
 lines: string[];
 order: number;
 editMeta?: HanziHomeEditableRecordMeta;
};

export type HanziHomeVocabItem = Omit<DeepVocabularyItem, "examples"> & {
 examples: Array<
  DeepVocabularyItem["examples"][number] & { editMeta?: HanziHomeEditableRecordMeta }
 >;
 runtimeId: string;
 lessonId?: string;
 category: string;
 tone?: string;
 detailSections?: VocabDetailSection[];
 editMeta?: HanziHomeEditableRecordMeta;
};

export type GrammarViewModel = {
 id: string;
 title?: string;
 titleVi?: string;
 level?: string;
 tags?: string[];
 contentMd?: string;
 cleanTitle: string;
 core: string;
 structuresView: string[];
 examplesParsed: VocabExample[];
 notes: string[];
 detailSections?: Array<{
  id: string;
  key: string;
  title: string;
  lines: string[];
 }>;
 editMeta?: HanziHomeEditableRecordMeta;
};

export type LessonNotesViewModel = {
 overviewMarkdown?: string;
 lessonTextMarkdown?: string;
 exerciseMarkdown?: string;
 readingMarkdown?: string;
 grammarSummary?: string;
 vocabularyText?: string;
 properNounsText?: string;
 applicationMarkdown?: string;
 personalNote?: string;
};

export type HanziHomeLesson = {
 id: string;
 legacyLessonId?: string;
 dbSource?: {
  dataset: z.infer<typeof HanziHomeDatasetSchema>;
  lessonFolder: string;
  lessonMeta: JsonValue;
  sectionFilesById: Record<string, string>;
  vocabularyItemFilesByRuntimeId: Record<string, string>;
  vocabularyItemPayloadsByRuntimeId: JsonObject;
 };
 lessonNumber: number;
 titleZh: string;
 title: string;
 titlePinyin?: string;
 titleEn?: string;
 tags?: string[];
 sourceFile?: string;
 courseId?: string;
 courseTitle?: string;
 bookId?: string;
 bookTitle?: string;
 bookOrder?: number;
 lessonOrder?: number;
 vocabCategories?: Array<{
  nameVi: string;
  words: string[];
 }>;
 vocabCount?: number;
 grammarCount?: number;
 vocabIds: string[];
 grammarPointIds: string[];
 vocab: HanziHomeVocabItem[];
 grammar: GrammarViewModel[];
 notes?: LessonNotesViewModel;
 sourceLesson?: HanyuLesson;
 editMeta?: HanziHomeEditableRecordMeta;
 editableRecords?: Record<string, HanziHomeEditableRecordMeta>;
};

export type HanziHomeData = {
 courses: HanziHomeCourse[];
 books: HanziHomeCourseBook[];
 lessons: HanziHomeLesson[];
 radicals: StaticRadicalData[];
 meta: HanziHomeMeta;
};

export const HanziHomeDatasetSchema = z.enum(["q2", "q3"]);
export const HanziHomeCatalogSourceSchema = z.enum(["db", "static", "empty"]);
export type HanziHomeCatalogSource = z.infer<typeof HanziHomeCatalogSourceSchema>;

export type HanziHomeCourseStats = {
 bookCount: number;
 lessonCount: number;
 vocabCount: number;
 grammarCount: number;
};

export type HanziHomeCatalogCourse = HanziHomeCourse & {
 stats: HanziHomeCourseStats;
 lastLessonId?: string;
 fallbackLessonId?: string;
};

export type HanziHomeCatalogData = {
 source: HanziHomeCatalogSource;
 courses: HanziHomeCatalogCourse[];
 books: HanziHomeCourseBook[];
 lessons: HanziHomeLesson[];
 radicals: StaticRadicalData[];
 meta: HanziHomeMeta;
};

export type LearningProgressItem = z.infer<typeof progressItemSchema>;
export type HanziReaderFont = z.infer<typeof hanziReaderFontSchema>;
export type HanziReaderSize = z.infer<typeof hanziReaderSizeSchema>;
export type LessonTextRevealMode = z.infer<typeof lessonTextRevealModeSchema>;
export type UserLearningState = z.infer<typeof userLearningStateSchema>;
export type LessonTextDisplaySettings = NonNullable<
 UserLearningState["settings"]["lessonTextDisplayMode"]
>;
