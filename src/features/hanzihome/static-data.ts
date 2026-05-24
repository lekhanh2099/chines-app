import bundle from "../../../data/hanzihome/hanzihome_bundle_clean.json";
import {
  hanzihomeCourseBooks,
  hanzihomeCourses,
  withDefaultCourseMeta,
} from "@/features/hanzihome/courses/course-catalog";
import { buildGrammarViewModel } from "@/features/hanzihome/utils/grammar-view-model";
import { buildVocabViewModel } from "@/features/hanzihome/utils/vocab-view-model";
import type {
  HanziHomeCatalogCourse,
  HanziHomeCatalogData,
  HanziHomeData,
  HanziHomeLesson,
} from "@/features/hanzihome/types";

function getStaticRadicals() {
  return [...bundle.radicals].sort((a, b) => a.index - b.index);
}

function getStaticLessonSummary(
  lesson: (typeof bundle.lessons)[number],
): HanziHomeLesson {
  return withDefaultCourseMeta({
    ...lesson,
    title: `Bài ${lesson.lessonNumber}: ${lesson.titleZh}`,
    vocab: [],
    grammar: [],
  });
}

function buildStaticLessonDetail(
  lesson: (typeof bundle.lessons)[number],
): HanziHomeLesson {
  const vocab = bundle.vocab
    .filter((entry) => entry.lessonId === lesson.id)
    .map((entry) => buildVocabViewModel(entry, lesson));

  const grammar = bundle.grammarPoints
    .filter((point) => point.lessonId === lesson.id)
    .map(buildGrammarViewModel);

  return withDefaultCourseMeta({
    ...lesson,
    title: `Bài ${lesson.lessonNumber}: ${lesson.titleZh}`,
    vocab,
    grammar,
  });
}

export function getHanziHomeCatalogSummary(
  includeLessons = false,
): HanziHomeCatalogData {
  const lessons = bundle.lessons.map(getStaticLessonSummary);
  const courses: HanziHomeCatalogCourse[] = hanzihomeCourses.map((course) => {
    const courseLessons = lessons.filter(
      (lesson) => lesson.courseId === course.id,
    );
    const courseBooks = hanzihomeCourseBooks.filter(
      (book) => book.courseId === course.id,
    );
    const courseLessonIds = new Set(courseLessons.map((lesson) => lesson.id));
    const fallbackLesson = courseLessons.at(-1);

    return {
      ...course,
      stats: {
        bookCount: courseBooks.length,
        lessonCount: courseLessons.length,
        vocabCount: bundle.vocab.filter((item) =>
          courseLessonIds.has(item.lessonId),
        ).length,
        grammarCount: bundle.grammarPoints.filter((item) =>
          courseLessonIds.has(item.lessonId),
        ).length,
      },
      fallbackLessonId: fallbackLesson?.id,
    };
  });

  return {
    source: "static",
    courses,
    books: hanzihomeCourseBooks,
    lessons: includeLessons ? lessons : [],
    radicals: getStaticRadicals(),
    meta: bundle.meta,
  };
}

export function getHanziHomeLessonDetail(
  lessonId: string | null | undefined,
): HanziHomeLesson | null {
  const lesson = bundle.lessons.find((item) => item.id === lessonId);

  return lesson ? buildStaticLessonDetail(lesson) : null;
}

export function getHanziHomeData(): HanziHomeData {
  const lessons: HanziHomeLesson[] = bundle.lessons.map(buildStaticLessonDetail);

  return {
    courses: hanzihomeCourses,
    books: hanzihomeCourseBooks,
    lessons,
    radicals: getStaticRadicals(),
    meta: bundle.meta,
  };
}
