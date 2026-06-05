import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import type {
 GrammarViewModel,
 HanziHomeLesson,
 HanziHomeVocabItem,
} from "@/features/hanzihome/types";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";

export type LessonSectionKind =
 | "lessonText"
 | "vocabulary"
 | "grammar"
 | "exercises"
 | "reading"
 | "notes"
 | "properNouns"
 | "characterWriting"
 | "summary";

export type LessonSectionResource = {
 id: string;
 lessonId: string;
 type: LessonSectionKind;
 title: string;
 count: number;
 order: number;
 href: string;
};

export type LessonOverviewResource = {
 id: string;
 courseId: string;
 bookId: string;
 lessonNumber: number;
 titleZh: string;
 titleVi: string;
 titlePinyin: string;
 sections: LessonSectionResource[];
 counts: {
  vocab: number;
  grammar: number;
  sections: number;
 };
 preview: {
  vocab: string[];
  grammar: string[];
 };
};

export type LessonVocabularyListResource = {
 lessonId: string;
 items: HanziHomeVocabItem[];
 total: number;
};

export type LessonGrammarListResource = {
 lessonId: string;
 items: GrammarViewModel[];
 total: number;
};

export type LessonSectionsResource = {
 lessonId: string;
 sections: Section[];
 total: number;
};

export type AggregateKind = "vocab" | "grammar";

export type AggregateFilters = {
 courseId: string;
 bookId: string;
 lessonId: string;
 q: string;
};

export type AggregateVocabItem = {
 id: string;
 courseId: string;
 bookId: string;
 lessonId: string;
 lessonNumber: number;
 lessonOrder: number;
 lessonTitle: string;
 word: string;
 pinyin: string;
 hanViet: string;
 meaning: string;
 category: string;
 level?: string | null;
 pos?: {
  vi?: string | null;
  zh?: string | null;
 } | null;
};

export type AggregateGrammarItem = {
 id: string;
 courseId: string;
 bookId: string;
 lessonId: string;
 lessonNumber: number;
 lessonOrder: number;
 lessonTitle: string;
 title: string;
 cleanTitle: string;
 core: string;
};

export type AggregateResourceItem = AggregateVocabItem | AggregateGrammarItem;

function getSectionResourceCount(section: Section) {
 if ("items" in section && Array.isArray(section.items)) {
  return section.items.length;
 }

 if ("blocks" in section && Array.isArray(section.blocks)) {
  return section.blocks.length;
 }

 return 0;
}

function mapSourceSectionType(type: string): LessonSectionKind {
 switch (type) {
  case "text":
   return "lessonText";
  case "vocabulary":
   return "vocabulary";
  case "proper_nouns":
   return "properNouns";
  case "notes":
   return "notes";
  case "grammar":
   return "grammar";
  case "exercises":
   return "exercises";
  case "reading":
   return "reading";
  case "character_writing":
   return "characterWriting";
  case "summary":
   return "summary";
  default:
   return "summary";
 }
}

function buildLessonSectionHref(lesson: HanziHomeLesson, type: string) {
 const targetModule =
  type === "vocabulary"
   ? "vocab"
   : type === "grammar"
     ? "grammar"
     : type === "notes"
       ? "notes"
       : "lessonText";

 return buildHanziHomeLessonHref({
  courseId: lesson.courseId || "",
  lessonNumber: lesson.lessonNumber,
  module: targetModule,
 });
}

export function buildLessonSectionResources(
 lesson: HanziHomeLesson,
): LessonSectionResource[] {
 const sourceSections = lesson.sourceLesson?.lesson.sections ?? [];

 return sourceSections
  .map((section): LessonSectionResource => {
   return {
    id: section.id,
    lessonId: lesson.id,
    type: mapSourceSectionType(section.type),
    title: section.title_vi || section.title,
    count: getSectionResourceCount(section),
    order: section.order,
    href: buildLessonSectionHref(lesson, section.type),
   };
  })
  .sort((a, b) => a.order - b.order);
}

export function buildLessonOverviewResource(
 lesson: HanziHomeLesson,
): LessonOverviewResource {
 return {
  id: lesson.id,
  courseId: lesson.courseId || "",
  bookId: lesson.bookId || "",
  lessonNumber: lesson.lessonNumber,
  titleZh: lesson.titleZh,
  titleVi: lesson.title,
  titlePinyin: lesson.sourceLesson?.lesson.title.pinyin || "",
  sections: buildLessonSectionResources(lesson),
  counts: {
   vocab: lesson.vocab.length,
   grammar: lesson.grammar.length,
   sections: lesson.sourceLesson?.lesson.sections.length ?? 0,
  },
  preview: {
   vocab: lesson.vocab.map((item) => item.hanzi),
   grammar: lesson.grammar
    .slice(0, 6)
    .map((item) => item.cleanTitle || item.title || "")
    .filter(Boolean),
  },
 };
}

export function buildLessonSectionsResource(
 lesson: HanziHomeLesson,
): LessonSectionsResource {
 const sections =
  lesson.sourceLesson?.lesson.sections
   .slice()
   .sort((a, b) => a.order - b.order) ?? [];

 return { lessonId: lesson.id, sections, total: sections.length };
}

export function buildLessonVocabularyResource(
 lesson: HanziHomeLesson,
): LessonVocabularyListResource {
 return {
  lessonId: lesson.id,
  items: lesson.vocab,
  total: lesson.vocab.length,
 };
}

export function buildLessonGrammarResource(
 lesson: HanziHomeLesson,
): LessonGrammarListResource {
 return {
  lessonId: lesson.id,
  items: lesson.grammar,
  total: lesson.grammar.length,
 };
}
