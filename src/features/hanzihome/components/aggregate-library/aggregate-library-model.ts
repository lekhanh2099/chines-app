import type { AggregateFilters } from "@/features/hanzihome/repositories/hanzihome-content-resources";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";

export function createEmptyAggregateFilters(): AggregateFilters {
 return {
  courseId: "",
  bookId: "",
  lessonId: "",
  q: "",
 };
}

export function applyAggregateFilterChange(
 current: AggregateFilters,
 key: keyof AggregateFilters,
 value: string,
): AggregateFilters {
 const next = {
  ...current,
  [key]: value,
 };

 if (key === "courseId") {
  next.bookId = "";
  next.lessonId = "";
 }

 if (key === "bookId") next.lessonId = "";

 return next;
}

export function buildLessonByReviewItemId(
 lessons: HanziHomeLesson[],
): Map<string, HanziHomeLesson> {
 const byId = new Map<string, HanziHomeLesson>();

 for (const lesson of lessons) {
  for (const word of lesson.vocab) {
   byId.set(`vocab:${getVocabItemKey(word)}`, lesson);
  }
  for (const point of lesson.grammar) byId.set(`grammar:${point.id}`, lesson);
 }

 return byId;
}
