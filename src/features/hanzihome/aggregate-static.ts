import bundle from "../../../data/hanzihome/hanzihome_bundle_clean.json";

import {
 DEFAULT_HANYU_BOOK_ID,
 DEFAULT_HANYU_COURSE_ID,
} from "./courses/course-catalog";

type AggregateFilters = {
 courseId?: string | null;
 bookId?: string | null;
 lessonId?: string | null;
 q?: string | null;
 limit?: number;
};

function normalizeSearch(value: string | null | undefined) {
 return value?.trim().toLowerCase() || "";
}

function matchesSearch(values: Array<string | undefined>, q: string) {
 if (!q) return true;

 return values.some((value) => value?.toLowerCase().includes(q));
}

function safeLimit(value: number | undefined, fallback: number) {
 if (!Number.isFinite(value)) return fallback;

 return Math.min(Math.max(Math.trunc(value ?? fallback), 1), fallback);
}

function getVocabCategory(item: (typeof bundle.vocab)[number]) {
 return "category" in item && typeof item.category === "string"
  ? item.category
  : "Khác";
}

const lessonsById = new Map(
 bundle.lessons.map((lesson) => [
  lesson.id,
  {
   id: lesson.id,
   lessonNumber: lesson.lessonNumber,
   lessonOrder: lesson.lessonNumber,
   title: `Bài ${lesson.lessonNumber}: ${lesson.titleZh}`,
   titleZh: lesson.titleZh,
   courseId: DEFAULT_HANYU_COURSE_ID,
   bookId: DEFAULT_HANYU_BOOK_ID,
  },
 ]),
);

function matchesLessonFilters(
 lesson: { id: string; courseId: string; bookId: string } | undefined,
 filters: AggregateFilters,
) {
 if (!lesson) return false;
 if (filters.courseId && lesson.courseId !== filters.courseId) return false;
 if (filters.bookId && lesson.bookId !== filters.bookId) return false;
 if (filters.lessonId && lesson.id !== filters.lessonId) return false;

 return true;
}

export function getStaticAggregateVocabFallback(filters: AggregateFilters) {
 const q = normalizeSearch(filters.q);
 const limit = safeLimit(filters.limit, 1500);

 return bundle.vocab
  .filter((item) => {
   const lesson = lessonsById.get(item.lessonId);

   if (!matchesLessonFilters(lesson, filters)) return false;

   return matchesSearch([item.word, item.pinyin, item.hanViet, item.meaning], q);
  })
  .map((item) => {
   const lesson = lessonsById.get(item.lessonId);

   return {
    id: item.id,
    courseId: lesson?.courseId || DEFAULT_HANYU_COURSE_ID,
    bookId: lesson?.bookId || DEFAULT_HANYU_BOOK_ID,
    lessonId: item.lessonId,
    lessonNumber: lesson?.lessonNumber ?? item.lessonNumber,
    lessonOrder: lesson?.lessonOrder ?? item.lessonNumber,
    lessonTitle: lesson?.title || `Bài ${item.lessonNumber}`,
    word: item.word,
    pinyin: item.pinyin,
    hanViet: item.hanViet,
    meaning: item.meaning,
    category: getVocabCategory(item),
    level: item.level ?? undefined,
    pos: item.pos ?? undefined,
   };
  })
  .slice(0, limit);
}

export function getStaticAggregateGrammarFallback(filters: AggregateFilters) {
 const q = normalizeSearch(filters.q);
 const limit = safeLimit(filters.limit, 1000);

 return bundle.grammarPoints
  .filter((item) => {
   const lesson = lessonsById.get(item.lessonId);

   if (!matchesLessonFilters(lesson, filters)) return false;

   return matchesSearch([item.title, item.contentMd], q);
  })
  .map((item) => {
   const lesson = lessonsById.get(item.lessonId);

   return {
    id: item.id,
    courseId: lesson?.courseId || DEFAULT_HANYU_COURSE_ID,
    bookId: lesson?.bookId || DEFAULT_HANYU_BOOK_ID,
    lessonId: item.lessonId,
    lessonNumber: lesson?.lessonNumber ?? item.lessonNumber,
    lessonOrder: lesson?.lessonOrder ?? item.lessonNumber,
    lessonTitle: lesson?.title || `Bài ${item.lessonNumber}`,
    title: item.title,
    cleanTitle: item.title.replace(/^\\d+\\\\?\\.\\s*/, ""),
    core: item.contentMd?.split("\n").find((line) => line.trim()) || item.title,
   };
  })
  .slice(0, limit);
}
