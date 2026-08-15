import "server-only";

import { z } from "zod";

import {
 ImportanceLevelSchema,
 PartOfSpeechSchema,
} from "@/features/hanzihome/schemas/vocab.schema";
import { HanyuLessonSchema, SectionSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import { runtimeDeepVocabularyItemSchema } from "@/features/hanzihome/schemas/runtime-content.schema";
import type {
 AggregateFilters,
 AggregateGrammarItem,
 AggregateResourceItem,
 AggregateVocabItem,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import type {
 GrammarViewModel,
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
 HanziHomeVocabItem,
} from "@/features/hanzihome/types";
import { JsonObjectSchema } from "@/types/json";

import studioSeed from "./studio-seed.json";
import {
 listeningAnswerSchema,
 listeningExerciseTypeSchema,
 listeningLessonBundleSchema,
 listeningOptionSchema,
 listeningTranscriptSchema,
} from "../listening/listening.schemas";
import type { ListeningLessonBundle } from "../listening/listening.types";

const staticTranscriptSchema = z.object({
 mode: z.enum(["dialogue", "monologue"]),
 speakers: z.array(
  z.object({
   id: z.string().min(1),
   labelZh: z.string().min(1),
   labelVi: z.string().min(1),
   voice: z.enum(["male", "female", "neutral"]),
  }),
 ),
 lines: z.array(
  z.object({
   order: z.number().int().positive(),
   speakerId: z.string().min(1),
   zh: z.string().min(1),
   pinyin: z.string().min(1),
   vi: z.string().nullable().optional(),
  }),
 ),
 full: z.object({
  zh: z.string().min(1),
  pinyin: z.string().min(1),
  vi: z.string().nullable().optional(),
 }),
});

const staticLessonSchema = z.object({
 id: z.string().min(1),
 course_id: z.string().min(1),
 book_id: z.string().min(1),
 lesson_number: z.number().int().positive(),
 lesson_order: z.number().int().positive(),
 title_zh: z.string().min(1),
 title_vi: z.string().min(1),
 title_pinyin: z.string().nullable(),
 title_en: z.string().nullable(),
 tags: z.array(z.string()),
 source_file: z.string().min(1),
 imported_at: z.iso.datetime({ offset: true }),
});

const staticCourseSchema = z.object({
 id: z.string().min(1),
 slug: z.string().min(1),
 title: z.string().min(1),
 subtitle: z.string().min(1),
 type: z.string().min(1),
 course_order: z.number().int().positive(),
 imported_at: z.iso.datetime({ offset: true }),
});

const staticBookSchema = z.object({
 id: z.string().min(1),
 course_id: z.string().min(1),
 title: z.string().min(1),
 short_title: z.string().nullable(),
 book_order: z.number().int().positive(),
 imported_at: z.iso.datetime({ offset: true }),
});

const staticVocabSchema = z.object({
 id: z.string().min(1),
 lesson_id: z.string().min(1),
 course_id: z.string().min(1),
 book_id: z.string().min(1),
 item_order: z.number().int().positive(),
 word: z.string().min(1),
 pinyin: z.string(),
 han_viet: z.string(),
 meaning: z.string().min(1),
 category: z.string().min(1),
 level: z.string().nullable(),
 pos_vi: z.string().nullable(),
 pos_zh: z.string().nullable(),
 tone: z.string().nullable(),
 tags: z.array(z.string()),
 imported_at: z.iso.datetime({ offset: true }),
});

const staticVocabDetailSchema = z.object({
 id: z.string().min(1),
 vocab_item_id: z.string().min(1),
 section_key: z.string().min(1),
 title: z.string().min(1),
 lines: z.array(z.string()),
 section_order: z.number().int().positive(),
 imported_at: z.iso.datetime({ offset: true }),
});

const staticGrammarSchema = z.object({
 id: z.string().min(1),
 lesson_id: z.string().min(1),
 course_id: z.string().min(1),
 book_id: z.string().min(1),
 point_order: z.number().int().positive(),
 title: z.string().min(1),
 clean_title: z.string().min(1),
 core: z.string(),
 content_md: z.string(),
 structures_view: z.array(z.string()),
 notes: z.array(z.string()),
 level: z.string().nullable(),
 tags: z.array(z.string()),
 imported_at: z.iso.datetime({ offset: true }),
});

const staticGrammarExampleSchema = z.object({
 id: z.string().min(1),
 grammar_point_id: z.string().min(1),
 example_order: z.number().int().positive(),
 zh: z.string().min(1),
 pinyin: z.string().nullable(),
 vi: z.string().nullable(),
 note: z.string(),
});

const staticGrammarDetailSchema = z.object({
 id: z.string().min(1),
 grammar_point_id: z.string().min(1),
 section_key: z.string().min(1),
 title: z.string().min(1),
 lines: z.array(z.string()),
 section_order: z.number().int().positive(),
});

const staticLessonSectionSchema = z.object({
 id: z.string().min(1),
 lesson_id: z.string().min(1),
 source_section_id: z.string().min(1),
 title: z.string(),
 title_vi: z.string(),
 section_order: z.number().int().positive(),
 payload: z.json(),
});

const staticListeningItemSchema = z.object({
 id: z.string().min(1),
 lesson_id: z.string().min(1),
 item_order: z.number().int().positive(),
 item_type: z.literal("dictation"),
 category: z.literal("extra_practice"),
 prompt_zh: z.string().nullable(),
 translation_vi: z.string(),
 section_id: z.string().min(1),
 section_title: z.string().min(1),
 options: z.array(listeningOptionSchema),
 answer: listeningAnswerSchema,
 transcript: staticTranscriptSchema,
 explanation_vi: z.string().nullable(),
 metadata: z.object({
  pinyin: z.string().min(1),
 }),
 publication_status: z.literal("published"),
 imported_at: z.iso.datetime({ offset: true }),
});

const staticStudioSeedSchema = z.object({
 canonical: z.object({
  courses: z.array(staticCourseSchema),
  books: z.array(staticBookSchema),
  lessons: z.array(staticLessonSchema),
  lessonSections: z.array(staticLessonSectionSchema),
  vocabItems: z.array(staticVocabSchema),
  vocabDetailSections: z.array(staticVocabDetailSchema),
  grammarPoints: z.array(staticGrammarSchema),
  grammarExamples: z.array(staticGrammarExampleSchema),
  grammarDetailSections: z.array(staticGrammarDetailSchema),
  listeningItems: z.array(staticListeningItemSchema),
 }),
});

const staticStudioSeed = staticStudioSeedSchema.parse(studioSeed);

const courseTitles = new Map(
 staticStudioSeed.canonical.courses.map((course) => [course.id, course.title]),
);
const bookById = new Map(staticStudioSeed.canonical.books.map((book) => [book.id, book]));
const lessonById = new Map(staticStudioSeed.canonical.lessons.map((lesson) => [lesson.id, lesson]));

function lessonToSummary(lesson: z.infer<typeof staticLessonSchema>): HanziHomeLesson {
 const book = bookById.get(lesson.book_id);
 return {
  id: lesson.id,
  lessonNumber: lesson.lesson_number,
  titleZh: lesson.title_zh,
  title: lesson.title_vi || lesson.title_zh,
  titlePinyin: lesson.title_pinyin ?? undefined,
  titleEn: lesson.title_en ?? undefined,
  tags: lesson.tags,
  sourceFile: lesson.source_file,
  courseId: lesson.course_id,
  courseTitle: courseTitles.get(lesson.course_id),
  bookId: lesson.book_id,
  bookTitle: book?.title,
  bookOrder: book?.book_order,
  lessonOrder: lesson.lesson_order,
  vocabIds: [],
  grammarPointIds: [],
  vocab: [],
  grammar: [],
  editMeta: {
   entityType: "lesson",
   entityId: lesson.id,
   dbId: lesson.id,
   updatedAt: lesson.imported_at,
   order: lesson.lesson_order,
   orderField: "lesson_order",
  },
 };
}

function staticLevel(value: string | null) {
 const parsed = ImportanceLevelSchema.safeParse(value ?? "unknown");
 return parsed.success ? parsed.data : "unknown";
}

function staticPos(value: string | null) {
 const normalized = value?.trim().toLowerCase().replaceAll(" ", "_") || "unknown";
 const parsed = PartOfSpeechSchema.safeParse(normalized);
 return parsed.success ? parsed.data : "unknown";
}

function staticVocabItemToViewModel(
 row: z.infer<typeof staticVocabSchema>,
 lessonId: string,
): HanziHomeVocabItem {
 const details = staticStudioSeed.canonical.vocabDetailSections
  .filter((detail) => detail.vocab_item_id === row.id)
  .toSorted((left, right) => left.section_order - right.section_order);
 const meaningLines = details
  .filter((detail) => detail.section_key === "meaning")
  .flatMap((detail) => detail.lines);
 const parsed = runtimeDeepVocabularyItemSchema.parse({
  id: row.id,
  order: row.item_order,
  hanzi: row.word,
  pinyin: row.pinyin,
  pos: {
   raw_vi: row.pos_vi ?? "",
   raw_cn: row.pos_zh ?? "",
   normalized: staticPos(row.pos_vi),
   notes: [],
  },
  level_tag: staticLevel(row.level),
  tags: row.tags,
  meaning: {
   hanviet: row.han_viet,
   meaning_vi: row.meaning,
   meaning_en: "",
   natural_translations_vi: [row.meaning],
   short_definition_vi: meaningLines[0] || row.meaning,
   textbook_focus_vi: meaningLines.slice(1).join("\n"),
   register_vi: "",
   usage_domain_vi: "",
   notes: [],
  },
  word_formation: {
   characters: [],
   word_logic_vi: "",
   memory_tip_vi: "",
   warning_vi: "",
   notes: [],
   check_needed: false,
  },
  comparison: {
   near_synonyms: [],
   antonyms: [],
   contrast_pairs: [],
   usage_rules: [],
   notes: [],
  },
  collocations: [],
  examples: [],
  audio_key: "",
  raw_markdown: "",
  notes: [],
  check_needed: false,
 });

 return {
  ...parsed,
  examples: [],
  runtimeId: `${lessonId}__${row.id}`,
  lessonId,
  category: row.category,
  tone: row.tone ?? "",
  detailSections: details.map((detail) => ({
   id: detail.id,
   key: detail.section_key,
   title: detail.title,
   lines: detail.lines,
   order: detail.section_order,
   editMeta: {
    entityType: "vocab_detail_section",
    entityId: detail.id,
    dbId: detail.id,
    updatedAt: detail.imported_at,
    parentEntityType: "vocab_item",
    parentEntityId: `${lessonId}__${row.id}`,
    order: detail.section_order,
    orderField: "section_order",
   },
  })),
  editMeta: {
   entityType: "vocab_item",
   entityId: `${lessonId}__${row.id}`,
   dbId: row.id,
   updatedAt: row.imported_at,
   parentEntityType: "lesson",
   parentEntityId: lessonId,
   order: row.item_order,
   orderField: "item_order",
  },
 };
}

function staticGrammarToViewModel(
 row: z.infer<typeof staticGrammarSchema>,
 lessonId: string,
): GrammarViewModel {
 const examplesParsed = staticStudioSeed.canonical.grammarExamples
  .filter((example) => example.grammar_point_id === row.id)
  .toSorted((left, right) => left.example_order - right.example_order)
  .map((example) => ({
   id: example.id,
   zh: example.zh,
   pinyin: example.pinyin ?? "",
   vi: example.vi ?? "",
   note: example.note,
  }));
 const details = staticStudioSeed.canonical.grammarDetailSections
  .filter((detail) => detail.grammar_point_id === row.id)
  .toSorted((left, right) => left.section_order - right.section_order);

 return {
  id: `${lessonId}__${row.id}`,
  title: row.title,
  titleVi: undefined,
  level: row.level ?? undefined,
  tags: row.tags,
  contentMd: row.content_md,
  cleanTitle: row.clean_title,
  core: row.core,
  structuresView: row.structures_view,
  examplesParsed,
  notes: row.notes,
  detailSections: details.map((detail) => ({
   id: detail.id,
   key: detail.section_key,
   title: detail.title,
   lines: detail.lines,
  })),
  editMeta: {
   entityType: "grammar_point",
   entityId: `${lessonId}__${row.id}`,
   dbId: row.id,
   updatedAt: row.imported_at,
   parentEntityType: "lesson",
   parentEntityId: lessonId,
   order: row.point_order,
   orderField: "point_order",
  },
 };
}

function staticSourceLesson(lesson: z.infer<typeof staticLessonSchema>) {
 const sections = staticStudioSeed.canonical.lessonSections
  .filter((section) => section.lesson_id === lesson.id)
  .toSorted((left, right) => left.section_order - right.section_order)
  .flatMap((section) => {
   const payload = JsonObjectSchema.safeParse(section.payload);
   if (!payload.success) return [];
   const parsed = SectionSchema.safeParse({
    ...payload.data,
    id: section.source_section_id,
    order: section.section_order,
    title: section.title,
    title_vi: section.title_vi,
   });
   return parsed.success ? [parsed.data] : [];
  });

 return HanyuLessonSchema.parse({
  schema_version: "studio-static-v1",
  content_type: "chinese_textbook_lesson",
  lesson: {
   id: lesson.id,
   title: {
    zh: lesson.title_zh,
    pinyin: lesson.title_pinyin ?? "",
    vi: lesson.title_vi,
    en: lesson.title_en ?? "",
   },
   tags: lesson.tags,
   metadata: {
    lesson_index: lesson.lesson_number,
    lesson_title_cn: lesson.title_zh,
    lesson_title_pinyin: lesson.title_pinyin ?? "",
    lesson_title_vi: lesson.title_vi,
    lesson_title_en: lesson.title_en ?? "",
   },
   sections,
   summary: {
    lesson_parts: [],
    grammar_points: [],
    main_patterns: [],
    exercise_types: [],
    check_needed: false,
   },
  },
 });
}

export function getStaticStudioLessonDetail(lessonId: string): HanziHomeLesson | null {
 const lesson = lessonById.get(lessonId);
 if (!lesson) return null;
 const vocab = staticStudioSeed.canonical.vocabItems
  .filter((item) => item.lesson_id === lessonId)
  .toSorted((left, right) => left.item_order - right.item_order)
  .map((item) => staticVocabItemToViewModel(item, lessonId));
 const grammar = staticStudioSeed.canonical.grammarPoints
  .filter((item) => item.lesson_id === lessonId)
  .toSorted((left, right) => left.point_order - right.point_order)
  .map((item) => staticGrammarToViewModel(item, lessonId));
 const summary = lessonToSummary(lesson);

 return {
  ...summary,
  vocab,
  grammar,
  vocabIds: vocab.map((item) => item.runtimeId),
  grammarPointIds: grammar.map((item) => item.id),
  vocabCount: vocab.length,
  grammarCount: grammar.length,
  vocabCategories: Array.from(new Set(vocab.map((item) => item.category))).map((nameVi) => ({
   nameVi,
   words: vocab.filter((item) => item.category === nameVi).map((item) => item.hanzi),
  })),
  sourceLesson: staticSourceLesson(lesson),
 };
}

export function getStaticStudioCatalog() {
 const lessons = staticStudioSeed.canonical.lessons.map(lessonToSummary);
 const books: HanziHomeCourseBook[] = staticStudioSeed.canonical.books.map((book) => ({
  id: book.id,
  courseId: book.course_id,
  title: book.title,
  shortTitle: book.short_title ?? undefined,
  order: book.book_order,
  updatedAt: book.imported_at,
 }));
 const courses: HanziHomeCatalogCourse[] = staticStudioSeed.canonical.courses.map((course) => {
  const courseLessons = lessons.filter((lesson) => lesson.courseId === course.id);
  const courseBooks = books.filter((book) => book.courseId === course.id);
  const vocabCount = staticStudioSeed.canonical.vocabItems.filter(
   (item) => item.course_id === course.id,
  ).length;
  const grammarCount = staticStudioSeed.canonical.grammarPoints.filter(
   (item) => item.course_id === course.id,
  ).length;
  return {
   id: course.id,
   slug: course.slug,
   title: course.title,
   subtitle: course.subtitle,
   type: course.type,
   order: course.course_order,
   updatedAt: course.imported_at,
   stats: {
    bookCount: courseBooks.length,
    lessonCount: courseLessons.length,
    vocabCount,
    grammarCount,
   },
   lastLessonId: courseLessons.at(-1)?.id,
   fallbackLessonId: courseLessons[0]?.id,
  };
 });

 return { courses, books, lessons };
}

function matchesStaticQuery(values: string[], query: string) {
 const normalized = query.trim().toLocaleLowerCase("vi-VN");
 return (
  !normalized || values.some((value) => value.toLocaleLowerCase("vi-VN").includes(normalized))
 );
}

export function getStaticStudioAggregateItems({
 kind,
 filters,
}: {
 kind: "vocab" | "grammar";
 filters: AggregateFilters;
}): AggregateResourceItem[] {
 if (kind === "vocab") {
  return staticStudioSeed.canonical.vocabItems
   .filter(
    (item) =>
     (!filters.courseId || item.course_id === filters.courseId) &&
     (!filters.bookId || item.book_id === filters.bookId) &&
     (!filters.lessonId || item.lesson_id === filters.lessonId),
   )
   .map((item): AggregateVocabItem => {
    const lesson = lessonById.get(item.lesson_id);
    return {
     id: `${item.lesson_id}__${item.id}`,
     courseId: item.course_id,
     bookId: item.book_id,
     lessonId: item.lesson_id,
     lessonNumber: lesson?.lesson_number ?? 1,
     lessonOrder: lesson?.lesson_order ?? item.item_order,
     lessonTitle: lesson?.title_zh ?? item.lesson_id,
     word: item.word,
     pinyin: item.pinyin,
     hanViet: item.han_viet,
     meaning: item.meaning,
     category: item.category,
     level: item.level,
     pos: { vi: item.pos_vi, zh: item.pos_zh },
    };
   })
   .filter((item) =>
    matchesStaticQuery(
     [item.word, item.pinyin, item.hanViet, item.meaning, item.category, item.lessonTitle],
     filters.q,
    ),
   );
 }

 return staticStudioSeed.canonical.grammarPoints
  .filter(
   (item) =>
    (!filters.courseId || item.course_id === filters.courseId) &&
    (!filters.bookId || item.book_id === filters.bookId) &&
    (!filters.lessonId || item.lesson_id === filters.lessonId),
  )
  .map((item): AggregateGrammarItem => {
   const lesson = lessonById.get(item.lesson_id);
   return {
    id: `${item.lesson_id}__${item.id}`,
    courseId: item.course_id,
    bookId: item.book_id,
    lessonId: item.lesson_id,
    lessonNumber: lesson?.lesson_number ?? 1,
    lessonOrder: lesson?.lesson_order ?? item.point_order,
    lessonTitle: lesson?.title_zh ?? item.lesson_id,
    title: item.title,
    cleanTitle: item.clean_title,
    core: item.core,
   };
  })
  .filter((item) =>
   matchesStaticQuery([item.title, item.cleanTitle, item.core, item.lessonTitle], filters.q),
  );
}

function normalizeTranscript(transcript: z.infer<typeof staticTranscriptSchema>) {
 return listeningTranscriptSchema.parse({
  ...transcript,
  lines: transcript.lines.map((line) => ({
   ...line,
   vi: line.vi?.trim() || undefined,
  })),
  full: {
   ...transcript.full,
   vi: transcript.full.vi?.trim() || undefined,
  },
 });
}

export function listStaticStudioCourseLessons(courseId: string): HanziHomeLesson[] {
 return staticStudioSeed.canonical.lessons
  .filter((lesson) => lesson.course_id === courseId)
  .toSorted((left, right) => left.lesson_order - right.lesson_order)
  .map(lessonToSummary);
}

export function getStaticStudioListeningLessonBundle(
 lessonId: string,
): ListeningLessonBundle | null {
 const lesson = staticStudioSeed.canonical.lessons.find((candidate) => candidate.id === lessonId);
 if (!lesson || lesson.course_id !== "hanzihome-studio-dictation") return null;

 const items = staticStudioSeed.canonical.listeningItems
  .filter((item) => item.lesson_id === lessonId)
  .toSorted((left, right) => left.item_order - right.item_order);
 if (items.length === 0) return null;

 const sections = new Map<string, (typeof items)[number]>();
 for (const item of items) {
  if (!sections.has(item.section_id)) sections.set(item.section_id, item);
 }

 const bundle = {
  lesson: {
   id: lesson.id,
   titleZh: lesson.title_zh,
   titleVi: lesson.title_vi || undefined,
  },
  sections: [...sections.entries()].map(([sectionId, item], index) => ({
   id: sectionId,
   sourceSectionId: sectionId,
   order: index + 1,
   category: item.category,
   titleZh: item.section_title,
   titleVi: lesson.title_vi || undefined,
   exerciseType: listeningExerciseTypeSchema.enum.short_answer,
   suggestionsZh: [],
  })),
  items: items.map((item) => ({
   id: item.id,
   sectionId: item.section_id,
   order: item.item_order,
   type: item.item_type,
   transcript: normalizeTranscript(item.transcript),
   promptZh: item.prompt_zh ?? undefined,
   options: item.options,
   answer: item.answer,
   explanationVi: item.explanation_vi ?? undefined,
   metadata: {
    pinyin: item.metadata.pinyin,
    translationVi: item.translation_vi.trim() || undefined,
   },
   editMeta: {
    entityType: "listening_item",
    entityId: item.id,
    dbId: item.id,
    updatedAt: item.imported_at,
    parentEntityType: "lesson",
    parentEntityId: lesson.id,
    order: item.item_order,
    orderField: "item_order",
   },
  })),
 };

 return listeningLessonBundleSchema.parse(bundle);
}
