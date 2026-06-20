import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
 HanyuLessonSchema,
 SectionSchema,
 type Section,
} from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import {
 DeepVocabularyItemSchema,
 ImportanceLevelSchema,
 PartOfSpeechSchema,
} from "@/features/hanzihome/static-json/schemas/vocab.schema";
import type {
 GrammarViewModel,
 HanziHomeCatalogCourse,
 HanziHomeCatalogData,
 HanziHomeData,
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

const CountRelationSchema = z.array(z.object({ count: z.number().int().nonnegative() }));

const CourseRowSchema = z.object({
 id: z.string(),
 slug: z.string(),
 title: z.string(),
 subtitle: z.string().nullable(),
 type: z.string(),
 course_order: z.number().int(),
});

const BookRowSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 title: z.string(),
 short_title: z.string().nullable(),
 book_order: z.number().int(),
});

const RelatedCourseSchema = z
 .union([CourseRowSchema, z.array(CourseRowSchema)])
 .transform((value) => (Array.isArray(value) ? value[0] : value));

const RelatedBookSchema = z
 .union([BookRowSchema, z.array(BookRowSchema)])
 .transform((value) => (Array.isArray(value) ? value[0] : value));

const LessonSummaryRowSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
 lesson_number: z.number().int().positive(),
 lesson_order: z.number().int().positive(),
 title_zh: z.string(),
 title_vi: z.string(),
 source_file: z.string().nullable(),
 course: RelatedCourseSchema,
 book: RelatedBookSchema,
 vocab_count: CountRelationSchema,
 grammar_count: CountRelationSchema,
});

const LessonTextRowSchema = z.object({
 id: z.string(),
 lesson_id: z.string(),
 text_key: z.string(),
 title: z.string(),
 content: z.string(),
 content_format: z.string(),
});

const LessonSectionRowSchema = z.object({
 id: z.string().uuid(),
 lesson_id: z.string(),
 source_section_id: z.string(),
 section_key: z.string(),
 section_type: z.string(),
 title: z.string(),
 title_vi: z.string(),
 section_order: z.number().int().positive(),
 payload: SectionSchema,
 source_file: z.string().nullable(),
});

const VocabExampleRowSchema = z.object({
 id: z.string(),
 vocab_item_id: z.string(),
 example_order: z.number().int().positive(),
 zh: z.string(),
 pinyin: z.string().nullable(),
 vi: z.string().nullable(),
 note: z.string().nullable(),
});

const VocabDetailRowSchema = z.object({
 id: z.string(),
 vocab_item_id: z.string(),
 section_key: z.string(),
 title: z.string(),
 lines: z.array(z.string()),
 section_order: z.number().int().positive(),
});

const VocabCoreRowSchema = z.object({
 id: z.string(),
 lesson_id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
 item_order: z.number().int().positive(),
 word: z.string(),
 pinyin: z.string(),
 han_viet: z.string(),
 meaning: z.string(),
 category: z.string(),
 level: z.string().nullable(),
 pos_vi: z.string().nullable(),
 pos_zh: z.string().nullable(),
});

const VocabRowSchema = VocabCoreRowSchema.extend({
 examples: z.array(VocabExampleRowSchema).default([]),
 details: z.array(VocabDetailRowSchema).default([]),
});

const GrammarExampleRowSchema = z.object({
 id: z.string(),
 grammar_point_id: z.string(),
 example_order: z.number().int().positive(),
 zh: z.string(),
 pinyin: z.string().nullable(),
 vi: z.string().nullable(),
 note: z.string().nullable(),
});

const GrammarDetailRowSchema = z.object({
 id: z.string(),
 grammar_point_id: z.string(),
 section_key: z.string(),
 title: z.string(),
 lines: z.array(z.string()),
 section_order: z.number().int().positive(),
});

const GrammarCoreRowSchema = z.object({
 id: z.string(),
 lesson_id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
 point_order: z.number().int().positive(),
 title: z.string(),
 clean_title: z.string(),
 core: z.string(),
 content_md: z.string(),
 structures_view: z.array(z.string()),
 notes: z.array(z.string()),
});

const GrammarRowSchema = GrammarCoreRowSchema.extend({
 examples: z.array(GrammarExampleRowSchema).default([]),
 details: z.array(GrammarDetailRowSchema).default([]),
});

const LessonDetailRowSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
 lesson_number: z.number().int().positive(),
 lesson_order: z.number().int().positive(),
 title_zh: z.string(),
 title_vi: z.string(),
 source_file: z.string().nullable(),
 course: RelatedCourseSchema,
 book: RelatedBookSchema,
 sections: z.array(LessonSectionRowSchema).default([]),
 texts: z.array(LessonTextRowSchema).default([]),
 vocab: z.array(VocabRowSchema).default([]),
 grammar: z.array(GrammarRowSchema).default([]),
});

const RelatedLessonSchema = z
 .union([
  z.object({
   id: z.string(),
   lesson_number: z.number().int().positive(),
   lesson_order: z.number().int().positive(),
   title_zh: z.string(),
   title_vi: z.string(),
  }),
  z.array(
   z.object({
    id: z.string(),
    lesson_number: z.number().int().positive(),
    lesson_order: z.number().int().positive(),
    title_zh: z.string(),
    title_vi: z.string(),
   }),
  ),
 ])
 .transform((value) => (Array.isArray(value) ? value[0] : value));

const AggregateVocabRowSchema = VocabCoreRowSchema.extend({
 lesson: RelatedLessonSchema,
});

const AggregateGrammarRowSchema = GrammarCoreRowSchema.extend({
 lesson: RelatedLessonSchema,
});

type LessonSummaryRow = z.infer<typeof LessonSummaryRowSchema>;
type LessonDetailRow = z.infer<typeof LessonDetailRowSchema>;
type VocabRow = z.infer<typeof VocabRowSchema>;
type GrammarRow = z.infer<typeof GrammarRowSchema>;

export type HanzihomeContentRepository = {
 getCatalogSummary: (options?: { includeLessons?: boolean }) => Promise<HanziHomeCatalogData>;
 getCourseLessonSummaries: (courseId: string) => Promise<HanziHomeLesson[]>;
 getLessonOverview: (lessonId: string) => Promise<LessonOverviewResource | null>;
 getLessonDetail: (lessonId: string | null | undefined) => Promise<HanziHomeLesson | null>;
 getLessonSections: (lessonId: string) => Promise<LessonSectionsResource | null>;
 getLessonSection: (sectionId: string) => Promise<Section | null>;
 getLessonVocabulary: (lessonId: string) => Promise<LessonVocabularyListResource | null>;
 getVocabDetail: (vocabId: string) => Promise<HanziHomeVocabItem | null>;
 getLessonGrammar: (lessonId: string) => Promise<LessonGrammarListResource | null>;
 getGrammarDetail: (grammarId: string) => Promise<GrammarViewModel | null>;
 getAggregateItems: (input: {
  kind: AggregateKind;
  filters: AggregateFilters;
 }) => Promise<AggregateResourceItem[]>;
 getSearchData: () => Promise<HanziHomeData>;
};

function countFromRelation(value: Array<{ count: number }>) {
 return value[0]?.count ?? 0;
}

function normalizeText(value: string | null | undefined) {
 return value?.trim() ?? "";
}

function normalizePos(value: string | null) {
 const normalized = value?.trim().toLowerCase().replaceAll(" ", "_") ?? "unknown";
 const parsed = PartOfSpeechSchema.safeParse(normalized);
 return parsed.success ? parsed.data : "unknown";
}

function normalizeLevel(value: string | null) {
 const parsed = ImportanceLevelSchema.safeParse(value ?? "unknown");
 return parsed.success ? parsed.data : "unknown";
}

function lessonSummaryToViewModel(row: LessonSummaryRow): HanziHomeLesson {
 const vocabCount = countFromRelation(row.vocab_count);
 const grammarCount = countFromRelation(row.grammar_count);

 return {
  id: row.id,
  lessonNumber: row.lesson_number,
  titleZh: row.title_zh,
  title: row.title_vi || row.title_zh,
  sourceFile: row.source_file ?? undefined,
  courseId: row.course_id,
  courseTitle: row.course.title,
  bookId: row.book_id,
  bookTitle: row.book.title,
  bookOrder: row.book.book_order,
  lessonOrder: row.lesson_order,
  vocabCount,
  grammarCount,
  vocabIds: [],
  grammarPointIds: [],
  vocab: [],
  grammar: [],
 };
}

function detailLines(rows: VocabRow["details"], key: string) {
 return rows
  .filter((row) => row.section_key === key)
  .sort((left, right) => left.section_order - right.section_order)
  .flatMap((row) => row.lines)
  .map((line) => line.trim())
  .filter(Boolean);
}

function vocabRowToViewModel(row: VocabRow): HanziHomeVocabItem {
 const meaningLines = detailLines(row.details, "meaning");
 const wordFormationLines = detailLines(row.details, "word_formation");
 const comparisonLines = detailLines(row.details, "comparison");
 const cultureLines = detailLines(row.details, "culture");
 const warningLines = detailLines(row.details, "warnings");
 const noteLines = detailLines(row.details, "notes");
 const collocationRows = row.details
  .filter((detail) => detail.section_key === "collocations")
  .sort((left, right) => left.section_order - right.section_order)
  .flatMap((detail) => detail.lines);

 const parsed = DeepVocabularyItemSchema.parse({
  id: row.id,
  order: row.item_order,
  hanzi: row.word,
  pinyin: row.pinyin || "-",
  pos: {
   raw_vi: normalizeText(row.pos_vi),
   raw_cn: normalizeText(row.pos_zh),
   normalized: normalizePos(row.pos_vi),
   notes: [],
  },
  level_tag: normalizeLevel(row.level),
  tags: [],
  meaning: {
   hanviet: row.han_viet,
   meaning_vi: row.meaning || "Chưa có nghĩa",
   meaning_en: "",
   natural_translations_vi: row.meaning ? [row.meaning] : [],
   short_definition_vi: meaningLines[0] || row.meaning,
   textbook_focus_vi: meaningLines.slice(1).join("\n"),
   register_vi: "",
   usage_domain_vi: "",
   notes: noteLines.map((line, index) => ({
    id: `${row.id}:note:${index + 1}`,
    kind: "general",
    text_vi: line,
   })),
  },
  word_formation: {
   characters: [],
   word_logic_vi: wordFormationLines.join("\n"),
   memory_tip_vi: "",
   warning_vi: "",
   notes: [],
   check_needed: false,
  },
  comparison: {
   near_synonyms: [],
   antonyms: [],
   contrast_pairs: [],
   usage_rules: comparisonLines,
   notes: [],
  },
  collocations: collocationRows.map((line, index) => ({
   id: `${row.id}:collocation:${index + 1}`,
   order: index + 1,
   zh: line,
   pinyin: "",
   vi: "",
   pattern: "",
   note_vi: "",
   tags: [],
   notes: [],
  })),
  examples: row.examples
   .slice()
   .sort((left, right) => left.example_order - right.example_order)
   .map((example) => ({
    id: example.id,
    order: example.example_order,
    zh: example.zh,
    pinyin: normalizeText(example.pinyin),
    vi: normalizeText(example.vi),
    analysis_vi: normalizeText(example.note),
    highlight: [],
    grammar_refs: [],
    vocab_refs: [],
    source_ref: "",
    level: "basic",
    audio_key: "",
    notes: [],
    check_needed: false,
   })),
  culture_note:
   cultureLines.length > 0
    ? {
       title: "Văn hóa và ngữ cảnh",
       content_vi: cultureLines.join("\n"),
       tags: [],
       source_refs: [],
       notes: [],
       check_needed: false,
      }
    : undefined,
  warnings: warningLines.map((line, index) => ({
   id: `${row.id}:warning:${index + 1}`,
   order: index + 1,
   rule_vi: line,
   natural_examples: [],
   unnatural_examples: [],
   wrong_examples: [],
   correct_examples: [],
   explanation_vi: "",
   severity: "warning",
   notes: [],
  })),
  audio_key: "",
  raw_markdown: "",
  notes: [],
  check_needed: false,
 });

 return {
  ...parsed,
  runtimeId: `${row.lesson_id}__${row.id}`,
  lessonId: row.lesson_id,
  category: row.category || "Từ vựng",
 };
}

function grammarRowToViewModel(row: GrammarRow): GrammarViewModel {
 return {
  id: `${row.lesson_id}__${row.id}`,
  title: row.title,
  contentMd: row.content_md,
  cleanTitle: row.clean_title || row.title,
  core: row.core,
  structuresView: row.structures_view,
  examplesParsed: row.examples
   .slice()
   .sort((left, right) => left.example_order - right.example_order)
   .map((example) => ({
    id: example.id,
    zh: example.zh,
    pinyin: normalizeText(example.pinyin),
    vi: normalizeText(example.vi),
    note: normalizeText(example.note),
   })),
  notes: row.notes,
  detailSections: row.details
   .slice()
   .sort((left, right) => left.section_order - right.section_order)
   .map((detail) => ({
    id: detail.id,
    key: detail.section_key,
    title: detail.title,
    lines: detail.lines,
   })),
 };
}

function buildSourceLesson(row: LessonDetailRow) {
 const sections = row.sections
  .slice()
  .sort((left, right) => left.section_order - right.section_order)
  .map(lessonSectionRowToSection);

 if (sections.length === 0) {
  throw new Error(`HanziHome lesson ${row.id} has no canonical lesson sections`);
 }

 return HanyuLessonSchema.parse({
  lesson: {
   id: row.id,
   title: {
    zh: row.title_zh,
    pinyin: "",
    vi: row.title_vi,
    en: "",
   },
   tags: [],
   metadata: {
    legacy_id: "",
    book: "Hanyu Jiaocheng",
    volume: row.book.short_title || row.book.title,
    volume_vi: row.book.short_title || row.book.title,
    lesson_index: row.lesson_number,
    lesson_number_cn: "",
    lesson_title_cn: row.title_zh,
    lesson_title_pinyin: "",
    lesson_title_vi: row.title_vi,
    lesson_title_en: "",
    source_files: [],
   },
   sections,
  },
 });
}

function lessonDetailToViewModel(row: LessonDetailRow): HanziHomeLesson {
 const sortedVocab = row.vocab.slice().sort((left, right) => left.item_order - right.item_order);
 const sortedGrammar = row.grammar
  .slice()
  .sort((left, right) => left.point_order - right.point_order);
 const vocab = sortedVocab.map(vocabRowToViewModel);
 const grammar = sortedGrammar.map(grammarRowToViewModel);

 return {
  id: row.id,
  lessonNumber: row.lesson_number,
  titleZh: row.title_zh,
  title: row.title_vi || row.title_zh,
  sourceFile: row.source_file ?? undefined,
  courseId: row.course_id,
  courseTitle: row.course.title,
  bookId: row.book_id,
  bookTitle: row.book.title,
  bookOrder: row.book.book_order,
  lessonOrder: row.lesson_order,
  vocabCategories: Array.from(new Set(vocab.map((item) => item.category))).map((nameVi) => ({
   nameVi,
   words: vocab.filter((item) => item.category === nameVi).map((item) => item.hanzi),
  })),
  vocabCount: vocab.length,
  grammarCount: grammar.length,
  vocabIds: vocab.map((item) => item.runtimeId),
  grammarPointIds: grammar.map((point) => point.id),
  vocab,
  grammar,
  notes: {
   overviewMarkdown: `# ${row.title_zh}\n\n${row.title_vi}`,
   lessonTextMarkdown: row.texts
    .slice()
    .sort((left, right) => left.text_key.localeCompare(right.text_key, "en", { numeric: true }))
    .map((text) => text.content)
    .join("\n\n"),
   grammarSummary: grammar.map((point) => point.cleanTitle).join("\n"),
   vocabularyText: vocab.map((item) => `${item.hanzi} · ${item.pinyin}`).join("\n"),
  },
  sourceLesson: buildSourceLesson(row),
 };
}

async function requireRows<T>(
 operation: string,
 promise: PromiseLike<{
  data: unknown;
  error: { message: string } | null;
 }>,
 schema: z.ZodType<T>,
) {
 const result = await promise;
 if (result.error) {
  throw new Error(`HanziHome Supabase ${operation} failed: ${result.error.message}`);
 }
 return schema.parse(result.data);
}

async function requirePagedRows<T>(
 operation: string,
 schema: z.ZodType<T[]>,
 loadPage: (
  from: number,
  to: number,
 ) => PromiseLike<{
  data: unknown;
  error: { message: string } | null;
 }>,
) {
 const pageSize = 1_000;
 const rows: T[] = [];

 for (let from = 0; ; from += pageSize) {
  const page = await requireRows(operation, loadPage(from, from + pageSize - 1), schema);
  rows.push(...page);
  if (page.length < pageSize) return rows;
 }
}

async function getLessonSummaryRows(courseId?: string) {
 const client = await createClient();
 let query = client
  .from("hanzihome_lessons")
  .select(
   `
    id, course_id, book_id, lesson_number, lesson_order, title_zh, title_vi, source_file,
    course:hanzihome_courses!inner(id, slug, title, subtitle, type, course_order),
    book:hanzihome_course_books!inner(id, course_id, title, short_title, book_order),
    vocab_count:hanzihome_vocab_items(count),
    grammar_count:hanzihome_grammar_points(count)
   `,
  )
  .eq("source", "seed")
  .order("lesson_order");

 if (courseId) query = query.eq("course_id", courseId);
 return requireRows("lesson summaries", query, z.array(LessonSummaryRowSchema));
}

async function getLessonDetailRow(lessonId: string) {
 const client = await createClient();
 const [rows, sections] = await Promise.all([
  requireRows(
   `lesson detail ${lessonId}`,
   client
    .from("hanzihome_lessons")
    .select(
     `
     id, course_id, book_id, lesson_number, lesson_order, title_zh, title_vi, source_file,
     course:hanzihome_courses!inner(id, slug, title, subtitle, type, course_order),
     book:hanzihome_course_books!inner(id, course_id, title, short_title, book_order),
     texts:hanzihome_lesson_texts(id, lesson_id, text_key, title, content, content_format),
     vocab:hanzihome_vocab_items(
      id, lesson_id, course_id, book_id, item_order, word, pinyin, han_viet, meaning,
      category, level, pos_vi, pos_zh,
      examples:hanzihome_vocab_examples(
       id, vocab_item_id, example_order, zh, pinyin, vi, note
      ),
      details:hanzihome_vocab_detail_sections(
       id, vocab_item_id, section_key, title, lines, section_order
      )
     ),
     grammar:hanzihome_grammar_points(
      id, lesson_id, course_id, book_id, point_order, title, clean_title, core,
      content_md, structures_view, notes,
      examples:hanzihome_grammar_examples(
       id, grammar_point_id, example_order, zh, pinyin, vi, note
      ),
      details:hanzihome_grammar_detail_sections(
       id, grammar_point_id, section_key, title, lines, section_order
      )
     )
    `,
    )
    .eq("id", lessonId)
    .eq("source", "seed")
    .limit(1),
   z.array(LessonDetailRowSchema),
  ),
  requireRows(
   `lesson sections ${lessonId}`,
   client
    .from("hanzihome_lesson_sections")
    .select(
     "id,lesson_id,source_section_id,section_key,section_type,title,title_vi,section_order,payload,source_file",
    )
    .eq("lesson_id", lessonId)
    .eq("source", "seed")
    .order("section_order"),
   z.array(LessonSectionRowSchema),
  ),
 ]);

 const row = rows[0];
 return row ? LessonDetailRowSchema.parse({ ...row, sections }) : null;
}

async function getLessonSectionRow(sectionId: string) {
 const client = await createClient();
 const rows = await requireRows(
  `lesson section ${sectionId}`,
  client
   .from("hanzihome_lesson_sections")
   .select(
    "id,lesson_id,source_section_id,section_key,section_type,title,title_vi,section_order,payload,source_file",
   )
   .eq("id", sectionId)
   .eq("source", "seed")
   .limit(1),
  z.array(LessonSectionRowSchema),
 );
 return rows[0] ?? null;
}

function lessonSectionRowToSection(row: z.infer<typeof LessonSectionRowSchema>): Section {
 return SectionSchema.parse({
  ...row.payload,
  id: row.id,
  order: row.section_order,
  title: row.title,
  title_vi: row.title_vi,
 });
}

function matchesTextQuery(values: string[], query: string) {
 const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
 return (
  !normalizedQuery ||
  values.some((value) => value.toLocaleLowerCase("vi-VN").includes(normalizedQuery))
 );
}

async function getAggregateItems({
 kind,
 filters,
}: {
 kind: AggregateKind;
 filters: AggregateFilters;
}): Promise<AggregateResourceItem[]> {
 const client = await createClient();

 if (kind === "vocab") {
  const rows = await requirePagedRows(
   "aggregate vocab",
   z.array(AggregateVocabRowSchema),
   (from, to) => {
    let query = client
     .from("hanzihome_vocab_items")
     .select(
      `
       id, lesson_id, course_id, book_id, item_order, word, pinyin, han_viet, meaning,
       category, level, pos_vi, pos_zh,
       lesson:hanzihome_lessons!inner(id, lesson_number, lesson_order, title_zh, title_vi)
      `,
     )
     .eq("source", "seed")
     .order("lesson_id")
     .order("item_order")
     .range(from, to);
    if (filters.courseId) query = query.eq("course_id", filters.courseId);
    if (filters.bookId) query = query.eq("book_id", filters.bookId);
    if (filters.lessonId) query = query.eq("lesson_id", filters.lessonId);
    return query;
   },
  );
  return rows
   .map(
    (row): AggregateVocabItem => ({
     id: `${row.lesson_id}__${row.id}`,
     courseId: row.course_id,
     bookId: row.book_id,
     lessonId: row.lesson_id,
     lessonNumber: row.lesson.lesson_number,
     lessonOrder: row.lesson.lesson_order,
     lessonTitle: row.lesson.title_zh || row.lesson.title_vi,
     word: row.word,
     pinyin: row.pinyin,
     hanViet: row.han_viet,
     meaning: row.meaning,
     category: row.category,
     level: row.level,
     pos: { vi: row.pos_vi, zh: row.pos_zh },
    }),
   )
   .filter((item) =>
    matchesTextQuery(
     [item.word, item.pinyin, item.hanViet, item.meaning, item.category, item.lessonTitle],
     filters.q,
    ),
   );
 }

 const rows = await requirePagedRows(
  "aggregate grammar",
  z.array(AggregateGrammarRowSchema),
  (from, to) => {
   let query = client
    .from("hanzihome_grammar_points")
    .select(
     `
      id, lesson_id, course_id, book_id, point_order, title, clean_title, core,
      content_md, structures_view, notes,
      lesson:hanzihome_lessons!inner(id, lesson_number, lesson_order, title_zh, title_vi)
     `,
    )
    .eq("source", "seed")
    .order("lesson_id")
    .order("point_order")
    .range(from, to);
   if (filters.courseId) query = query.eq("course_id", filters.courseId);
   if (filters.bookId) query = query.eq("book_id", filters.bookId);
   if (filters.lessonId) query = query.eq("lesson_id", filters.lessonId);
   return query;
  },
 );
 return rows
  .map(
   (row): AggregateGrammarItem => ({
    id: `${row.lesson_id}__${row.id}`,
    courseId: row.course_id,
    bookId: row.book_id,
    lessonId: row.lesson_id,
    lessonNumber: row.lesson.lesson_number,
    lessonOrder: row.lesson.lesson_order,
    lessonTitle: row.lesson.title_zh || row.lesson.title_vi,
    title: row.title,
    cleanTitle: row.clean_title,
    core: row.core,
   }),
  )
  .filter((item) =>
   matchesTextQuery([item.title, item.cleanTitle, item.core, item.lessonTitle], filters.q),
  );
}

function buildMeta(lessons: HanziHomeLesson[]) {
 return {
  app: "hanzihome",
  dataset: "supabase",
  version: "2",
  generatedAt: "",
  sourceFiles: [],
  counts: {
   lessons: lessons.length,
   vocab: lessons.reduce((sum, lesson) => sum + (lesson.vocabCount ?? lesson.vocab.length), 0),
   grammarPoints: lessons.reduce(
    (sum, lesson) => sum + (lesson.grammarCount ?? lesson.grammar.length),
    0,
   ),
   radicals: 0,
   flashcards: 0,
  },
  schemaNote: "Runtime content is loaded from normalized Supabase tables.",
 };
}

async function getSearchData(): Promise<HanziHomeData> {
 const summaries = await getLessonSummaryRows();
 const client = await createClient();
 const [texts, vocab, grammar] = await Promise.all([
  requirePagedRows("search lesson texts", z.array(LessonTextRowSchema), (from, to) =>
   client
    .from("hanzihome_lesson_texts")
    .select("id, lesson_id, text_key, title, content, content_format")
    .eq("source", "seed")
    .order("lesson_id")
    .order("text_key")
    .range(from, to),
  ),
  requirePagedRows("search vocab", z.array(VocabCoreRowSchema), (from, to) =>
   client
    .from("hanzihome_vocab_items")
    .select(
     "id, lesson_id, course_id, book_id, item_order, word, pinyin, han_viet, meaning, category, level, pos_vi, pos_zh",
    )
    .eq("source", "seed")
    .order("lesson_id")
    .order("item_order")
    .range(from, to),
  ),
  requirePagedRows("search grammar", z.array(GrammarCoreRowSchema), (from, to) =>
   client
    .from("hanzihome_grammar_points")
    .select(
     "id, lesson_id, course_id, book_id, point_order, title, clean_title, core, content_md, structures_view, notes",
    )
    .eq("source", "seed")
    .order("lesson_id")
    .order("point_order")
    .range(from, to),
  ),
 ]);
 const textsByLesson = Map.groupBy(texts, (row) => row.lesson_id);
 const vocabByLesson = Map.groupBy(vocab, (row) => row.lesson_id);
 const grammarByLesson = Map.groupBy(grammar, (row) => row.lesson_id);
 const lessons = summaries.map((summary) => {
  const detail = LessonDetailRowSchema.parse({
   ...summary,
   texts: textsByLesson.get(summary.id) ?? [],
   vocab: (vocabByLesson.get(summary.id) ?? []).map((item) => ({
    ...item,
    examples: [],
    details: [],
   })),
   grammar: (grammarByLesson.get(summary.id) ?? []).map((item) => ({
    ...item,
    examples: [],
    details: [],
   })),
  });
  return lessonDetailToViewModel(detail);
 });

 return {
  courses: Array.from(
   new Map(
    summaries.map((row) => [
     row.course.id,
     {
      id: row.course.id,
      slug: row.course.slug,
      title: row.course.title,
      subtitle: row.course.subtitle ?? undefined,
      type: row.course.type,
      order: row.course.course_order,
     },
    ]),
   ).values(),
  ),
  books: Array.from(
   new Map(
    summaries.map((row) => [
     row.book.id,
     {
      id: row.book.id,
      courseId: row.book.course_id,
      title: row.book.title,
      shortTitle: row.book.short_title ?? undefined,
      order: row.book.book_order,
     },
    ]),
   ).values(),
  ),
  lessons,
  radicals: [],
  meta: buildMeta(lessons),
 };
}

function entityLessonId(entityId: string) {
 return entityId.includes("__") ? entityId.slice(0, entityId.indexOf("__")) : "";
}

export const supabaseHanziHomeContentRepository: HanzihomeContentRepository = {
 async getCatalogSummary({ includeLessons = false } = {}) {
  const client = await createClient();
  const [courseRows, bookRows, lessonRows] = await Promise.all([
   requireRows(
    "catalog courses",
    client
     .from("hanzihome_courses")
     .select("id, slug, title, subtitle, type, course_order")
     .eq("source", "seed")
     .order("course_order"),
    z.array(CourseRowSchema),
   ),
   requireRows(
    "catalog books",
    client
     .from("hanzihome_course_books")
     .select("id, course_id, title, short_title, book_order")
     .eq("source", "seed")
     .order("book_order"),
    z.array(BookRowSchema),
   ),
   getLessonSummaryRows(),
  ]);
  const lessons = lessonRows.map(lessonSummaryToViewModel);
  const courses: HanziHomeCatalogCourse[] = courseRows.map((course) => {
   const courseLessons = lessons.filter((lesson) => lesson.courseId === course.id);
   const sortedLessons = courseLessons.slice().sort((left, right) => {
    return (left.lessonOrder ?? left.lessonNumber) - (right.lessonOrder ?? right.lessonNumber);
   });

   return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle ?? undefined,
    type: course.type,
    order: course.course_order,
    stats: {
     bookCount: bookRows.filter((book) => book.course_id === course.id).length,
     lessonCount: courseLessons.length,
     vocabCount: courseLessons.reduce((sum, lesson) => sum + (lesson.vocabCount ?? 0), 0),
     grammarCount: courseLessons.reduce((sum, lesson) => sum + (lesson.grammarCount ?? 0), 0),
    },
    lastLessonId: sortedLessons.at(-1)?.id,
    fallbackLessonId: sortedLessons[0]?.id,
   };
  });

  return {
   source: "db",
   courses,
   books: bookRows.map((book) => ({
    id: book.id,
    courseId: book.course_id,
    title: book.title,
    shortTitle: book.short_title ?? undefined,
    order: book.book_order,
   })),
   lessons: includeLessons ? lessons : [],
   radicals: [],
   meta: buildMeta(lessons),
  };
 },

 async getCourseLessonSummaries(courseId) {
  return (await getLessonSummaryRows(courseId)).map(lessonSummaryToViewModel);
 },

 async getLessonOverview(lessonId) {
  const lesson = await this.getLessonDetail(lessonId);
  return lesson ? buildLessonOverviewResource(lesson) : null;
 },

 async getLessonDetail(lessonId) {
  if (!lessonId) return null;
  const row = await getLessonDetailRow(lessonId);
  return row ? lessonDetailToViewModel(row) : null;
 },

 async getLessonSections(lessonId) {
  const lesson = await this.getLessonDetail(lessonId);
  return lesson ? buildLessonSectionsResource(lesson) : null;
 },

 async getLessonSection(sectionId) {
  const row = await getLessonSectionRow(sectionId);
  return row ? lessonSectionRowToSection(row) : null;
 },

 async getLessonVocabulary(lessonId) {
  const lesson = await this.getLessonDetail(lessonId);
  return lesson ? buildLessonVocabularyResource(lesson) : null;
 },

 async getVocabDetail(vocabId) {
  const lessonId = entityLessonId(vocabId);
  if (!lessonId) return null;
  const lesson = await this.getLessonDetail(lessonId);
  return lesson?.vocab.find((item) => item.runtimeId === vocabId || item.id === vocabId) ?? null;
 },

 async getLessonGrammar(lessonId) {
  const lesson = await this.getLessonDetail(lessonId);
  return lesson ? buildLessonGrammarResource(lesson) : null;
 },

 async getGrammarDetail(grammarId) {
  const lessonId = entityLessonId(grammarId);
  if (!lessonId) return null;
  const lesson = await this.getLessonDetail(lessonId);
  return lesson?.grammar.find((item) => item.id === grammarId) ?? null;
 },

 getAggregateItems,
 getSearchData,
};
