import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { VocabularyItemSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import type {
 GrammarViewModel,
 HanziHomeLesson,
 HanziHomeVocabItem,
} from "@/features/hanzihome/types";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import { z } from "zod";
import {
 aggregateGrammarItemSchema,
 aggregateVocabItemSchema,
} from "@/features/hanzihome/hanzihome-api.schemas";

export const LessonSectionKindSchema = z.enum([
 "lessonText",
 "vocabulary",
 "grammar",
 "exercises",
 "reading",
 "notes",
 "properNouns",
 "characterWriting",
 "summary",
]);
export type LessonSectionKind = z.infer<typeof LessonSectionKindSchema>;

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

export const AggregateKindSchema = z.enum(["vocab", "grammar"]);
export type AggregateKind = z.infer<typeof AggregateKindSchema>;

export type AggregateFilters = {
 courseId: string;
 bookId: string;
 lessonId: string;
 q: string;
};

export type AggregateVocabItem = z.infer<typeof aggregateVocabItemSchema>;
export type AggregateGrammarItem = z.infer<typeof aggregateGrammarItemSchema>;

type AggregateResourceItemMap = {
 vocab: AggregateVocabItem;
 grammar: AggregateGrammarItem;
};
export type AggregateResourceItem = AggregateResourceItemMap[keyof AggregateResourceItemMap];

export function attachLessonVocabularyResource(
 lesson: HanziHomeLesson,
 resource: LessonVocabularyListResource,
): HanziHomeLesson {
 const vocab = resource.items;
 const sourceLesson = lesson.sourceLesson
  ? {
     lesson: {
      ...lesson.sourceLesson.lesson,
      sections: lesson.sourceLesson.lesson.sections.map((section) =>
       section.type === "vocabulary"
        ? {
           ...section,
           items: vocab.map((item) =>
            VocabularyItemSchema.parse({
             id: item.id,
             type: "vocabulary_item",
             order: item.order,
             hanzi: item.hanzi,
             pinyin: item.pinyin,
             hanviet: item.meaning.hanviet,
             meaning_vi: item.meaning.meaning_vi,
             meaning_en: item.meaning.meaning_en,
             pos: item.pos.normalized,
             tags: item.tags,
             examples: item.examples.map((example) => ({
              id: example.id,
              zh: example.zh,
              pinyin: example.pinyin,
              vi: example.vi,
              source_ref: example.source_ref,
              grammar_refs: example.grammar_refs,
              vocab_refs: example.vocab_refs,
             })),
             audio_key: item.audio_key,
             check_needed: item.check_needed,
            }),
           ),
          }
        : section,
      ),
     },
    }
  : undefined;

 return {
  ...lesson,
  vocab,
  vocabCategories: Array.from(new Set(vocab.map((item) => item.category))).map((nameVi) => ({
   nameVi,
   words: vocab.filter((item) => item.category === nameVi).map((item) => item.hanzi),
  })),
  vocabCount: resource.total,
  vocabIds: vocab.map((item) => item.runtimeId),
  notes: {
   ...lesson.notes,
   vocabularyText: vocab.map((item) => `${item.hanzi} · ${item.pinyin}`).join("\n"),
  },
  sourceLesson,
 };
}

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
       : type === "exercises" ||
           type === "reading" ||
           type === "communication" ||
           type === "character_writing"
         ? "practice"
         : "lessonText";

 return buildHanziHomeLessonHref({
  courseId: lesson.courseId || "",
  bookId: lesson.bookId,
  lessonNumber: lesson.lessonNumber,
  module: targetModule,
 });
}

export function buildLessonSectionResources(lesson: HanziHomeLesson): LessonSectionResource[] {
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

export function buildLessonOverviewResource(lesson: HanziHomeLesson): LessonOverviewResource {
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

export function buildLessonSectionsResource(lesson: HanziHomeLesson): LessonSectionsResource {
 const sections =
  lesson.sourceLesson?.lesson.sections.slice().sort((a, b) => a.order - b.order) ?? [];

 return { lessonId: lesson.id, sections, total: sections.length };
}

export function buildLessonGrammarResource(lesson: HanziHomeLesson): LessonGrammarListResource {
 return {
  lessonId: lesson.id,
  items: lesson.grammar,
  total: lesson.grammar.length,
 };
}
