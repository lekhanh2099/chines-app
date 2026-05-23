import bundle from "../../../data/hanzihome/hanzihome_bundle_clean.json";
import {
  hanzihomeCourseBooks,
  hanzihomeCourses,
  withDefaultCourseMeta,
} from "@/features/hanzihome/courses/course-catalog";
import { buildGrammarViewModel } from "@/features/hanzihome/utils/grammar-view-model";
import { buildVocabViewModel } from "@/features/hanzihome/utils/vocab-view-model";
import type {
  HanziHomeData,
  HanziHomeLesson,
} from "@/features/hanzihome/types";

export function getHanziHomeData(): HanziHomeData {
  const radicals = [...bundle.radicals].sort((a, b) => a.index - b.index);

  const lessons: HanziHomeLesson[] = bundle.lessons.map((lesson) => {
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
  });

  return {
    courses: hanzihomeCourses,
    books: hanzihomeCourseBooks,
    lessons,
    radicals,
    meta: bundle.meta,
  };
}
