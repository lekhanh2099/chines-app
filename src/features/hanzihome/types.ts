import type { HanyuLesson } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import type { DeepVocabularyItem } from "@/features/hanzihome/schemas/vocab.types";

export type HanziHomeModule =
 | "overview"
 | "lessonText"
 | "practice"
 | "listening"
 | "dictation"
 | "script"
 | "notes"
 | "vocab"
 | "grammar"
 | "radicals"
 | "review";

export type LearningStatus = "new" | "learning" | "known" | "hard";
export type ReviewResult = "again" | "hard" | "known";

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

export type HanziHomeEditableRecordMeta = {
 entityType: string;
 entityId: string;
 dbId: string;
 updatedAt: string;
 parentEntityType?: string;
 parentEntityId?: string;
 sectionDbId?: string;
 fieldPath?: Array<string | number>;
 order?: number;
 orderField?: string;
};

export type StaticRadicalData = {
 id: string;
 index: number;
 radical: string;
 nameVi?: string;
 strokes?: number | null;
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
  dataset: "q2" | "q3";
  lessonFolder: string;
  lessonMeta: unknown;
  sectionFilesById: Record<string, string>;
  vocabularyItemFilesByRuntimeId: Record<string, string>;
  vocabularyItemPayloadsByRuntimeId: Record<string, unknown>;
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

export type HanziHomeCatalogSource = "db" | "static" | "empty";

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

export type LearningProgressItem = {
 level: number;
 status: LearningStatus;
 lastReviewedAt?: string;
};

export type HanziReaderFont = "system" | "songti" | "pinyin";
export type HanziReaderSize = "md" | "lg" | "xl" | "2xl" | "3xl";
export type LessonTextRevealMode = "always" | "tap";

export type LessonTextDisplaySettings = {
 showPinyin: boolean;
 showMeaning: boolean;
 showAnswers: boolean;
 hanziFont: HanziReaderFont;
 hanziSize: HanziReaderSize;
 revealMode: LessonTextRevealMode;
};

export type UserLearningState = {
 settings: {
  lastCourseId?: string;
  lastLessonId?: string;
  lastModule?: HanziHomeModule;
  density?: "comfortable" | "compact" | "focus";
  vocabDetailTab?: string;
  lessonTextDisplayMode?: LessonTextDisplaySettings;
 };
 progress: {
  vocab?: Record<string, LearningProgressItem>;
  grammar?: Record<string, LearningProgressItem>;
 };
 bookmarks: {
  lessons?: string[];
  vocab?: string[];
  grammar?: string[];
  radicals?: string[];
 };
 reviewHistory: Array<{
  type: "vocab" | "grammar" | "radical";
  id: string;
  result: ReviewResult;
  answeredAt: string;
 }>;
};
