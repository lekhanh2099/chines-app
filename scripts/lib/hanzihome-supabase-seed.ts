import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

import {
 SectionSchema,
 type Section,
} from "../../src/features/hanzihome/static-json/schemas/hanyuLesson.schema.ts";

export const HANZIHOME_DATASETS = ["q2", "q3"] as const;
export type HanziHomeDataset = (typeof HANZIHOME_DATASETS)[number];
export type HanziHomeDatasetScope = HanziHomeDataset | "all";

export const EXPECTED_SEED_COUNTS = {
 q2: {
  lessons: 25,
  lessonSections: 227,
  vocabItems: 1418,
  grammarPoints: 76,
  vocabExamples: 3164,
  grammarExamples: 305,
  radicals: 244,
 },
 q3: {
  lessons: 26,
  lessonSections: 239,
  vocabItems: 1819,
  grammarPoints: 168,
  vocabExamples: 2974,
  grammarExamples: 378,
  radicals: 244,
 },
 all: {
  lessons: 51,
  lessonSections: 466,
  vocabItems: 3237,
  grammarPoints: 244,
  vocabExamples: 6138,
  grammarExamples: 683,
  radicals: 244,
 },
} as const;

const DATA_ROOT = path.join(process.cwd(), "data/hanzihome-db");

const OptionalTextSchema = z
 .string()
 .nullish()
 .transform((value) => value ?? "");

const TitleSchema = z.object({
 zh: z.string().min(1),
 pinyin: z.string(),
 vi: z.string(),
 en: z.string().optional(),
});

const LessonCountsSchema = z.looseObject({
 sections: z.number().int().nonnegative(),
 materializedVocabItems: z.number().int().nonnegative(),
});

const LessonManifestItemSchema = z.object({
 lessonIndex: z.number().int().positive(),
 id: z.string().min(1),
 title: TitleSchema,
 folder: z.string().min(1),
 sourceRefs: z
  .object({
   lessonFile: z.string().nullable().optional(),
   vocabFile: z.string().nullable().optional(),
  })
  .optional(),
 counts: LessonCountsSchema,
});

const DatasetManifestSchema = z.object({
 dataset: z.enum(HANZIHOME_DATASETS),
 lessons: z.array(LessonManifestItemSchema),
});

const LessonMetaSchema = z.object({
 dataset: z.enum(HANZIHOME_DATASETS),
 lessonIndex: z.number().int().positive(),
 id: z.string().min(1),
 title: TitleSchema,
 sourceRefs: z
  .object({
   lessonFile: z.string().nullable().optional(),
   vocabFile: z.string().nullable().optional(),
  })
  .optional(),
 counts: LessonCountsSchema,
});

const SectionIndexItemSchema = z.object({
 id: z.string().min(1),
 type: z.string().min(1),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string(),
 file: z.string().min(1),
});

const VocabIndexItemSchema = z.object({
 id: z.string().min(1),
 order: z.number().int().positive(),
 materialized_kind: z.string().min(1),
 file: z.string().min(1),
});

const VocabGroupSchema = z.looseObject({
 order: z.number().int().positive(),
 title: z.string().optional(),
 title_vi: z.string().optional(),
 words: z.array(z.string()).default([]),
});

const NoteSchema = z.union([
 z.string(),
 z.looseObject({
  text_vi: z.string().optional(),
  content_vi: z.string().optional(),
  note_vi: z.string().optional(),
 }),
]);

const ExampleSchema = z.looseObject({
 order: z.number().int().positive().optional(),
 zh: z.string().min(1),
 pinyin: z.string().optional(),
 vi: z.string().optional(),
 analysis_vi: z.string().optional(),
 note_vi: z.string().optional(),
 notes: z.array(NoteSchema).optional(),
});

const MeaningSchema = z.looseObject({
 hanviet: z.string().optional(),
 meaning_vi: z.string().optional(),
 short_definition_vi: z.string().optional(),
 natural_translations_vi: z.array(z.string()).optional(),
 textbook_focus_vi: z.string().optional(),
 register_vi: z.string().optional(),
 usage_domain_vi: z.string().optional(),
 notes: z.array(NoteSchema).optional(),
});

const PosSchema = z.looseObject({
 raw_vi: z.string().optional(),
 raw_cn: z.string().optional(),
 normalized: z.string().optional(),
 notes: z.array(NoteSchema).optional(),
});

const PosDetailSchema = z.looseObject({
 vi: z.string().optional(),
 cn: z.string().optional(),
 normalized: z.string().optional(),
 schema_compatible_pos: z.string().optional(),
 usage_note_vi: z.string().optional(),
 structure_vi: z.string().optional(),
 notes: z.array(NoteSchema).optional(),
});

const ComponentSchema = z.looseObject({
 text: z.string().optional(),
 hanviet: z.string().optional(),
 meaning_vi: z.string().optional(),
 position_vi: z.string().optional(),
 role: z.string().optional(),
 notes: z.array(NoteSchema).optional(),
});

const CharacterSchema = z.looseObject({
 hanzi: z.string().optional(),
 original_meaning_vi: z.string().optional(),
 modern_meaning_vi: z.string().optional(),
 modern_logic_vi: z.string().optional(),
 warning_vi: z.string().optional(),
 components: z.array(ComponentSchema).optional(),
 notes: z.array(NoteSchema).optional(),
});

const WordFormationSchema = z.looseObject({
 word_logic_vi: z.string().optional(),
 memory_tip_vi: z.string().optional(),
 warning_vi: z.string().optional(),
 characters: z.array(CharacterSchema).optional(),
 notes: z.array(NoteSchema).optional(),
});

const ComparisonTupleSchema = z.tuple([z.string(), z.string(), z.string(), z.string()]);

const ComparisonEntrySchema = z.looseObject({
 word: z.union([z.string(), ComparisonTupleSchema]).optional(),
 pinyin: z.string().optional(),
 meaning_vi: z.string().optional(),
 difference_vi: z.string().optional(),
 register_vi: z.string().optional(),
 example_zh: z.string().optional(),
 example_vi: z.string().optional(),
 notes: z.array(NoteSchema).optional(),
});

const ComparisonEntryValueSchema = z.union([ComparisonEntrySchema, ComparisonTupleSchema]);

const ComparisonSchema = z.looseObject({
 near_synonyms: z.array(ComparisonEntryValueSchema).optional(),
 antonyms: z.array(ComparisonEntryValueSchema).optional(),
 contrast_pairs: z.array(ComparisonEntryValueSchema).optional(),
 usage_rules: z.array(z.string()).optional(),
 notes: z.array(NoteSchema).optional(),
});

const CollocationSchema = z.looseObject({
 order: z.number().int().positive().optional(),
 zh: z.string().optional(),
 pinyin: z.string().optional(),
 vi: z.string().optional(),
 pattern: z.string().optional(),
 note_vi: z.string().optional(),
 notes: z.array(NoteSchema).optional(),
});

const CultureNoteSchema = z.looseObject({
 title: z.string().optional(),
 content_vi: z.string().optional(),
 text_vi: z.string().optional(),
 notes: z.array(NoteSchema).optional(),
});

const WarningExampleSchema = z.looseObject({
 zh: z.string().optional(),
 pinyin: z.string().optional(),
 vi: z.string().optional(),
 note_vi: z.string().optional(),
});

const WarningExampleValueSchema = z.union([z.string(), WarningExampleSchema]);

const WarningSchema = z.looseObject({
 order: z.number().int().positive().optional(),
 rule_vi: z.string().optional(),
 explanation_vi: z.string().optional(),
 natural_examples: z.array(WarningExampleValueSchema).optional(),
 unnatural_examples: z.array(WarningExampleValueSchema).optional(),
 wrong_examples: z.array(WarningExampleValueSchema).optional(),
 correct_examples: z.array(WarningExampleValueSchema).optional(),
 notes: z.array(NoteSchema).optional(),
});

const RichVocabItemSchema = z.looseObject({
 id: z.string().min(1),
 hanzi: z.string().min(1),
 pinyin: z.string().min(1),
 pos: PosSchema,
 level_tag: z.string().optional(),
 meaning: MeaningSchema,
 word_formation: WordFormationSchema.optional(),
 comparison: ComparisonSchema.optional(),
 collocations: z.array(CollocationSchema).optional(),
 examples: z.array(ExampleSchema).optional(),
 culture_note: CultureNoteSchema.optional(),
 warnings: z.array(WarningSchema).optional(),
 notes: z.array(NoteSchema).optional(),
});

const SyntheticVocabItemSchema = z.looseObject({
 id: z.string().min(1),
 hanzi: z.string().min(1),
 pinyin: z.string().min(1),
 meaning_vi: z.string(),
 pos: z.string(),
 pos_detail: PosDetailSchema.optional(),
});

const VocabItemSchema = z.union([RichVocabItemSchema, SyntheticVocabItemSchema]);

const GrammarFormulaSchema = z.looseObject({
 label: z.string().optional(),
 pattern: z.string().optional(),
});

const GrammarSideSchema = z.looseObject({
 label: z.string().optional(),
 value: z.string().optional(),
});

const GrammarBlockItemSchema = z.looseObject({
 aspect: z.string().optional(),
 left: GrammarSideSchema.optional(),
 right: GrammarSideSchema.optional(),
 wrong: z.string().optional(),
 correct: z.string().optional(),
 explanation_vi: z.string().optional(),
 title: z.string().optional(),
 label: z.string().optional(),
 content_vi: z.string().optional(),
 meaning_vi: z.string().optional(),
 note_vi: z.string().optional(),
});

const GrammarBlockSchema = z.looseObject({
 id: z.string().min(1),
 type: z.string().min(1),
 order: z.number().int().positive(),
 title: z.string(),
 content_vi: z.string().optional(),
 pattern: z.string().optional(),
 meaning_vi: z.string().optional(),
 formulas: z.array(GrammarFormulaSchema).optional(),
 notes_vi: z.array(z.string()).optional(),
 examples: z.array(ExampleSchema).optional(),
 items: z.array(GrammarBlockItemSchema).optional(),
 questions: z
  .array(
   z.looseObject({
    prompt: z.string().optional(),
   }),
  )
  .optional(),
});

const GrammarPointSchema = z.looseObject({
 id: z.string().min(1),
 order: z.number().int().positive(),
 title: z.string().min(1),
 title_vi: z.string().optional(),
 level: z.string().optional(),
 tags: z.array(z.string()).optional(),
 blocks: z.array(GrammarBlockSchema),
});

const GrammarSectionSchema = z.looseObject({
 type: z.literal("grammar"),
 items: z.array(GrammarPointSchema),
});

const TextLineSchema = z.looseObject({
 order: z.number().int().positive(),
 speaker: z.string().optional(),
 zh: z.string().min(1),
 pinyin: z.string().optional(),
 vi: z.string().optional(),
});

const TextBlockSchema = z.looseObject({
 id: z.string().min(1),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional(),
 lines: z.array(TextLineSchema).optional(),
 paragraphs: z.array(TextLineSchema).optional(),
});

const TextSectionSchema = z.looseObject({
 type: z.literal("text"),
 title: z.string(),
 title_vi: z.string().optional(),
 blocks: z.array(TextBlockSchema),
});

const RadicalComponentSchema = z.object({
 form: z.string().min(1),
 note: OptionalTextSchema,
});

const RadicalGroupSchema = z.object({
 name: z.string().min(1),
 chars: z.array(z.string().min(1)),
});

const RadicalSchema = z.object({
 id: z.string().min(1),
 index: z.number().int().positive(),
 radical: z.string().min(1),
 nameVi: z.string().optional(),
 strokes: z.number().int().positive().nullable().optional(),
 coreMeaning: z.object({
  modern: z.string().optional(),
  history: z.string().optional(),
 }),
 recognition: z.string().optional(),
 variants: z.array(RadicalComponentSchema),
 relatedComponents: z.array(RadicalComponentSchema).default([]),
 distinguish: z.array(z.string()).default([]),
 groups: z.array(RadicalGroupSchema).default([]),
});

const RadicalsPayloadSchema = z.object({
 radicals: z.array(RadicalSchema),
});

export type CourseRow = {
 id: string;
 user_id: null;
 slug: string;
 title: string;
 subtitle: string;
 type: "hanyu";
 course_order: number;
 source: "seed";
 imported_at: string;
};

export type BookRow = {
 id: string;
 user_id: null;
 course_id: string;
 title: string;
 short_title: string;
 book_order: number;
 source: "seed";
 imported_at: string;
};

export type LessonRow = {
 id: string;
 course_id: string;
 book_id: string;
 owner_id: null;
 source: "seed";
 lesson_number: number;
 lesson_order: number;
 title_zh: string;
 title_vi: string;
 source_file: string | null;
 imported_at: string;
};

export type LessonTextRow = {
 id: string;
 lesson_id: string;
 owner_id: null;
 source: "seed";
 text_key: string;
 title: string;
 content: string;
 content_format: "markdown";
 imported_at: string;
};

export type LessonSectionRow = {
 id: string;
 lesson_id: string;
 owner_id: null;
 source: "seed";
 source_section_id: string;
 section_key: string;
 section_type: string;
 title: string;
 title_vi: string;
 section_order: number;
 payload: Section;
 source_file: string;
 imported_at: string;
};

export type VocabItemRow = {
 id: string;
 lesson_id: string;
 course_id: string;
 book_id: string;
 owner_id: null;
 source: "seed";
 item_order: number;
 word: string;
 pinyin: string;
 han_viet: string;
 meaning: string;
 category: string;
 level: string | null;
 pos_vi: string | null;
 pos_zh: string | null;
 tone: null;
 source_file: string | null;
 imported_at: string;
};

export type VocabExampleRow = {
 id: string;
 vocab_item_id: string;
 lesson_id: string;
 owner_id: null;
 source: "seed";
 example_order: number;
 zh: string;
 pinyin: string | null;
 vi: string | null;
 note: string | null;
 imported_at: string;
};

export type VocabDetailSectionRow = {
 id: string;
 vocab_item_id: string;
 lesson_id: string;
 owner_id: null;
 source: "seed";
 section_key: string;
 title: string;
 lines: string[];
 section_order: number;
 imported_at: string;
};

export type GrammarPointRow = {
 id: string;
 lesson_id: string;
 course_id: string;
 book_id: string;
 owner_id: null;
 source: "seed";
 point_order: number;
 title: string;
 clean_title: string;
 core: string;
 content_md: string;
 structures_view: string[];
 notes: string[];
 imported_at: string;
};

export type GrammarExampleRow = {
 id: string;
 grammar_point_id: string;
 lesson_id: string;
 owner_id: null;
 source: "seed";
 example_order: number;
 zh: string;
 pinyin: string | null;
 vi: string | null;
 note: string | null;
 imported_at: string;
};

export type GrammarDetailSectionRow = {
 id: string;
 grammar_point_id: string;
 lesson_id: string;
 owner_id: null;
 source: "seed";
 section_key: string;
 title: string;
 lines: string[];
 section_order: number;
 imported_at: string;
};

export type RadicalRow = {
 id: string;
 owner_id: null;
 source: "seed";
 radical_index: number;
 radical: string;
 name_vi: string | null;
 strokes: number | null;
 core_meaning: {
  modern?: string;
  history?: string;
 };
 variants: Array<{
  form: string;
  note: string;
 }>;
 related_components: Array<{
  form: string;
  note: string;
 }>;
 recognition: string | null;
 distinguish: string[];
 groups: Array<{
  name: string;
  chars: string[];
 }>;
 imported_at: string;
};

export type HanziHomeSeedData = {
 datasets: HanziHomeDataset[];
 courses: CourseRow[];
 books: BookRow[];
 lessons: LessonRow[];
 lessonSections: LessonSectionRow[];
 lessonTexts: LessonTextRow[];
 vocabItems: VocabItemRow[];
 vocabExamples: VocabExampleRow[];
 vocabDetailSections: VocabDetailSectionRow[];
 grammarPoints: GrammarPointRow[];
 grammarExamples: GrammarExampleRow[];
 grammarDetailSections: GrammarDetailSectionRow[];
 radicals: RadicalRow[];
};

type ParsedRichVocabItem = z.infer<typeof RichVocabItemSchema>;
type ParsedVocabItem = z.infer<typeof VocabItemSchema>;
type ParsedGrammarPoint = z.infer<typeof GrammarPointSchema>;
type ParsedGrammarBlock = z.infer<typeof GrammarBlockSchema>;

type DatasetConfig = {
 courseId: string;
 courseTitle: string;
 courseSubtitle: string;
 courseOrder: number;
 books: {
  upper: { id: string; title: string; shortTitle: string; order: number };
  lower: { id: string; title: string; shortTitle: string; order: number };
 };
};

const DATASET_CONFIG: Record<HanziHomeDataset, DatasetConfig> = {
 q2: {
  courseId: "hanyu-q2",
  courseTitle: "Giáo trình Hán ngữ Quyển 2",
  courseSubtitle: "Hán ngữ 2 Thượng và Hạ",
  courseOrder: 2,
  books: {
   upper: {
    id: "hanyu-q2-shang",
    title: "Hán ngữ 2 Thượng",
    shortTitle: "Quyển 2 Thượng",
    order: 1,
   },
   lower: {
    id: "hanyu-q2-xia",
    title: "Hán ngữ 2 Hạ",
    shortTitle: "Quyển 2 Hạ",
    order: 2,
   },
  },
 },
 q3: {
  courseId: "hanyu-q3",
  courseTitle: "Giáo trình Hán ngữ Quyển 3",
  courseSubtitle: "Hán ngữ 3 Thượng và Hạ",
  courseOrder: 3,
  books: {
   upper: {
    id: "hanyu-q3-shang",
    title: "Hán ngữ 3 Thượng",
    shortTitle: "Quyển 3 Thượng",
    order: 1,
   },
   lower: {
    id: "hanyu-q3-xia",
    title: "Hán ngữ 3 Hạ",
    shortTitle: "Quyển 3 Hạ",
    order: 2,
   },
  },
 },
};

function stableUuidFromKey(key: string) {
 const hex = createHash("sha256").update(key).digest("hex").slice(0, 32).split("");
 hex[12] = "5";
 hex[16] = ((Number.parseInt(hex[16] ?? "0", 16) & 0x3) | 0x8).toString(16);
 const value = hex.join("");
 return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

async function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
 const content = await readFile(filePath, "utf8");
 const parsedJson: unknown = JSON.parse(content);
 const parsed = schema.safeParse(parsedJson);

 if (!parsed.success) {
  throw new Error(
   `Invalid HanziHome DB JSON: ${path.relative(process.cwd(), filePath)}\n${z.prettifyError(parsed.error)}`,
  );
 }

 return parsed.data;
}

function selectedDatasets(scope: HanziHomeDatasetScope): HanziHomeDataset[] {
 return scope === "all" ? [...HANZIHOME_DATASETS] : [scope];
}

function bookForLesson(dataset: HanziHomeDataset, lessonIndex: number) {
 const config = DATASET_CONFIG[dataset];
 return lessonIndex <= 12 ? config.books.upper : config.books.lower;
}

function nonEmpty(value: string | undefined | null): value is string {
 return typeof value === "string" && value.trim().length > 0;
}

function cleanLines(lines: Array<string | undefined | null>) {
 return lines.filter(nonEmpty).map((line) => line.trim());
}

function noteLines(notes: z.infer<typeof NoteSchema>[] | undefined) {
 return (notes ?? []).flatMap((note) => {
  if (typeof note === "string") return nonEmpty(note) ? [note] : [];
  return cleanLines([note.text_vi, note.content_vi, note.note_vi]);
 });
}

function categoryForWord(groups: z.infer<typeof VocabGroupSchema>[], word: string) {
 const group = groups
  .slice()
  .sort((left, right) => left.order - right.order)
  .find((candidate) => candidate.words.includes(word));
 return group?.title_vi || group?.title || "Từ vựng";
}

function isRichVocabItem(item: ParsedVocabItem): item is ParsedRichVocabItem {
 return typeof item.pos === "object";
}

function renderComparisonEntry(entry: z.infer<typeof ComparisonEntryValueSchema>) {
 if (Array.isArray(entry)) {
  return cleanLines([[entry[0], entry[1]].filter(nonEmpty).join(" · "), entry[2], entry[3]]).join(
   " — ",
  );
 }

 const word = Array.isArray(entry.word)
  ? cleanLines([entry.word[0], entry.word[1]]).join(" · ")
  : entry.word;
 const tupleMeaning = Array.isArray(entry.word) ? entry.word[2] : undefined;
 const tupleDifference = Array.isArray(entry.word) ? entry.word[3] : undefined;
 const head = cleanLines([
  [word, entry.pinyin].filter(nonEmpty).join(" · "),
  entry.meaning_vi || tupleMeaning,
 ]).join(" — ");
 const details = cleanLines([
  entry.difference_vi || tupleDifference,
  entry.register_vi,
  entry.example_zh && entry.example_vi
   ? `${entry.example_zh} — ${entry.example_vi}`
   : entry.example_zh || entry.example_vi,
  ...noteLines(entry.notes),
 ]);
 return [head, ...details].filter(nonEmpty).join(" | ");
}

function vocabDetailSections(params: { item: ParsedVocabItem; lessonId: string }) {
 if (!isRichVocabItem(params.item)) return [];

 const item = params.item;
 const sections: Array<{ key: string; title: string; lines: string[] }> = [];
 const meaningLines = cleanLines([
  item.meaning.short_definition_vi || item.meaning.meaning_vi,
  item.meaning.textbook_focus_vi,
  item.meaning.register_vi,
  item.meaning.usage_domain_vi,
  ...(item.meaning.natural_translations_vi ?? []),
  ...noteLines(item.meaning.notes),
 ]);
 if (meaningLines.length > 0) {
  sections.push({ key: "meaning", title: "Nghĩa và cách dùng", lines: meaningLines });
 }

 if (item.word_formation) {
  const characterLines = (item.word_formation.characters ?? []).flatMap((character) => {
   const components = (character.components ?? []).map((component) =>
    cleanLines([
     component.text,
     component.hanviet,
     component.meaning_vi,
     component.position_vi,
     component.role,
    ]).join(" · "),
   );
   return cleanLines([
    character.hanzi,
    character.original_meaning_vi,
    character.modern_meaning_vi,
    character.modern_logic_vi,
    character.warning_vi,
    ...components,
    ...noteLines(character.notes),
   ]);
  });
  const lines = cleanLines([
   item.word_formation.word_logic_vi,
   item.word_formation.memory_tip_vi,
   item.word_formation.warning_vi,
   ...characterLines,
   ...noteLines(item.word_formation.notes),
  ]);
  if (lines.length > 0) {
   sections.push({ key: "word_formation", title: "Cấu tạo và ghi nhớ", lines });
  }
 }

 if (item.comparison) {
  const lines = cleanLines([
   ...(item.comparison.usage_rules ?? []),
   ...(item.comparison.near_synonyms ?? []).map(renderComparisonEntry),
   ...(item.comparison.antonyms ?? []).map(renderComparisonEntry),
   ...(item.comparison.contrast_pairs ?? []).map(renderComparisonEntry),
   ...noteLines(item.comparison.notes),
  ]);
  if (lines.length > 0) {
   sections.push({ key: "comparison", title: "So sánh và phân biệt", lines });
  }
 }

 const collocationLines = (item.collocations ?? []).map((collocation) =>
  cleanLines([
   [collocation.zh, collocation.pinyin].filter(nonEmpty).join(" · "),
   collocation.vi,
   collocation.pattern,
   collocation.note_vi,
   ...noteLines(collocation.notes),
  ]).join(" — "),
 );
 if (collocationLines.length > 0) {
  sections.push({
   key: "collocations",
   title: "Kết hợp từ",
   lines: collocationLines.filter(nonEmpty),
  });
 }

 if (item.culture_note) {
  const lines = cleanLines([
   item.culture_note.content_vi || item.culture_note.text_vi,
   ...noteLines(item.culture_note.notes),
  ]);
  if (lines.length > 0) {
   sections.push({
    key: "culture",
    title: item.culture_note.title || "Văn hóa và ngữ cảnh",
    lines,
   });
  }
 }

 const warningLines = (item.warnings ?? []).flatMap((warning) => {
  const renderExamples = (label: string, examples: z.infer<typeof WarningExampleValueSchema>[]) =>
   examples.map((example) =>
    typeof example === "string"
     ? `${label}: ${example}`
     : `${label}: ${cleanLines([example.zh, example.pinyin, example.vi, example.note_vi]).join(
        " — ",
       )}`,
   );
  return cleanLines([
   warning.rule_vi,
   warning.explanation_vi,
   ...renderExamples("Tự nhiên", warning.natural_examples ?? []),
   ...renderExamples("Không tự nhiên", warning.unnatural_examples ?? []),
   ...renderExamples("Sai", warning.wrong_examples ?? []),
   ...renderExamples("Đúng", warning.correct_examples ?? []),
   ...noteLines(warning.notes),
  ]);
 });
 if (warningLines.length > 0) {
  sections.push({ key: "warnings", title: "Lưu ý và lỗi sai", lines: warningLines });
 }

 const notes = noteLines(item.notes);
 if (notes.length > 0) {
  sections.push({ key: "notes", title: "Ghi chú", lines: notes });
 }

 return sections.map<VocabDetailSectionRow>((section, index) => ({
  id: stableUuidFromKey(`hanzihome:vocab-detail:${item.id}:${section.key}`),
  vocab_item_id: item.id,
  lesson_id: params.lessonId,
  owner_id: null,
  source: "seed",
  section_key: section.key,
  title: section.title,
  lines: section.lines,
  section_order: index + 1,
  imported_at: "",
 }));
}

function renderTextBlock(block: z.infer<typeof TextBlockSchema>) {
 const content = [...(block.lines ?? []), ...(block.paragraphs ?? [])]
  .sort((left, right) => left.order - right.order)
  .flatMap((line) =>
   cleanLines([
    line.speaker ? `**${line.speaker}:** ${line.zh}` : line.zh,
    line.pinyin ? `_${line.pinyin}_` : null,
    line.vi,
   ]),
  );
 return [`## ${block.title_vi || block.title}`, ...content].join("\n\n");
}

function renderGrammarBlockItem(item: z.infer<typeof GrammarBlockItemSchema>) {
 if (item.left || item.right) {
  return cleanLines([
   item.aspect,
   item.left ? `Trái: ${cleanLines([item.left.label, item.left.value]).join(" — ")}` : null,
   item.right ? `Phải: ${cleanLines([item.right.label, item.right.value]).join(" — ")}` : null,
  ]);
 }
 return cleanLines([
  item.wrong ? `Sai: ${item.wrong}` : null,
  item.correct ? `Đúng: ${item.correct}` : null,
  item.explanation_vi,
  item.title || item.label,
  item.content_vi || item.meaning_vi,
  item.note_vi,
 ]);
}

function grammarBlockLines(block: ParsedGrammarBlock) {
 return cleanLines([
  block.content_vi,
  block.pattern ? `Cấu trúc: ${block.pattern}` : null,
  block.meaning_vi,
  ...(block.formulas ?? []).map((formula) =>
   cleanLines([formula.label, formula.pattern]).join(": "),
  ),
  ...(block.notes_vi ?? []),
  ...(block.items ?? []).flatMap(renderGrammarBlockItem),
  ...(block.questions ?? []).map((question) => question.prompt),
 ]);
}

function grammarPointCore(point: ParsedGrammarPoint) {
 const overview = point.blocks.find((block) => block.type === "grammar_overview");
 return (
  overview?.content_vi ||
  point.blocks.find((block) => nonEmpty(block.content_vi))?.content_vi ||
  point.blocks.find((block) => nonEmpty(block.meaning_vi))?.meaning_vi ||
  ""
 );
}

function renderGrammarPoint(point: ParsedGrammarPoint) {
 const lines = [`## ${point.title_vi || point.title}`];
 if (point.level) lines.push(`**Cấp độ:** ${point.level}`);
 for (const block of point.blocks.slice().sort((left, right) => left.order - right.order)) {
  lines.push(`### ${block.title}`, ...grammarBlockLines(block));
  for (const example of block.examples ?? []) {
   lines.push(...cleanLines([example.zh, example.pinyin, example.vi, example.note_vi]));
  }
 }
 return lines.join("\n\n");
}

async function loadLessonSeed(params: {
 dataset: HanziHomeDataset;
 lessonFolder: string;
 importedAt: string;
 seed: HanziHomeSeedData;
}) {
 const folderPath = path.join(DATA_ROOT, params.dataset, params.lessonFolder);
 const lessonMeta = await readJsonFile(path.join(folderPath, "lesson.json"), LessonMetaSchema);
 const sectionIndex = await readJsonFile(
  path.join(folderPath, "sections/index.json"),
  z.array(SectionIndexItemSchema),
 );
 const vocabIndex = await readJsonFile(
  path.join(folderPath, "vocabulary/index.json"),
  z.array(VocabIndexItemSchema),
 );
 const vocabGroups = await readJsonFile(
  path.join(folderPath, "vocabulary/groups.json"),
  z.array(VocabGroupSchema),
 );
 const config = DATASET_CONFIG[params.dataset];
 const book = bookForLesson(params.dataset, lessonMeta.lessonIndex);

 params.seed.lessons.push({
  id: lessonMeta.id,
  course_id: config.courseId,
  book_id: book.id,
  owner_id: null,
  source: "seed",
  lesson_number: lessonMeta.lessonIndex,
  lesson_order: lessonMeta.lessonIndex,
  title_zh: lessonMeta.title.zh,
  title_vi: lessonMeta.title.vi,
  source_file: lessonMeta.sourceRefs?.lessonFile ?? null,
  imported_at: params.importedAt,
 });

 for (const sectionEntry of sectionIndex.slice().sort((left, right) => left.order - right.order)) {
  const sectionPath = path.join(folderPath, "sections", sectionEntry.file);
  const payload = await readJsonFile(sectionPath, SectionSchema);

  params.seed.lessonSections.push({
   id: stableUuidFromKey(`hanzihome:lesson-section:${lessonMeta.id}:${sectionEntry.id}`),
   lesson_id: lessonMeta.id,
   owner_id: null,
   source: "seed",
   source_section_id: sectionEntry.id,
   section_key: sectionEntry.id,
   section_type: sectionEntry.type,
   title: sectionEntry.title,
   title_vi: sectionEntry.title_vi,
   section_order: sectionEntry.order,
   payload,
   source_file: path.relative(process.cwd(), sectionPath).split(path.sep).join("/"),
   imported_at: params.importedAt,
  });
 }

 const textEntry = sectionIndex.find((section) => section.type === "text");
 if (textEntry) {
  const textSection = await readJsonFile(
   path.join(folderPath, "sections", textEntry.file),
   TextSectionSchema,
  );
  for (const block of textSection.blocks.slice().sort((left, right) => left.order - right.order)) {
   params.seed.lessonTexts.push({
    id: stableUuidFromKey(`hanzihome:lesson-text:${lessonMeta.id}:${block.id}`),
    lesson_id: lessonMeta.id,
    owner_id: null,
    source: "seed",
    text_key: block.id,
    title: block.title_vi || block.title,
    content: renderTextBlock(block),
    content_format: "markdown",
    imported_at: params.importedAt,
   });
  }
 }

 for (const indexItem of vocabIndex.slice().sort((left, right) => left.order - right.order)) {
  const item = await readJsonFile(path.join(folderPath, indexItem.file), VocabItemSchema);
  const rich = isRichVocabItem(item);
  const meaning = rich
   ? item.meaning.meaning_vi || item.meaning.short_definition_vi || ""
   : item.meaning_vi;
  const posVi = rich ? item.pos.raw_vi : item.pos_detail?.vi || item.pos;
  const posZh = rich ? item.pos.raw_cn : item.pos_detail?.cn;

  params.seed.vocabItems.push({
   id: item.id,
   lesson_id: lessonMeta.id,
   course_id: config.courseId,
   book_id: book.id,
   owner_id: null,
   source: "seed",
   item_order: indexItem.order,
   word: item.hanzi,
   pinyin: item.pinyin,
   han_viet: rich ? item.meaning.hanviet || "" : "",
   meaning,
   category: categoryForWord(vocabGroups, item.hanzi),
   level: rich ? item.level_tag || null : null,
   pos_vi: posVi || null,
   pos_zh: posZh || null,
   tone: null,
   source_file: lessonMeta.sourceRefs?.vocabFile ?? null,
   imported_at: params.importedAt,
  });

  const examples = rich ? (item.examples ?? []) : [];
  examples.forEach((example, index) => {
   const exampleOrder = index + 1;
   params.seed.vocabExamples.push({
    id: stableUuidFromKey(`hanzihome:vocab-example:${item.id}:${exampleOrder}`),
    vocab_item_id: item.id,
    lesson_id: lessonMeta.id,
    owner_id: null,
    source: "seed",
    example_order: exampleOrder,
    zh: example.zh,
    pinyin: example.pinyin || null,
    vi: example.vi || null,
    note: example.analysis_vi || example.note_vi || null,
    imported_at: params.importedAt,
   });
  });

  const detailSections = vocabDetailSections({ item, lessonId: lessonMeta.id });
  params.seed.vocabDetailSections.push(
   ...detailSections.map((section) => ({ ...section, imported_at: params.importedAt })),
  );
 }

 const grammarEntry = sectionIndex.find((section) => section.type === "grammar");
 if (!grammarEntry) return;

 const grammarSection = await readJsonFile(
  path.join(folderPath, "sections", grammarEntry.file),
  GrammarSectionSchema,
 );
 for (const point of grammarSection.items.slice().sort((left, right) => left.order - right.order)) {
  params.seed.grammarPoints.push({
   id: point.id,
   lesson_id: lessonMeta.id,
   course_id: config.courseId,
   book_id: book.id,
   owner_id: null,
   source: "seed",
   point_order: point.order,
   title: point.title_vi || point.title,
   clean_title: point.title_vi || point.title,
   core: grammarPointCore(point),
   content_md: renderGrammarPoint(point),
   structures_view: point.blocks.flatMap((block) =>
    cleanLines([block.pattern, ...(block.formulas ?? []).map((formula) => formula.pattern)]),
   ),
   notes: point.blocks.flatMap((block) => block.notes_vi ?? []),
   imported_at: params.importedAt,
  });

  const sortedBlocks = point.blocks.slice().sort((left, right) => left.order - right.order);
  sortedBlocks.forEach((block, index) => {
   const lines = grammarBlockLines(block);
   if (lines.length === 0) return;
   params.seed.grammarDetailSections.push({
    id: stableUuidFromKey(`hanzihome:grammar-detail:${point.id}:${block.id}`),
    grammar_point_id: point.id,
    lesson_id: lessonMeta.id,
    owner_id: null,
    source: "seed",
    section_key: block.id,
    title: block.title,
    lines,
    section_order: index + 1,
    imported_at: params.importedAt,
   });
  });

  const examples = sortedBlocks.flatMap((block) => block.examples ?? []);
  examples.forEach((example, index) => {
   const exampleOrder = index + 1;
   params.seed.grammarExamples.push({
    id: stableUuidFromKey(`hanzihome:grammar-example:${point.id}:${exampleOrder}`),
    grammar_point_id: point.id,
    lesson_id: lessonMeta.id,
    owner_id: null,
    source: "seed",
    example_order: exampleOrder,
    zh: example.zh,
    pinyin: example.pinyin || null,
    vi: example.vi || null,
    note: example.analysis_vi || example.note_vi || null,
    imported_at: params.importedAt,
   });
  });
 }
}

async function loadRadicalSeed(importedAt: string): Promise<RadicalRow[]> {
 const payload = await readJsonFile(path.join(DATA_ROOT, "radicals.json"), RadicalsPayloadSchema);
 return payload.radicals.map((radical) => ({
  id: radical.id,
  owner_id: null,
  source: "seed",
  radical_index: radical.index,
  radical: radical.radical,
  name_vi: radical.nameVi ?? null,
  strokes: radical.strokes ?? null,
  core_meaning: radical.coreMeaning,
  variants: radical.variants,
  related_components: radical.relatedComponents,
  recognition: radical.recognition ?? null,
  distinguish: radical.distinguish,
  groups: radical.groups,
  imported_at: importedAt,
 }));
}

export async function buildHanziHomeSeedData(
 scope: HanziHomeDatasetScope,
 importedAt = new Date().toISOString(),
): Promise<HanziHomeSeedData> {
 const datasets = selectedDatasets(scope);
 const seed: HanziHomeSeedData = {
  datasets,
  courses: [],
  books: [],
  lessons: [],
  lessonSections: [],
  lessonTexts: [],
  vocabItems: [],
  vocabExamples: [],
  vocabDetailSections: [],
  grammarPoints: [],
  grammarExamples: [],
  grammarDetailSections: [],
  radicals: await loadRadicalSeed(importedAt),
 };

 for (const dataset of datasets) {
  const config = DATASET_CONFIG[dataset];
  seed.courses.push({
   id: config.courseId,
   user_id: null,
   slug: config.courseId,
   title: config.courseTitle,
   subtitle: config.courseSubtitle,
   type: "hanyu",
   course_order: config.courseOrder,
   source: "seed",
   imported_at: importedAt,
  });
  seed.books.push(
   ...Object.values(config.books).map((book) => ({
    id: book.id,
    user_id: null,
    course_id: config.courseId,
    title: book.title,
    short_title: book.shortTitle,
    book_order: book.order,
    source: "seed" as const,
    imported_at: importedAt,
   })),
  );

  const manifest = await readJsonFile(
   path.join(DATA_ROOT, dataset, "manifest.json"),
   DatasetManifestSchema,
  );
  for (const lesson of manifest.lessons
   .slice()
   .sort((left, right) => left.lessonIndex - right.lessonIndex)) {
   await loadLessonSeed({
    dataset,
    lessonFolder: lesson.folder,
    importedAt,
    seed,
   });
  }
 }

 return seed;
}

type SeedCollectionName =
 | "courses"
 | "books"
 | "lessons"
 | "lessonSections"
 | "lessonTexts"
 | "vocabItems"
 | "vocabExamples"
 | "vocabDetailSections"
 | "grammarPoints"
 | "grammarExamples"
 | "grammarDetailSections"
 | "radicals";

const COLLECTION_NAMES: SeedCollectionName[] = [
 "courses",
 "books",
 "lessons",
 "lessonSections",
 "lessonTexts",
 "vocabItems",
 "vocabExamples",
 "vocabDetailSections",
 "grammarPoints",
 "grammarExamples",
 "grammarDetailSections",
 "radicals",
];

export type SeedValidationReport = {
 errors: string[];
 duplicateIds: number;
 missingParents: number;
 counts: Record<SeedCollectionName, number>;
};

function duplicateValues(values: string[]) {
 const seen = new Set<string>();
 const duplicates = new Set<string>();
 for (const value of values) {
  if (seen.has(value)) duplicates.add(value);
  seen.add(value);
 }
 return [...duplicates];
}

function duplicateOrderKeys(rows: Array<{ parent: string; order: number }>) {
 return duplicateValues(rows.map((row) => `${row.parent}:${row.order}`));
}

export function validateHanziHomeSeedData(
 seed: HanziHomeSeedData,
 scope: HanziHomeDatasetScope,
): SeedValidationReport {
 const errors: string[] = [];
 let duplicateIds = 0;
 let missingParents = 0;

 for (const collection of COLLECTION_NAMES) {
  const duplicates = duplicateValues(seed[collection].map((row) => row.id));
  duplicateIds += duplicates.length;
  if (duplicates.length > 0) {
   errors.push(`${collection}: duplicate primary keys: ${duplicates.slice(0, 10).join(", ")}`);
  }
 }

 const lessonIds = new Set(seed.lessons.map((row) => row.id));
 const vocabItemIds = new Set(seed.vocabItems.map((row) => row.id));
 const grammarPointIds = new Set(seed.grammarPoints.map((row) => row.id));
 const radicalIndexes = duplicateValues(seed.radicals.map((row) => String(row.radical_index)));
 if (radicalIndexes.length > 0) {
  errors.push(
   `radicals: duplicate radical_index values: ${radicalIndexes.slice(0, 10).join(", ")}`,
  );
 }
 const courseIds = new Set(seed.courses.map((row) => row.id));
 const bookIds = new Set(seed.books.map((row) => row.id));

 const checkParent = (exists: boolean, context: string) => {
  if (exists) return;
  missingParents += 1;
  errors.push(`Missing parent: ${context}`);
 };

 seed.books.forEach((row) => checkParent(courseIds.has(row.course_id), `book ${row.id}`));
 seed.lessons.forEach((row) => {
  checkParent(courseIds.has(row.course_id), `lesson ${row.id} course ${row.course_id}`);
  checkParent(bookIds.has(row.book_id), `lesson ${row.id} book ${row.book_id}`);
 });
 seed.lessonSections.forEach((row) =>
  checkParent(lessonIds.has(row.lesson_id), `lesson section ${row.id}`),
 );
 seed.lessonTexts.forEach((row) =>
  checkParent(lessonIds.has(row.lesson_id), `lesson text ${row.id}`),
 );
 seed.vocabItems.forEach((row) =>
  checkParent(lessonIds.has(row.lesson_id), `vocab item ${row.id}`),
 );
 seed.vocabExamples.forEach((row) => {
  checkParent(vocabItemIds.has(row.vocab_item_id), `vocab example ${row.id}`);
  checkParent(lessonIds.has(row.lesson_id), `vocab example ${row.id} lesson`);
 });
 seed.vocabDetailSections.forEach((row) => {
  checkParent(vocabItemIds.has(row.vocab_item_id), `vocab detail ${row.id}`);
  checkParent(lessonIds.has(row.lesson_id), `vocab detail ${row.id} lesson`);
 });
 seed.grammarPoints.forEach((row) =>
  checkParent(lessonIds.has(row.lesson_id), `grammar point ${row.id}`),
 );
 seed.grammarExamples.forEach((row) => {
  checkParent(grammarPointIds.has(row.grammar_point_id), `grammar example ${row.id}`);
  checkParent(lessonIds.has(row.lesson_id), `grammar example ${row.id} lesson`);
 });
 seed.grammarDetailSections.forEach((row) => {
  checkParent(grammarPointIds.has(row.grammar_point_id), `grammar detail ${row.id}`);
  checkParent(lessonIds.has(row.lesson_id), `grammar detail ${row.id} lesson`);
 });

 const duplicateOrders = [
  ...duplicateOrderKeys(
   seed.lessonSections.map((row) => ({
    parent: row.lesson_id,
    order: row.section_order,
   })),
  ),
  ...duplicateOrderKeys(
   seed.vocabItems.map((row) => ({ parent: row.lesson_id, order: row.item_order })),
  ),
  ...duplicateOrderKeys(
   seed.grammarPoints.map((row) => ({ parent: row.lesson_id, order: row.point_order })),
  ),
  ...duplicateOrderKeys(
   seed.vocabExamples.map((row) => ({
    parent: row.vocab_item_id,
    order: row.example_order,
   })),
  ),
  ...duplicateOrderKeys(
   seed.grammarExamples.map((row) => ({
    parent: row.grammar_point_id,
    order: row.example_order,
   })),
  ),
 ];
 if (duplicateOrders.length > 0) {
  errors.push(`Duplicate parent/order keys: ${duplicateOrders.slice(0, 10).join(", ")}`);
 }

 const expected = EXPECTED_SEED_COUNTS[scope];
 const actual = {
  lessons: seed.lessons.length,
  lessonSections: seed.lessonSections.length,
  vocabItems: seed.vocabItems.length,
  grammarPoints: seed.grammarPoints.length,
  vocabExamples: seed.vocabExamples.length,
  grammarExamples: seed.grammarExamples.length,
  radicals: seed.radicals.length,
 };
 for (const key of Object.keys(expected) as Array<keyof typeof expected>) {
  if (actual[key] !== expected[key]) {
   errors.push(`Expected ${key}=${expected[key]}, got ${actual[key]}`);
  }
 }

 return {
  errors,
  duplicateIds,
  missingParents,
  counts: Object.fromEntries(
   COLLECTION_NAMES.map((collection) => [collection, seed[collection].length]),
  ) as Record<SeedCollectionName, number>,
 };
}

export function createHanziHomeAdminClient(): SupabaseClient {
 loadEnv({ path: path.join(process.cwd(), ".env.local"), quiet: true });
 loadEnv({ quiet: true });
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const adminKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

 if (!url || !adminKey) {
  throw new Error(
   "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) are required for Supabase seed writes.",
  );
 }

 if (adminKey.startsWith("sb_publishable_")) {
  throw new Error(
   "HanziHome seed requires a Supabase secret/service-role key. SUPABASE_SERVICE_ROLE_KEY currently contains a publishable key, which is correctly blocked by RLS.",
  );
 }

 return createClient(url, adminKey, {
  auth: { persistSession: false, autoRefreshToken: false },
 });
}

export function createHanziHomeReadClient(): SupabaseClient {
 loadEnv({ path: path.join(process.cwd(), ".env.local"), quiet: true });
 loadEnv({ quiet: true });
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

 if (!url || !publicKey) {
  throw new Error(
   "NEXT_PUBLIC_SUPABASE_URL and a Supabase publishable/anon key are required for seed verification.",
  );
 }

 return createClient(url, publicKey, {
  auth: { persistSession: false, autoRefreshToken: false },
 });
}

export const SEED_TABLES = {
 courses: "hanzihome_courses",
 books: "hanzihome_course_books",
 lessons: "hanzihome_lessons",
 lessonSections: "hanzihome_lesson_sections",
 lessonTexts: "hanzihome_lesson_texts",
 vocabItems: "hanzihome_vocab_items",
 vocabExamples: "hanzihome_vocab_examples",
 vocabDetailSections: "hanzihome_vocab_detail_sections",
 grammarPoints: "hanzihome_grammar_points",
 grammarExamples: "hanzihome_grammar_examples",
 grammarDetailSections: "hanzihome_grammar_detail_sections",
 radicals: "hanzihome_radicals",
} as const;

export async function fetchAllRows<T extends { id: string }>(
 client: SupabaseClient,
 table: string,
 columns = "*",
): Promise<T[]> {
 const pageSize = 1000;
 const rows: T[] = [];
 let lastId: string | null = null;

 for (;;) {
  let query = client.from(table).select(columns).order("id", { ascending: true }).limit(pageSize);

  if (lastId) {
   query = query.gt("id", lastId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed reading ${table}: ${error.message}`);
  const page = (data ?? []) as unknown as T[];
  rows.push(...page);
  if (page.length < pageSize) break;
  lastId = page.at(-1)?.id ?? null;
  if (!lastId) break;
 }
 return rows;
}

export async function insertRowsInBatches(
 client: SupabaseClient,
 table: string,
 rows: ReadonlyArray<object>,
) {
 const batchSize = 200;
 for (let index = 0; index < rows.length; index += batchSize) {
  const batch = rows.slice(index, index + batchSize);
  const { error } = await client.from(table).insert(batch);
  if (error) {
   throw new Error(
    `Failed inserting ${table} rows ${index + 1}-${index + batch.length}: ${error.message}`,
   );
  }
 }
}
