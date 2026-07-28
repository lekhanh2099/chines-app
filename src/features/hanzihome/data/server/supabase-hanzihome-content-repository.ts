import type { JsonFieldValue, JsonValue } from "@/types/json";
import type { JsonObject } from "@/types/json";
import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { HanyuLessonSchema, SectionSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import {
 ImportanceLevelSchema,
 PartOfSpeechSchema,
} from "@/features/hanzihome/schemas/vocab.schema";
import { runtimeDeepVocabularyItemSchema } from "@/features/hanzihome/schemas/runtime-content.schema";
import type {
 GrammarViewModel,
 HanziHomeCatalogCourse,
 HanziHomeCatalogData,
 HanziHomeData,
 HanziHomeEditableRecordMeta,
 HanziHomeLesson,
 HanziHomeVocabItem,
 StaticRadicalData,
} from "@/features/hanzihome/types";
import {
 buildLessonGrammarResource,
 buildLessonOverviewResource,
 buildLessonSectionsResource,
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
import {
 aggregateGrammarRowSchema,
 aggregateVocabRowSchema,
 bookRowSchema,
 catalogStatsRowSchema,
 courseRowSchema,
 grammarCoreRowSchema,
 grammarRowSchema,
 lessonDetailRowSchema,
 lessonSectionRowSchema,
 lessonShellRowSchema,
 lessonSummaryRowSchema,
 lessonTextRowSchema,
 radicalRowSchema,
 vocabCoreRowSchema,
 vocabRowSchema,
 type GrammarRow,
 type LessonDetailRow,
 type LessonSummaryRow,
 type RadicalRow,
 type VocabRow,
} from "./supabase-content-row.schemas";

function groupBy<T, K>(items: T[], getKey: (item: T) => K) {
 const grouped = new Map<K, T[]>();

 for (const item of items) {
  const key = getKey(item);
  const group = grouped.get(key);

  if (group) {
   group.push(item);
  } else {
   grouped.set(key, [item]);
  }
 }

 return grouped;
}

function countFromRelation(value: Array<{ count: number }>) {
 return value[0]?.count ?? 0;
}

const OptionalNullableStringSchema = z.string().nullable().optional();
const NullableStringSchema = z.string().nullable();

function normalizeText(value: z.infer<typeof OptionalNullableStringSchema>) {
 return value?.trim() ?? "";
}

function isMissingRequiredText(value: z.infer<typeof OptionalNullableStringSchema>) {
 return normalizeText(value).length === 0;
}

function normalizePos(value: z.infer<typeof NullableStringSchema>) {
 const normalized = value?.trim().toLowerCase().replaceAll(" ", "_") ?? "unknown";
 const parsed = PartOfSpeechSchema.safeParse(normalized);
 return parsed.success ? parsed.data : "unknown";
}

function normalizeLevel(value: z.infer<typeof NullableStringSchema>) {
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
  titlePinyin: row.title_pinyin ?? undefined,
  titleEn: row.title_en ?? undefined,
  tags: row.tags,
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
  editMeta: {
   entityType: "lesson",
   entityId: row.id,
   dbId: row.id,
   updatedAt: row.updated_at,
   order: row.lesson_order,
   orderField: "lesson_order",
  },
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
 const coreNeedsReview = isMissingRequiredText(row.pinyin) || isMissingRequiredText(row.meaning);

 const parsed = runtimeDeepVocabularyItemSchema.parse({
  id: row.id,
  order: row.item_order,
  hanzi: row.word,
  pinyin: normalizeText(row.pinyin),
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
   meaning_vi: normalizeText(row.meaning),
   meaning_en: row.meaning_en ?? "",
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
   check_needed: coreNeedsReview,
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
    check_needed: isMissingRequiredText(example.pinyin) || isMissingRequiredText(example.vi),
    editMeta: {
     entityType: "vocab_example",
     entityId: example.id,
     dbId: example.id,
     updatedAt: example.updated_at,
     parentEntityType: "vocab_item",
     parentEntityId: `${row.lesson_id}__${row.id}`,
     order: example.example_order,
     orderField: "example_order",
    },
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
  check_needed: coreNeedsReview,
 });

 return {
  ...parsed,
  examples: parsed.examples.map((example, index) => {
   const source = row.examples
    .slice()
    .sort((left, right) => left.example_order - right.example_order)[index];
   if (!source) return example;
   return {
    ...example,
    editMeta: {
     entityType: "vocab_example",
     entityId: source.id,
     dbId: source.id,
     updatedAt: source.updated_at,
     parentEntityType: "vocab_item",
     parentEntityId: `${row.lesson_id}__${row.id}`,
     order: source.example_order,
     orderField: "example_order",
    },
   };
  }),
  runtimeId: `${row.lesson_id}__${row.id}`,
  lessonId: row.lesson_id,
  category: row.category || "Từ vựng",
  tone: row.tone ?? "",
  tags: row.tags,
  detailSections: row.details
   .slice()
   .sort((left, right) => left.section_order - right.section_order)
   .map((detail) => ({
    id: detail.id,
    key: detail.section_key,
    title: detail.title,
    lines: detail.lines,
    order: detail.section_order,
    editMeta: {
     entityType: "vocab_detail_section",
     entityId: detail.id,
     dbId: detail.id,
     updatedAt: detail.updated_at,
     parentEntityType: "vocab_item",
     parentEntityId: `${row.lesson_id}__${row.id}`,
     order: detail.section_order,
     orderField: "section_order",
    },
   })),
  editMeta: {
   entityType: "vocab_item",
   entityId: `${row.lesson_id}__${row.id}`,
   dbId: row.id,
   updatedAt: row.updated_at,
   parentEntityType: "lesson",
   parentEntityId: row.lesson_id,
  },
 };
}

function grammarRowToViewModel(row: GrammarRow): GrammarViewModel {
 return {
  id: `${row.lesson_id}__${row.id}`,
  title: row.title,
  titleVi: row.title_vi ?? undefined,
  level: row.level ?? undefined,
  tags: row.tags,
  contentMd: row.content_md ?? "",
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
  editMeta: {
   entityType: "grammar_point",
   entityId: `${row.lesson_id}__${row.id}`,
   dbId: row.id,
   updatedAt: row.updated_at,
   parentEntityType: "lesson",
   parentEntityId: row.lesson_id,
  },
 };
}

function editableRecordKey(entityType: string, entityId: string) {
 return `${entityType}:${entityId}`;
}

function buildEditableRecords(row: LessonDetailRow) {
 const records: Record<string, HanziHomeEditableRecordMeta> = {};
 const add = (record: HanziHomeEditableRecordMeta) => {
  records[editableRecordKey(record.entityType, record.entityId)] = record;
 };

 add({
  entityType: "lesson",
  entityId: row.id,
  dbId: row.id,
  updatedAt: row.updated_at,
  order: row.lesson_order,
  orderField: "lesson_order",
 });

 for (const section of row.sections) {
  add({
   entityType: "section",
   entityId: section.source_section_id,
   dbId: section.id,
   updatedAt: section.updated_at,
   parentEntityType: "lesson",
   parentEntityId: row.id,
   sectionDbId: section.id,
   order: section.section_order,
   orderField: "section_order",
  });
 }

 for (const item of row.vocab) {
  const runtimeId = `${row.id}__${item.id}`;
  add({
   entityType: "vocab_item",
   entityId: runtimeId,
   dbId: item.id,
   updatedAt: item.updated_at,
   parentEntityType: "lesson",
   parentEntityId: row.id,
   order: item.item_order,
   orderField: "item_order",
  });
  for (const example of item.examples) {
   add({
    entityType: "vocab_example",
    entityId: example.id,
    dbId: example.id,
    updatedAt: example.updated_at,
    parentEntityType: "vocab_item",
    parentEntityId: runtimeId,
    order: example.example_order,
    orderField: "example_order",
   });
  }
  for (const detail of item.details) {
   const detailRecord: HanziHomeEditableRecordMeta = {
    entityType: "vocab_detail_section",
    entityId: detail.id,
    dbId: detail.id,
    updatedAt: detail.updated_at,
    parentEntityType: "vocab_item",
    parentEntityId: runtimeId,
    order: detail.section_order,
    orderField: "section_order",
   };
   add(detailRecord);
   if (detail.section_key === "collocations") {
    detail.lines.forEach((_, lineIndex) => {
     add({
      ...detailRecord,
      entityId: `${item.id}:collocation:${lineIndex + 1}`,
      fieldPath: ["lines", lineIndex],
     });
    });
   }
  }
 }

 for (const point of row.grammar) {
  const runtimeId = `${row.id}__${point.id}`;
  add({
   entityType: "grammar_point",
   entityId: runtimeId,
   dbId: point.id,
   updatedAt: point.updated_at,
   parentEntityType: "lesson",
   parentEntityId: row.id,
   order: point.point_order,
   orderField: "point_order",
  });
  for (const example of point.examples) {
   add({
    entityType: "grammar_example",
    entityId: example.id,
    dbId: example.id,
    updatedAt: example.updated_at,
    parentEntityType: "grammar_point",
    parentEntityId: runtimeId,
    order: example.example_order,
    orderField: "example_order",
   });
  }
  for (const detail of point.details) {
   add({
    entityType: "grammar_detail_section",
    entityId: detail.id,
    dbId: detail.id,
    updatedAt: detail.updated_at,
    parentEntityType: "grammar_point",
    parentEntityId: runtimeId,
    order: detail.section_order,
    orderField: "section_order",
   });
  }
 }

 return records;
}

function buildSourceLesson(row: LessonDetailRow) {
 const sections = row.sections
  .filter((section) => section.section_type !== "listening")
  .slice()
  .sort((left, right) => left.section_order - right.section_order)
  .map((section) => lessonSectionRowToSection(section));

 if (sections.length === 0) {
  return undefined;
 }

 return HanyuLessonSchema.parse({
  lesson: {
   id: row.id,
   title: {
    zh: row.title_zh,
    pinyin: row.title_pinyin ?? "",
    vi: row.title_vi ?? "",
    en: row.title_en ?? "",
   },
   tags: row.tags,
   metadata: {
    legacy_id: "",
    book: row.book.title,
    volume: row.book.short_title || row.book.title,
    volume_vi: row.book.short_title || row.book.title,
    lesson_index: row.lesson_number,
    lesson_number_cn: "",
    lesson_title_cn: row.title_zh,
    lesson_title_pinyin: row.title_pinyin ?? "",
    lesson_title_vi: row.title_vi ?? "",
    lesson_title_en: row.title_en ?? "",
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
  titlePinyin: row.title_pinyin ?? undefined,
  titleEn: row.title_en ?? undefined,
  tags: row.tags,
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
   overviewMarkdown: `# ${row.title_zh}\n\n${row.title_vi ?? ""}`,
   lessonTextMarkdown: row.texts
    .slice()
    .sort((left, right) => left.text_key.localeCompare(right.text_key, "en", { numeric: true }))
    .map((text) => text.content)
    .join("\n\n"),
   grammarSummary: grammar.map((point) => point.cleanTitle).join("\n"),
   vocabularyText: vocab.map((item) => `${item.hanzi} · ${item.pinyin}`).join("\n"),
  },
  sourceLesson: buildSourceLesson(row),
  editMeta: {
   entityType: "lesson",
   entityId: row.id,
   dbId: row.id,
   updatedAt: row.updated_at,
   order: row.lesson_order,
   orderField: "lesson_order",
  },
  editableRecords: buildEditableRecords(row),
 };
}

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
const SupabaseOperationErrorSchema = z.object({ message: z.string() });

async function requireRows<T>(
 operation: string,
 promise: PromiseLike<{
  data: JsonFieldValue;
  error: Nullable<z.infer<typeof SupabaseOperationErrorSchema>>;
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
  data: JsonFieldValue;
  error: Nullable<z.infer<typeof SupabaseOperationErrorSchema>>;
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

function radicalRowToViewModel(row: RadicalRow): StaticRadicalData {
 return {
  id: row.id,
  index: row.radical_index,
  radical: row.radical,
  nameVi: row.name_vi ?? undefined,
  strokes: row.strokes,
  coreMeaning: row.core_meaning,
  recognition: row.recognition ?? undefined,
  variants: row.variants,
  relatedComponents: row.related_components,
  distinguish: row.distinguish,
  groups: row.groups,
  editMeta: {
   entityType: "radical",
   entityId: row.id,
   dbId: row.id,
   updatedAt: row.updated_at,
   order: row.radical_index,
   orderField: "radical_index",
  },
 };
}

async function getRadicalsFromDatabase(): Promise<StaticRadicalData[]> {
 const client = await createClient();
 const result = await client
  .from("hanzihome_radicals")
  .select(
   "id,radical_index,radical,name_vi,strokes,core_meaning,variants,related_components,recognition,distinguish,groups,updated_at",
  )
  .eq("source", "seed")
  .is("deleted_at", null)
  .order("radical_index");

 if (result.error) {
  throw new Error(`HanziHome Supabase radicals failed: ${result.error.message}`);
 }

 const rows = z.array(radicalRowSchema).parse(result.data);
 if (rows.length === 0) {
  throw new Error("HanziHome Supabase radicals returned no seed rows.");
 }

 return rows.map(radicalRowToViewModel);
}

async function getLessonSummaryRows(courseId?: string) {
 const client = await createClient();
 let query = client
  .from("hanzihome_lessons")
  .select(
   `
    id,
    course_id,
    book_id,
    lesson_number,
    lesson_order,
    title_zh,
    title_pinyin,
    title_vi,
    title_en,
    tags,
    source_file,
    updated_at,
    course:hanzihome_courses!inner(id,slug,title,subtitle,type,course_order,updated_at),
    book:hanzihome_course_books!inner(id,course_id,title,short_title,book_order,updated_at),
    vocab_count:hanzihome_vocab_items(count),
    grammar_count:hanzihome_grammar_points(count)
   `,
  )
  .is("deleted_at", null)
  .is("course.deleted_at", null)
  .is("book.deleted_at", null)
  .order("lesson_order");

 if (courseId) query = query.eq("course_id", courseId);
 return requireRows("lesson summaries", query, z.array(lessonSummaryRowSchema));
}

async function getCatalogStatsRows() {
 const client = await createClient();
 return requireRows(
  "catalog stats",
  client.rpc("get_hanzihome_catalog_stats"),
  z.array(catalogStatsRowSchema),
 );
}

async function getLessonDetailRow(lessonId: string) {
 const client = await createClient();
 const [shellRows, sections, grammar] = await Promise.all([
  requireRows(
   `lesson shell ${lessonId}`,
   client
    .from("hanzihome_lessons")
    .select(
     `
     id,
     course_id,
     book_id,
     lesson_number,
     lesson_order,
     title_zh,
     title_pinyin,
     title_vi,
     title_en,
     tags,
     source_file,
     updated_at,
     course:hanzihome_courses!inner(id,slug,title,subtitle,type,course_order,updated_at),
     book:hanzihome_course_books!inner(id,course_id,title,short_title,book_order,updated_at),
     texts:hanzihome_lesson_texts(id,lesson_id,text_key,title,content,content_format,updated_at)
    `,
    )
    .eq("id", lessonId)
    .is("deleted_at", null)
    .is("course.deleted_at", null)
    .is("book.deleted_at", null)
    .limit(1),
   z.array(lessonShellRowSchema),
  ),
  requireRows(
   `lesson sections ${lessonId}`,
   client
    .from("hanzihome_lesson_sections")
    .select(
     "id,lesson_id,source_section_id,section_key,section_type,title,title_vi,section_order,payload,source_file,updated_at",
    )
    .eq("lesson_id", lessonId)
    .order("section_order"),
   z.array(lessonSectionRowSchema),
  ),
  requireRows(
   `lesson grammar ${lessonId}`,
   client
    .from("hanzihome_grammar_points")
    .select(
     `
     id,lesson_id,course_id,book_id,point_order,title,title_vi,clean_title,level,core,content_md,structures_view,notes,tags,updated_at,
     examples:hanzihome_grammar_examples(id,grammar_point_id,example_order,zh,pinyin,vi,note,updated_at),
     details:hanzihome_grammar_detail_sections(id,grammar_point_id,section_key,title,lines,section_order,updated_at)
     `,
    )
    .eq("lesson_id", lessonId)
    .is("deleted_at", null)
    .order("point_order"),
   z.array(grammarRowSchema),
  ),
 ]);

 const shell = shellRows[0];
 return shell
  ? lessonDetailRowSchema.parse({
     ...shell,
     sections,
     vocab: [],
     grammar,
    })
  : null;
}

async function getLessonVocabularyRows(lessonId: string) {
 const client = await createClient();
 return requireRows(
  `lesson vocabulary resource ${lessonId}`,
  client
   .from("hanzihome_vocab_items")
   .select(
    `
    id,lesson_id,course_id,book_id,item_order,word,pinyin,han_viet,meaning,meaning_en,category,level,pos_vi,pos_zh,tone,tags,updated_at,
    examples:hanzihome_vocab_examples(id,vocab_item_id,example_order,zh,pinyin,vi,note,updated_at),
    details:hanzihome_vocab_detail_sections(id,vocab_item_id,section_key,title,lines,section_order,updated_at)
    `,
   )
   .eq("lesson_id", lessonId)
   .is("deleted_at", null)
   .is("examples.deleted_at", null)
   .is("details.deleted_at", null)
   .order("item_order"),
  z.array(vocabRowSchema),
 );
}

async function getLessonSectionRow(sectionId: string) {
 const client = await createClient();
 const rows = await requireRows(
  `lesson section ${sectionId}`,
  client.from("hanzihome_lesson_sections").select("*").eq("id", sectionId).limit(1),
  z.array(lessonSectionRowSchema),
 );
 return rows[0] ?? null;
}

function removeDeletedNestedNodes(value: JsonValue): JsonValue {
 if (Array.isArray(value)) {
  return value
   .filter((item): item is JsonValue => item !== undefined)
   .filter(
    (item) =>
     !item || typeof item !== "object" || Array.isArray(item) || !(item as JsonObject).deleted_at,
   )
   .map(removeDeletedNestedNodes);
 }
 if (!value || typeof value !== "object") return value;
 return Object.fromEntries(
  Object.entries(value as JsonObject).map(([key, item]) => [
   key,
   item === undefined ? undefined : removeDeletedNestedNodes(item),
  ]),
 );
}

function lessonSectionRowToSection(row: z.infer<typeof lessonSectionRowSchema>): Section {
 const payload = removeDeletedNestedNodes(row.payload);
 if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
  throw new Error(`HanziHome section ${row.id} payload is not an object`);
 }
 return SectionSchema.parse({
  ...payload,
  id: row.source_section_id || row.section_key,
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
   z.array(aggregateVocabRowSchema),
   (from, to) => {
    let query = client
     .from("hanzihome_vocab_items")
     .select(
      `
       *,
       lesson:hanzihome_lessons!inner(*)
      `,
     )
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
   .map((row): AggregateVocabItem => ({
    id: `${row.lesson_id}__${row.id}`,
    courseId: row.course_id,
    bookId: row.book_id,
    lessonId: row.lesson_id,
    lessonNumber: row.lesson.lesson_number,
    lessonOrder: row.lesson.lesson_order,
    lessonTitle: row.lesson.title_zh || row.lesson.title_vi || "",
    word: row.word,
    pinyin: row.pinyin,
    hanViet: row.han_viet,
    meaning: row.meaning,
    category: row.category,
    level: row.level,
    pos: { vi: row.pos_vi, zh: row.pos_zh },
   }))
   .filter((item) =>
    matchesTextQuery(
     [item.word, item.pinyin, item.hanViet, item.meaning, item.category, item.lessonTitle],
     filters.q,
    ),
   );
 }

 const rows = await requirePagedRows(
  "aggregate grammar",
  z.array(aggregateGrammarRowSchema),
  (from, to) => {
   let query = client
    .from("hanzihome_grammar_points")
    .select(
     `
      *,
      lesson:hanzihome_lessons!inner(*)
     `,
    )
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
  .map((row): AggregateGrammarItem => ({
   id: `${row.lesson_id}__${row.id}`,
   courseId: row.course_id,
   bookId: row.book_id,
   lessonId: row.lesson_id,
   lessonNumber: row.lesson.lesson_number,
   lessonOrder: row.lesson.lesson_order,
   lessonTitle: row.lesson.title_zh || row.lesson.title_vi || "",
   title: row.title,
   cleanTitle: row.clean_title,
   core: row.core,
  }))
  .filter((item) =>
   matchesTextQuery([item.title, item.cleanTitle, item.core, item.lessonTitle], filters.q),
  );
}

function buildMeta(lessons: HanziHomeLesson[], radicals: StaticRadicalData[] = []) {
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
   radicals: radicals.length,
   flashcards: 0,
  },
  schemaNote: "Runtime content is loaded from normalized Supabase tables.",
 };
}

async function getSearchData(): Promise<HanziHomeData> {
 const summaries = await getLessonSummaryRows();
 const client = await createClient();
 const [sections, texts, vocab, grammar, radicals] = await Promise.all([
  requirePagedRows("search lesson sections", z.array(lessonSectionRowSchema), (from, to) =>
   client
    .from("hanzihome_lesson_sections")
    .select("*")
    .order("lesson_id")
    .order("section_order")
    .range(from, to),
  ),
  requirePagedRows("search lesson texts", z.array(lessonTextRowSchema), (from, to) =>
   client
    .from("hanzihome_lesson_texts")
    .select("*")
    .order("lesson_id")
    .order("text_key")
    .range(from, to),
  ),
  requirePagedRows("search vocab", z.array(vocabCoreRowSchema), (from, to) =>
   client
    .from("hanzihome_vocab_items")
    .select("*")
    .order("lesson_id")
    .order("item_order")
    .range(from, to),
  ),
  requirePagedRows("search grammar", z.array(grammarCoreRowSchema), (from, to) =>
   client
    .from("hanzihome_grammar_points")
    .select("*")
    .order("lesson_id")
    .order("point_order")
    .range(from, to),
  ),
  getRadicalsFromDatabase(),
 ]);
 const sectionsByLesson = groupBy(sections, (row) => row.lesson_id);
 const textsByLesson = groupBy(texts, (row) => row.lesson_id);
 const vocabByLesson = groupBy(vocab, (row) => row.lesson_id);
 const grammarByLesson = groupBy(grammar, (row) => row.lesson_id);
 const lessons = summaries.map((summary) => {
  const detail = lessonDetailRowSchema.parse({
   ...summary,
   sections: sectionsByLesson.get(summary.id) ?? [],
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
      updatedAt: row.course.updated_at,
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
      updatedAt: row.book.updated_at,
     },
    ]),
   ).values(),
  ),
  lessons,
  radicals,
  meta: buildMeta(lessons, radicals),
 };
}

function entityLessonId(entityId: string) {
 return entityId.includes("__") ? entityId.slice(0, entityId.indexOf("__")) : "";
}

export const supabaseHanziHomeContentRepository = {
 async getCatalogSummary({ includeLessons = false } = {}) {
  const client = await createClient();
  const [courseRows, bookRows, lessonRows, statsRows, radicals] = await Promise.all([
   requireRows(
    "catalog courses",
    client
     .from("hanzihome_courses")
     .select("id, slug, title, subtitle, type, course_order, updated_at")
     .is("deleted_at", null)
     .order("course_order"),
    z.array(courseRowSchema),
   ),
   requireRows(
    "catalog books",
    client
     .from("hanzihome_course_books")
     .select("id, course_id, title, short_title, book_order, updated_at")
     .is("deleted_at", null)
     .order("book_order"),
    z.array(bookRowSchema),
   ),
   includeLessons ? getLessonSummaryRows() : Promise.resolve([]),
   includeLessons ? Promise.resolve([]) : getCatalogStatsRows(),
   getRadicalsFromDatabase(),
  ]);
  const lessons = lessonRows.map(lessonSummaryToViewModel);
  const statsByCourse = new Map(statsRows.map((row) => [row.course_id, row]));
  const courses: HanziHomeCatalogCourse[] = courseRows.map((course) => {
   const courseLessons = lessons.filter((lesson) => lesson.courseId === course.id);
   const sortedLessons = courseLessons.slice().sort((left, right) => {
    return (left.lessonOrder ?? left.lessonNumber) - (right.lessonOrder ?? right.lessonNumber);
   });
   const stats = statsByCourse.get(course.id);

   return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle ?? undefined,
    type: course.type,
    order: course.course_order,
    updatedAt: course.updated_at,
    stats: {
     bookCount: stats?.book_count ?? bookRows.filter((book) => book.course_id === course.id).length,
     lessonCount: stats?.lesson_count ?? courseLessons.length,
     vocabCount:
      stats?.vocab_count ??
      courseLessons.reduce((sum, lesson) => sum + (lesson.vocabCount ?? 0), 0),
     grammarCount:
      stats?.grammar_count ??
      courseLessons.reduce((sum, lesson) => sum + (lesson.grammarCount ?? 0), 0),
    },
    lastLessonId: stats?.last_lesson_id ?? sortedLessons.at(-1)?.id,
    fallbackLessonId: stats?.fallback_lesson_id ?? sortedLessons[0]?.id,
   };
  });
  const catalogMeta = buildMeta(lessons, radicals);

  if (!includeLessons) {
   catalogMeta.counts.lessons = courses.reduce((sum, course) => sum + course.stats.lessonCount, 0);
   catalogMeta.counts.vocab = courses.reduce((sum, course) => sum + course.stats.vocabCount, 0);
   catalogMeta.counts.grammarPoints = courses.reduce(
    (sum, course) => sum + course.stats.grammarCount,
    0,
   );
  }

  return {
   source: "db",
   courses,
   books: bookRows.map((book) => ({
    id: book.id,
    courseId: book.course_id,
    title: book.title,
    shortTitle: book.short_title ?? undefined,
    order: book.book_order,
    updatedAt: book.updated_at,
   })),
   lessons: includeLessons ? lessons : [],
   radicals,
   meta: catalogMeta,
  };
 },

 async getCourseLessonSummaries(courseId: string) {
  return (await getLessonSummaryRows(courseId)).map(lessonSummaryToViewModel);
 },

 async getLessonOverview(lessonId: string) {
  const lesson = await this.getLessonDetail(lessonId);
  return lesson ? buildLessonOverviewResource(lesson) : null;
 },

 async getLessonDetail(lessonId: z.infer<typeof OptionalNullableStringSchema>) {
  if (!lessonId) return null;
  const row = await getLessonDetailRow(lessonId);
  return row ? lessonDetailToViewModel(row) : null;
 },

 async getLessonSections(lessonId: string) {
  const lesson = await this.getLessonDetail(lessonId);
  return lesson ? buildLessonSectionsResource(lesson) : null;
 },

 async getLessonSection(sectionId: string) {
  const row = await getLessonSectionRow(sectionId);
  return row ? lessonSectionRowToSection(row) : null;
 },

 async getLessonVocabulary(lessonId: string) {
  if (!lessonId) return null;
  const rows = await getLessonVocabularyRows(lessonId);
  return {
   lessonId,
   items: rows.map(vocabRowToViewModel),
   total: rows.length,
  };
 },

 async getVocabDetail(vocabId: string) {
  const lessonId = entityLessonId(vocabId);
  if (!lessonId) return null;
  const rows = await getLessonVocabularyRows(lessonId);
  const dbId = vocabId.includes("__") ? vocabId.split("__").at(-1) : vocabId;
  const row = rows.find((item) => item.id === dbId);
  return row ? vocabRowToViewModel(row) : null;
 },

 async getLessonGrammar(lessonId: string) {
  const lesson = await this.getLessonDetail(lessonId);
  return lesson ? buildLessonGrammarResource(lesson) : null;
 },

 async getGrammarDetail(grammarId: string) {
  const lessonId = entityLessonId(grammarId);
  if (!lessonId) return null;
  const lesson = await this.getLessonDetail(lessonId);
  return lesson?.grammar.find((item) => item.id === grammarId) ?? null;
 },

 getAggregateItems,
 getSearchData,
};

export type HanzihomeContentRepository = typeof supabaseHanziHomeContentRepository;
