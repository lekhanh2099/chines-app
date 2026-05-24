import type bundle from "../../../data/hanzihome/hanzihome_bundle_clean.json";

export type HanziHomeModule =
  | "overview"
  | "lessonText"
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

export type StaticLessonData = (typeof bundle.lessons)[number];
export type StaticVocabData = (typeof bundle.vocab)[number];
export type StaticGrammarData = (typeof bundle.grammarPoints)[number];
export type StaticRadicalData = (typeof bundle.radicals)[number];

export type VocabExample = {
  zh: string;
  pinyin?: string;
  vi?: string;
  note?: string;
};

export type VocabViewModel = {
  id: string;
  lessonId?: string;
  word: string;
  pinyin: string;
  hanViet: string;
  meaning: string;
  category: string;
  level?: string;
  pos?: {
    vi?: string;
    zh?: string;
  };
  examplesParsed: VocabExample[];
  detailSections: Array<{
    key: string;
    title: string;
    lines: string[];
  }>;
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
};

export type LessonNotesViewModel = {
  overviewMarkdown?: string;
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
  vocabIds: string[];
  grammarPointIds: string[];
  vocab: VocabViewModel[];
  grammar: GrammarViewModel[];
  isDraft?: boolean;
  draftId?: string;
  status?: "draft" | "published" | "archived";
  notes?: LessonNotesViewModel;
};

export type HanziHomeData = {
  courses: HanziHomeCourse[];
  books: HanziHomeCourseBook[];
  lessons: HanziHomeLesson[];
  radicals: StaticRadicalData[];
  meta: typeof bundle.meta;
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
  meta: typeof bundle.meta;
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
