import type {
 GrammarCourseWithLessons,
 GrammarLessonWithStats,
 VocabCourseWithLessons,
 VocabEntryWithProgress,
 VocabLessonWithStats,
} from "@/types/database";

export type LearningModuleKind = "vocabulary" | "grammar";
export type LearningSource = "hanyu" | "hsk";

export type LessonRouteParams = {
 source?: LearningSource;
 lessonNumber?: number | null;
 lessonKey?: string | null;
 mode?: string | null;
 pointId?: string | null;
 tab?: string | null;
};

export type LessonWorkspaceSummary = {
 wordCount: number;
 learnedCount: number;
 weakCount: number;
 pointCount: number;
 grammarWeakCount: number;
};

export type LessonWorkspaceContext = {
 module: LearningModuleKind;
 source: LearningSource;
 lessonNumber: number | null;
 lessonKey: string | null;
 lessonTitle: string;
 vocabularyHref: string;
 vocabularyListHref: string;
 grammarHref: string;
 summary: LessonWorkspaceSummary;
};

function withParams(path: string, params: Record<string, string | number | null | undefined>) {
 const search = new URLSearchParams();
 Object.entries(params).forEach(([key, value]) => {
  if (value === null || value === undefined || value === "") return;
  search.set(key, String(value));
 });
 const query = search.toString();
 return query ? `${path}?${query}` : path;
}

export const learningRoutes = {
 vocabulary(params: LessonRouteParams = {}) {
  return withParams("/vocabulary", {
   source: params.source,
   lesson: params.lessonNumber,
   lessonKey: params.lessonKey,
   mode: params.mode,
   tab: params.tab,
  });
 },
 grammar(params: LessonRouteParams = {}) {
  return withParams("/grammar", {
   source: params.source,
   lesson: params.lessonNumber,
   lessonKey: params.lessonKey,
   pointId: params.pointId,
  });
 },
};

export function parseLearningSource(value: string | null | undefined): LearningSource {
 return value === "hsk" ? "hsk" : "hanyu";
}

export function parseLessonNumber(value: string | null | undefined) {
 if (!value) return null;
 const parsed = Number(value);
 return Number.isFinite(parsed) ? parsed : null;
}

function sameLesson(
 lesson: { lesson_key?: string | null; lesson_number?: number | null },
 lessonKey?: string | null,
 lessonNumber?: number | null,
) {
 if (lessonKey && lesson.lesson_key === lessonKey) return true;
 return typeof lessonNumber === "number" && lesson.lesson_number === lessonNumber;
}

export function findVocabLessonForGrammar({
 vocabCourse,
 grammarCourse,
 grammarLesson,
}: {
 vocabCourse: VocabCourseWithLessons | null;
 grammarCourse: GrammarCourseWithLessons | null;
 grammarLesson: GrammarLessonWithStats | null;
}) {
 if (!vocabCourse || !grammarLesson) return null;
 const exact = vocabCourse.lessons.find((lesson) =>
  sameLesson(lesson, grammarLesson.lesson_key, grammarLesson.lesson_number),
 );
 if (exact) return exact;

 const grammarCourseKey = grammarCourse?.course_key || "";
 const sourceFamily = grammarCourseKey.includes("hsk") ? "hsk" : "hanyu";
 const vocabCourseKey = vocabCourse.course_key || "";
 if (sourceFamily === "hsk" && !vocabCourseKey.includes("hsk")) return null;
 if (sourceFamily === "hanyu" && vocabCourseKey.includes("hsk")) return null;

 return (
  vocabCourse.lessons.find(
   (lesson) =>
    typeof grammarLesson.lesson_number === "number" &&
    lesson.lesson_number === grammarLesson.lesson_number,
  ) || null
 );
}

export function findGrammarLessonFromQuery(
 lessons: GrammarLessonWithStats[],
 lessonNumber?: number | null,
 lessonKey?: string | null,
) {
 return (
  lessons.find((lesson) => sameLesson(lesson, lessonKey, lessonNumber)) ||
  null
 );
}

export function findVocabLessonFromQuery(
 lessons: VocabLessonWithStats[],
 lessonNumber?: number | null,
 lessonKey?: string | null,
) {
 return (
  lessons.find((lesson) => sameLesson(lesson, lessonKey, lessonNumber)) ||
  null
 );
}

export function getLessonWorkspaceContext({
 module,
 source,
 grammarCourse,
 vocabularyCourse,
 grammarLesson,
 vocabularyLesson,
 vocabularyEntries = [],
 pointId,
}: {
 module: LearningModuleKind;
 source: LearningSource;
 grammarCourse?: GrammarCourseWithLessons | null;
 vocabularyCourse?: VocabCourseWithLessons | null;
 grammarLesson?: GrammarLessonWithStats | null;
 vocabularyLesson?: VocabLessonWithStats | null;
 vocabularyEntries?: VocabEntryWithProgress[];
 pointId?: string | null;
}): LessonWorkspaceContext {
 const lessonNumber =
  grammarLesson?.lesson_number ?? vocabularyLesson?.lesson_number ?? null;
 const lessonKey = grammarLesson?.lesson_key ?? vocabularyLesson?.lesson_key ?? null;
 const lessonTitle =
  grammarLesson?.title || vocabularyLesson?.title || (lessonNumber ? `Bài ${lessonNumber}` : "Bài đang học");
 const entries =
  vocabularyLesson?.entries ||
  vocabularyEntries.filter((entry) => entry.source.lessonNumber === lessonNumber);
 const grammarPoints = grammarLesson?.points || [];

 return {
  module,
  source,
  lessonNumber,
  lessonKey,
  lessonTitle,
  vocabularyHref: learningRoutes.vocabulary({
   source,
   lessonNumber,
   lessonKey,
   mode: "flashcard",
  }),
  vocabularyListHref: learningRoutes.vocabulary({
   source,
   lessonNumber,
   lessonKey,
   mode: "list",
  }),
  grammarHref: learningRoutes.grammar({
   source,
   lessonNumber,
   lessonKey,
   pointId,
  }),
  summary: {
   wordCount: entries.length,
   learnedCount: entries.filter((entry) => entry.status === "mastered").length,
   weakCount: entries.filter((entry) => entry.status === "learning").length,
   pointCount: grammarLesson ? grammarPoints.length : grammarCourse?.points.length || 0,
   grammarWeakCount: grammarPoints.filter((point) => point.status === "learning").length,
  },
 };
}
