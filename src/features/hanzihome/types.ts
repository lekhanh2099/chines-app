import type radicalsData from "../../../data/hanzihome/hanzihome_radicals_clean.json";
import type { HanyuLesson } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import type { DeepVocabularyItem } from "@/features/hanzihome/static-json/schemas/vocab.schema";

export type HanziHomeModule =
 | "overview"
 | "lessonText"
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
};

export type HanziHomeCourseBook = {
 id: string;
 courseId: string;
 title: string;
 shortTitle?: string;
 order: number;
};

export type StaticRadicalData = (typeof radicalsData.radicals)[number];

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
 zh: string;
 pinyin?: string;
 vi?: string;
 note?: string;
};

export type HanziHomeVocabItem = DeepVocabularyItem & {
 runtimeId: string;
 lessonId?: string;
 category: string;
};

export type GrammarViewModel = {
 id: string;
 title?: string;
 contentMd?: string;
 cleanTitle: string;
 core: string;
 structuresView: string[];
 examplesParsed: VocabExample[];
 notes: string[];
 detailSections?: Array<{
  key: string;
  title: string;
  lines: string[];
 }>;
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
 lessonNumber: number;
 titleZh: string;
 title: string;
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

export type UserLearningState = {
 settings: {
  lastCourseId?: string;
  lastLessonId?: string;
  lastModule?: HanziHomeModule;
  density?: "comfortable" | "compact" | "focus";
  vocabDetailTab?: string;
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
