import type {
 AggregateGrammarItem,
 AggregateKind,
 AggregateResourceItem,
 AggregateVocabItem,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

export function formatLessonHeading(lessonNumber: number, lessonTitle: string) {
 const trimmedTitle = lessonTitle.trim();

 if (/^Bài\s+\d+[:：]/i.test(trimmedTitle)) {
  return trimmedTitle;
 }

 return `Bài ${lessonNumber}: ${trimmedTitle}`;
}

export function formatSelectedLessonsLabel(
 lessons: Array<{
  lessonNumber: number;
  title: string;
  titleZh: string;
 }>,
) {
 if (lessons.length === 0) return "";
 if (lessons.length === 1) {
  return formatLessonHeading(lessons[0].lessonNumber, lessons[0].titleZh || lessons[0].title);
 }

 return `${lessons.length} bài đang ôn`;
}

export function combineReviewLessons(
 lessons: HanziHomeLesson[],
 kind: AggregateKind,
): HanziHomeLesson {
 const firstLesson = lessons[0];

 return {
  ...firstLesson,
  id: lessons.map((lesson) => lesson.id).join("__"),
  title: lessons.length === 1 ? firstLesson.title : `${lessons.length} bài đã chọn`,
  titleZh: lessons.length === 1 ? firstLesson.titleZh : `${lessons.length} bài đã chọn`,
  vocab: kind === "vocab" ? lessons.flatMap((lesson) => lesson.vocab) : [],
  grammar: kind === "grammar" ? lessons.flatMap((lesson) => lesson.grammar) : [],
  vocabIds: kind === "vocab" ? lessons.flatMap((lesson) => lesson.vocabIds) : [],
  grammarPointIds: kind === "grammar" ? lessons.flatMap((lesson) => lesson.grammarPointIds) : [],
 };
}

export function isAggregateVocabItem(item: AggregateResourceItem): item is AggregateVocabItem {
 return "word" in item;
}

export function groupByLesson(items: AggregateResourceItem[]) {
 const groups = new Map<
  string,
  {
   lessonId: string;
   courseId: string;
   lessonNumber: number;
   lessonOrder: number;
   lessonTitle: string;
   items: AggregateResourceItem[];
  }
 >();

 for (const item of items) {
  const current = groups.get(item.lessonId);

  if (current) {
   current.items.push(item);
  } else {
   groups.set(item.lessonId, {
    lessonId: item.lessonId,
    courseId: item.courseId,
    lessonNumber: item.lessonNumber,
    lessonOrder: item.lessonOrder,
    lessonTitle: item.lessonTitle,
    items: [item],
   });
  }
 }

 return Array.from(groups.values()).sort(
  (a, b) => a.lessonOrder - b.lessonOrder || a.lessonNumber - b.lessonNumber,
 );
}

export type { AggregateGrammarItem, AggregateKind, AggregateResourceItem, AggregateVocabItem };
