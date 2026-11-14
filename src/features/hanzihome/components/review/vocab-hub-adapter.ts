import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import {
 getTextbookCatalog,
 getTextbookLesson,
 type TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { textbookLessonToReviewLesson } from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import { adaptAllLessonExercises } from "@/features/hanzihome/components/practice/universal-exercise-adapter";
import type { UniversalExerciseItem } from "@/features/hanzihome/components/practice/universal-exercise.types";
import { adaptTextbookGrammarToPip, type PipGrammarPoint } from "./pip-grammar-adapter";
import { buildExercisesFromVocabItems } from "./vocab-hub-custom";

export type BookmarkedLessonEntry = {
 readonly id: string;
 readonly bookKey: TextbookLesson["bookKey"];
 readonly bookLabel: string;
 readonly number: number;
 readonly title: string;
 readonly vocabCount: number;
};

export type BookmarkedTextbookGroup = {
 readonly bookKey: TextbookLesson["bookKey"];
 readonly bookLabel: string;
 readonly lessons: readonly BookmarkedLessonEntry[];
 readonly totalVocabCount: number;
};

export type StudyBundle = {
 readonly title: string;
 readonly vocabItems: readonly HanziHomeVocabItem[];
 readonly grammarItems: readonly PipGrammarPoint[];
 readonly practiceItems: readonly UniversalExerciseItem[];
};

export function getBookmarkedTextbookGroups(
 bookmarkedLessonIds: readonly string[],
): BookmarkedTextbookGroup[] {
 const bookmarkedSet = new Set(bookmarkedLessonIds);
 const catalog = getTextbookCatalog();
 const groups: BookmarkedTextbookGroup[] = [];

 for (const book of catalog) {
  const matchedLessons: BookmarkedLessonEntry[] = book.lessons
   .filter((lesson) => bookmarkedSet.has(lesson.id))
   .map((lesson) => ({
    id: lesson.id,
    bookKey: lesson.bookKey,
    bookLabel: book.label,
    number: lesson.number,
    title: lesson.title,
    vocabCount: lesson.vocabCount,
   }));

  if (matchedLessons.length > 0) {
   const totalVocabCount = matchedLessons.reduce((sum, l) => sum + l.vocabCount, 0);
   groups.push({
    bookKey: book.key,
    bookLabel: book.label,
    lessons: matchedLessons,
    totalVocabCount,
   });
  }
 }

 return groups;
}

export function buildStudyBundleFromBookmarkedLessons(
 selectedLessonEntries: readonly BookmarkedLessonEntry[],
): StudyBundle {
 const vocabItems: HanziHomeVocabItem[] = [];
 const grammarItems: PipGrammarPoint[] = [];
 const practiceItems: UniversalExerciseItem[] = [];
 const seenVocabIds = new Set<string>();

 for (const entry of selectedLessonEntries) {
  const fullLesson = getTextbookLesson(entry.bookKey, entry.number);
  if (!fullLesson) continue;

  const reviewLesson = textbookLessonToReviewLesson(fullLesson);
  for (const word of reviewLesson.vocab) {
   const uniqueKey = `${entry.id}:${word.id}`;
   if (seenVocabIds.has(uniqueKey)) continue;
   seenVocabIds.add(uniqueKey);
   vocabItems.push(word);
  }

  const lessonGrammar = adaptTextbookGrammarToPip(fullLesson.sections);
  grammarItems.push(...lessonGrammar);

  const lessonExercises = adaptAllLessonExercises(fullLesson);
  practiceItems.push(...lessonExercises);
 }

 const fallbackExercises =
  practiceItems.length > 0 ? practiceItems : buildExercisesFromVocabItems(vocabItems);

 const title =
  selectedLessonEntries.length === 1
   ? `${selectedLessonEntries[0]?.bookLabel ?? "Giáo trình"} · ${selectedLessonEntries[0]?.title ?? ""}`
   : `Ôn tập ${selectedLessonEntries.length} bài đã đánh dấu`;

 return {
  title,
  vocabItems,
  grammarItems,
  practiceItems: fallbackExercises,
 };
}
