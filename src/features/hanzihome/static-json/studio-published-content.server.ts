import "server-only";

import type {
 AggregateFilters,
 AggregateKind,
 AggregateResourceItem,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import type { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
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

type HanziHomeCatalogSummary = Awaited<
 ReturnType<(typeof hanzihomeContentRepository)["getCatalogSummary"]>
>;

export {
 isPublishedStudioContentId,
 isPublishedStudioDictationLessonId,
 isPublishedStudioGrammarCourseId,
};

export function getPublishedStudioCourseLessons(courseId: string) {
 if (!isPublishedStudioGrammarCourseId(courseId)) return null;
 return getStaticStudioCourseCatalog(courseId)?.lessons ?? null;
}

export function mergePublishedStudioCatalog(
 catalog: HanziHomeCatalogSummary,
 includeLessons: boolean,
) {
 const staticGrammarCourse = getStaticStudioCourseCatalog("hanzihome-studio-grammar");
 if (!staticGrammarCourse) return catalog;

 const existingStaticCourse = catalog.courses.find(
  (course) => course.id === staticGrammarCourse.course.id,
 );
 const withoutStaticCourse = catalog.courses.filter(
  (course) => course.id !== staticGrammarCourse.course.id,
 );
 const withoutStaticBooks = catalog.books.filter(
  (book) => book.courseId !== staticGrammarCourse.course.id,
 );
 const withoutStaticLessons = catalog.lessons.filter(
  (lesson) => lesson.courseId !== staticGrammarCourse.course.id,
 );

 return {
  ...catalog,
  courses: [...withoutStaticCourse, staticGrammarCourse.course],
  books: [...withoutStaticBooks, ...staticGrammarCourse.books],
  lessons: includeLessons
   ? [...withoutStaticLessons, ...staticGrammarCourse.lessons]
   : withoutStaticLessons,
  meta: {
   ...catalog.meta,
   sourceFiles: [
    ...catalog.meta.sourceFiles,
    "src/features/hanzihome/static-json/studio-seed.json",
   ],
   counts: {
    ...catalog.meta.counts,
    lessons:
     catalog.meta.counts.lessons -
     (existingStaticCourse?.stats.lessonCount ?? 0) +
     staticGrammarCourse.course.stats.lessonCount,
    vocab:
     catalog.meta.counts.vocab -
     (existingStaticCourse?.stats.vocabCount ?? 0) +
     staticGrammarCourse.course.stats.vocabCount,
    grammarPoints:
     catalog.meta.counts.grammarPoints -
     (existingStaticCourse?.stats.grammarCount ?? 0) +
     staticGrammarCourse.course.stats.grammarCount,
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

export function isPublishedStudioAggregateScope(filters: AggregateFilters): boolean {
 const scopedId = filters.courseId || filters.bookId || filters.lessonId;
 return isPublishedStudioContentId(scopedId);
}

export function getPublishedStudioListeningLessonBundle(lessonId: string) {
 if (!isPublishedStudioDictationLessonId(lessonId)) return null;
 return getStaticStudioListeningLessonBundle(lessonId);
}
