import { sortLessonsByCourseBookOrder } from "@/features/hanzihome/courses/course-catalog";
import type { HanziHomeCatalogData, HanziHomeLesson } from "@/features/hanzihome/types";
import { adaptHanziHomeGrammarToPip } from "./pip-grammar-adapter";
import type { BookmarkedTextbookGroup, StudyBundle } from "./vocab-hub-adapter";
import { buildExercisesFromVocabItems } from "./vocab-hub-custom";

/** Select values of the "any lesson" picker: `catalog:<lessonId>` or `static:<lessonId>`. */
const CATALOG_PREFIX = "catalog:";
const STATIC_PREFIX = "static:";

export type AnyLessonOption = {
 readonly value: string;
 readonly lessonId: string;
 readonly isCatalog: boolean;
 readonly label: string;
 readonly bookTitle: string;
};

export type AnyLessonGroup = {
 readonly key: string;
 readonly label: string;
 readonly lessons: readonly AnyLessonOption[];
};

/**
 * Groups catalog lesson summaries by course and book (course order, then book
 * order, then lesson order). Only summaries are read; no lesson detail is needed.
 */
export function buildCatalogLessonGroups(
 catalog: Pick<HanziHomeCatalogData, "courses" | "books" | "lessons">,
 format: {
  group: (courseTitle: string, bookTitle: string) => string;
  lesson: (lessonNumber: number, title: string) => string;
 },
): AnyLessonGroup[] {
 return catalog.courses
  .toSorted((a, b) => a.order - b.order)
  .flatMap((course) => {
   const courseLessons = sortLessonsByCourseBookOrder(
    catalog.lessons.filter((lesson) => lesson.courseId === course.id),
   );
   const books = catalog.books
    .filter((book) => book.courseId === course.id)
    .toSorted((a, b) => a.order - b.order);
   const bookTargets = books.length
    ? books.map((book) => ({
       key: `catalog:${book.id}`,
       title: book.title,
       label: book.title === course.title ? course.title : format.group(course.title, book.title),
       lessons: courseLessons.filter((lesson) => lesson.bookId === book.id),
      }))
    : [
       {
        key: `catalog-course:${course.id}`,
        title: course.title,
        label: course.title,
        lessons: courseLessons,
       },
      ];
   return bookTargets
    .filter((book) => book.lessons.length > 0)
    .map((book) => ({
     key: book.key,
     label: book.label,
     lessons: book.lessons.map((lesson) => ({
      value: `${CATALOG_PREFIX}${lesson.id}`,
      lessonId: lesson.id,
      isCatalog: true,
      label: format.lesson(lesson.lessonNumber, lesson.titleZh || lesson.title),
      bookTitle: book.label,
     })),
    }));
  });
}

/** Maps the static textbook summaries onto picker groups (one group per book). */
export function buildTextbookLessonGroups(
 groups: readonly BookmarkedTextbookGroup[],
): AnyLessonGroup[] {
 return groups.map((group) => ({
  key: `static:${group.bookKey}`,
  label: group.bookLabel,
  lessons: group.lessons.map((lesson) => ({
   value: `${STATIC_PREFIX}${lesson.id}`,
   lessonId: lesson.id,
   isCatalog: false,
   label: lesson.title,
   bookTitle: group.bookLabel,
  })),
 }));
}

export function findAnyLessonOption(groups: readonly AnyLessonGroup[], selection: string) {
 if (!selection) return undefined;
 for (const group of groups) {
  const option = group.lessons.find((lesson) => lesson.value === selection);
  if (option) return option;
 }
 return undefined;
}

/**
 * Builds the PiP deck for one catalog lesson from its canonical vocabulary
 * resource and typed grammar. Practice is generated from the vocabulary; the
 * lesson's own exercises have no PiP adapter yet and are not claimed.
 */
export function buildCatalogLessonBundle(lesson: HanziHomeLesson, title: string): StudyBundle {
 return {
  title,
  vocabItems: lesson.vocab,
  grammarItems: adaptHanziHomeGrammarToPip(lesson.grammar),
  practiceItems: buildExercisesFromVocabItems(lesson.vocab),
 };
}

/**
 * Decides what the "any lesson" source shows. A bundle is only shown when it was
 * built for the current selection, so a previous lesson's deck never appears under
 * a new lesson name while that lesson is loading or failed. An empty `status`
 * means the deck is ready to study.
 */
export function resolveAnyLessonDeck({
 selection,
 option,
 isSummaryLoading,
 isLoading,
 isError,
 isMissing,
 bundle,
 emptyBundle,
 messages,
}: {
 selection: string;
 option?: AnyLessonOption;
 isSummaryLoading: boolean;
 isLoading: boolean;
 isError: boolean;
 isMissing: boolean;
 bundle?: StudyBundle;
 emptyBundle: StudyBundle;
 messages: {
  placeholder: string;
  loading: string;
  error: string;
  missing: string;
  empty: string;
 };
}) {
 const blocked = (status: string, canRetry = false) => ({ bundle: emptyBundle, status, canRetry });
 if (!selection) return blocked(messages.placeholder);
 if (!option) return blocked(isSummaryLoading ? messages.loading : messages.missing);
 if (isMissing) return blocked(messages.missing);
 if (isError) return blocked(messages.error, true);
 if (isLoading || !bundle) return blocked(messages.loading);
 if (bundle.vocabItems.length === 0) return { bundle, status: messages.empty, canRetry: false };
 return { bundle, status: "", canRetry: false };
}
