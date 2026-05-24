import { getHanziHomeData } from "@/features/hanzihome/static-data";

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

export function getStaticAggregateVocabFallback(filters: AggregateFilters) {
 const data = getHanziHomeData();
 const q = normalizeSearch(filters.q);
 const limit = safeLimit(filters.limit, 1500);

 return data.lessons
  .filter((lesson) => {
   if (filters.courseId && lesson.courseId !== filters.courseId) return false;
   if (filters.bookId && lesson.bookId !== filters.bookId) return false;
   if (filters.lessonId && lesson.id !== filters.lessonId) return false;
   return true;
  })
  .flatMap((lesson) =>
   lesson.vocab
    .filter((item) =>
     matchesSearch([item.word, item.pinyin, item.hanViet, item.meaning], q),
    )
    .map((item) => ({
     id: item.id,
     courseId: lesson.courseId || "",
     bookId: lesson.bookId || "",
     lessonId: lesson.id,
     lessonNumber: lesson.lessonNumber,
     lessonOrder: lesson.lessonOrder ?? lesson.lessonNumber,
     lessonTitle: lesson.title,
     word: item.word,
     pinyin: item.pinyin,
     hanViet: item.hanViet,
     meaning: item.meaning,
     category: item.category,
     level: item.level,
     pos: item.pos,
    })),
  )
  .slice(0, limit);
}

export function getStaticAggregateGrammarFallback(filters: AggregateFilters) {
 const data = getHanziHomeData();
 const q = normalizeSearch(filters.q);
 const limit = safeLimit(filters.limit, 1000);

 return data.lessons
  .filter((lesson) => {
   if (filters.courseId && lesson.courseId !== filters.courseId) return false;
   if (filters.bookId && lesson.bookId !== filters.bookId) return false;
   if (filters.lessonId && lesson.id !== filters.lessonId) return false;
   return true;
  })
  .flatMap((lesson) =>
   lesson.grammar
    .filter((item) =>
     matchesSearch([item.title, item.cleanTitle, item.core], q),
    )
    .map((item) => ({
     id: item.id,
     courseId: lesson.courseId || "",
     bookId: lesson.bookId || "",
     lessonId: lesson.id,
     lessonNumber: lesson.lessonNumber,
     lessonOrder: lesson.lessonOrder ?? lesson.lessonNumber,
     lessonTitle: lesson.title,
     title: item.title || item.cleanTitle,
     cleanTitle: item.cleanTitle,
     core: item.core,
    })),
  )
  .slice(0, limit);
}
