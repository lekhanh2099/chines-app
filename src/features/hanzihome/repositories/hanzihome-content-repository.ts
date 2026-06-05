import {
 getHanziHomeCatalogSummary,
 getHanziHomeCourseLessonSummaries,
 getHanziHomeData,
 getHanziHomeLessonDetail,
} from "@/features/hanzihome/static-data";
import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import type {
 GrammarViewModel,
 HanziHomeCatalogData,
 HanziHomeLesson,
 HanziHomeVocabItem,
} from "@/features/hanzihome/types";
import {
 buildLessonGrammarResource,
 buildLessonOverviewResource,
 buildLessonSectionsResource,
 buildLessonVocabularyResource,
 type AggregateFilters,
 type AggregateGrammarItem,
 type AggregateKind,
 type AggregateResourceItem,
 type AggregateVocabItem,
 type LessonGrammarListResource,
 type LessonOverviewResource,
 type LessonSectionsResource,
 type LessonVocabularyListResource,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";

export type HanzihomeContentRepository = {
 getCatalogSummary: (options?: {
  includeLessons?: boolean;
 }) => HanziHomeCatalogData;
 getCourseLessonSummaries: (courseId: string) => HanziHomeLesson[];
 getLessonOverview: (lessonId: string) => LessonOverviewResource | null;
 getLessonDetail: (lessonId: string | null | undefined) => HanziHomeLesson | null;
 getLessonSections: (lessonId: string) => LessonSectionsResource | null;
 getLessonSection: (sectionId: string) => Section | null;
 getLessonVocabulary: (lessonId: string) => LessonVocabularyListResource | null;
 getVocabDetail: (vocabId: string) => HanziHomeVocabItem | null;
 getLessonGrammar: (lessonId: string) => LessonGrammarListResource | null;
 getGrammarDetail: (grammarId: string) => GrammarViewModel | null;
 getAggregateItems: (input: {
  kind: AggregateKind;
  filters: AggregateFilters;
 }) => AggregateResourceItem[];
 getAllLessonDetails: () => HanziHomeLesson[];
};

function matchesTextQuery(values: string[], query: string) {
 const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
 if (!normalizedQuery) return true;

 return values.some((value) =>
  value.toLocaleLowerCase("vi-VN").includes(normalizedQuery),
 );
}

function getFilteredLessons(filters: AggregateFilters) {
 return getHanziHomeData().lessons.filter((lesson) => {
  if (filters.courseId && lesson.courseId !== filters.courseId) return false;
  if (filters.bookId && lesson.bookId !== filters.bookId) return false;
  if (filters.lessonId && lesson.id !== filters.lessonId) return false;
  return true;
 });
}

export const staticHanzihomeContentRepository: HanzihomeContentRepository = {
 getCatalogSummary: ({ includeLessons = false } = {}) =>
  getHanziHomeCatalogSummary(includeLessons),

 getCourseLessonSummaries: (courseId) =>
  getHanziHomeCourseLessonSummaries(courseId),

 getLessonOverview: (lessonId) => {
  const lesson = getHanziHomeLessonDetail(lessonId);

  return lesson ? buildLessonOverviewResource(lesson) : null;
 },

 getLessonDetail: (lessonId) => getHanziHomeLessonDetail(lessonId),

 getLessonSections: (lessonId) => {
  const lesson = getHanziHomeLessonDetail(lessonId);
  return lesson ? buildLessonSectionsResource(lesson) : null;
 },

 getLessonSection: (sectionId) => {
  for (const lesson of getHanziHomeData().lessons) {
   const section = lesson.sourceLesson?.lesson.sections.find(
    (item) => item.id === sectionId,
   );

   if (section) return section;
  }

  return null;
 },

 getLessonVocabulary: (lessonId) => {
  const lesson = getHanziHomeLessonDetail(lessonId);

  return lesson ? buildLessonVocabularyResource(lesson) : null;
 },

 getVocabDetail: (vocabId) => {
  for (const lesson of getHanziHomeData().lessons) {
   const item = lesson.vocab.find(
    (vocab) => vocab.runtimeId === vocabId || vocab.id === vocabId,
   );

   if (item) return item;
  }

  return null;
 },

 getLessonGrammar: (lessonId) => {
  const lesson = getHanziHomeLessonDetail(lessonId);

  return lesson ? buildLessonGrammarResource(lesson) : null;
 },

 getGrammarDetail: (grammarId) => {
  for (const lesson of getHanziHomeData().lessons) {
   const item = lesson.grammar.find((grammar) => grammar.id === grammarId);

   if (item) return item;
  }

  return null;
 },

 getAggregateItems: ({ kind, filters }) => {
  const lessons = getFilteredLessons(filters);

  if (kind === "vocab") {
   return lessons.flatMap((lesson) =>
    lesson.vocab
     .map((item): AggregateVocabItem => ({
      id: item.runtimeId,
      courseId: lesson.courseId || "",
      bookId: lesson.bookId || "",
      lessonId: lesson.id,
      lessonNumber: lesson.lessonNumber,
      lessonOrder: lesson.lessonOrder ?? lesson.lessonNumber,
      lessonTitle: lesson.titleZh || lesson.title,
      word: item.hanzi,
      pinyin: item.pinyin,
      hanViet: item.meaning.hanviet || "",
      meaning: item.meaning.meaning_vi,
      category: item.category,
      level: item.level_tag,
      pos: {
       vi: item.pos.raw_vi || item.pos.normalized,
       zh: item.pos.raw_cn || item.pos.normalized,
      },
     }))
     .filter((item) =>
      matchesTextQuery(
       [
        item.word,
        item.pinyin,
        item.hanViet,
        item.meaning,
        item.category,
        item.lessonTitle,
       ],
       filters.q,
      ),
     ),
   );
  }

  return lessons.flatMap((lesson) =>
   lesson.grammar
    .map((item): AggregateGrammarItem => ({
     id: item.id,
     courseId: lesson.courseId || "",
     bookId: lesson.bookId || "",
     lessonId: lesson.id,
     lessonNumber: lesson.lessonNumber,
     lessonOrder: lesson.lessonOrder ?? lesson.lessonNumber,
     lessonTitle: lesson.titleZh || lesson.title,
     title: item.title || item.cleanTitle,
     cleanTitle: item.cleanTitle,
     core: item.core,
    }))
    .filter((item) =>
     matchesTextQuery(
      [item.title, item.cleanTitle, item.core, item.lessonTitle],
      filters.q,
     ),
    ),
  );
 },

 getAllLessonDetails: () => getHanziHomeData().lessons,
};

export const hanzihomeContentRepository = staticHanzihomeContentRepository;
