import "server-only";

import type {
 AggregateFilters,
 AggregateKind,
 AggregateResourceItem,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import type { HanziHomeCatalogData, StaticRadicalData } from "@/features/hanzihome/types";
import {
 getStaticStudioAggregateItems,
 getStaticStudioCourseCatalog,
 getStaticStudioLessonDetail,
 getStaticStudioListeningLessonBundle,
} from "@/features/hanzihome/static-json/studio-static-content";
import {
 isPublishedStudioContentId,
 isPublishedStudioDictationLessonId,
 isPublishedStudioGrammarCourseId,
} from "@/features/hanzihome/static-json/studio-published-content-id";

export {
 isPublishedStudioContentId,
 isPublishedStudioDictationLessonId,
 isPublishedStudioGrammarCourseId,
};

export function getPublishedStudioCourseLessons(courseId: string) {
 if (!isPublishedStudioGrammarCourseId(courseId)) return null;
 return getStaticStudioCourseCatalog(courseId)?.lessons ?? null;
}

/**
 * The course catalog: the built-in Studio grammar course, plus the radicals the
 * caller read from the database.
 */
export function getPublishedStudioCatalog({
 includeLessons,
 radicals,
}: {
 includeLessons: boolean;
 radicals: StaticRadicalData[];
}): HanziHomeCatalogData {
 const grammarCourse = getStaticStudioCourseCatalog("hanzihome-studio-grammar");
 return {
  source: "static",
  courses: grammarCourse ? [grammarCourse.course] : [],
  books: grammarCourse?.books ?? [],
  lessons: includeLessons ? (grammarCourse?.lessons ?? []) : [],
  radicals,
  meta: {
   app: "hanzihome",
   dataset: "static",
   version: "2",
   generatedAt: "",
   sourceFiles: ["src/features/hanzihome/static-json/studio-seed.json"],
   counts: {
    lessons: grammarCourse?.course.stats.lessonCount ?? 0,
    vocab: grammarCourse?.course.stats.vocabCount ?? 0,
    grammarPoints: grammarCourse?.course.stats.grammarCount ?? 0,
    radicals: radicals.length,
    flashcards: 0,
   },
  },
 };
}

export function getPublishedStudioLessonDetail(lessonId: string) {
 if (!isPublishedStudioContentId(lessonId)) return null;
 return getStaticStudioLessonDetail(lessonId);
}

export function getPublishedStudioLessonVocabulary(lessonId: string) {
 const lesson = getPublishedStudioLessonDetail(lessonId);
 if (!lesson) return null;

 return {
  lessonId,
  items: lesson.vocab,
  total: lesson.vocab.length,
 };
}

export function getPublishedStudioAggregateItems({
 kind,
 filters,
}: {
 kind: AggregateKind;
 filters: AggregateFilters;
}): AggregateResourceItem[] {
 return getStaticStudioAggregateItems({ kind, filters });
}

export function getPublishedStudioListeningLessonBundle(lessonId: string) {
 if (!isPublishedStudioDictationLessonId(lessonId)) return null;
 return getStaticStudioListeningLessonBundle(lessonId);
}
