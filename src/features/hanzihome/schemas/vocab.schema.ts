import { z } from "zod";

// Common helpers

export const NonEmptyStringSchema = z.string().trim().min(1);

export const OptionalStringSchema = z
 .string()
 .optional()
 .default("")
 .transform((s) => s.trim());

export const StringArraySchema = z
 .preprocess((value) => {
  if (typeof value === "string") {
   return value
    .split(/[,\n،、]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  }

  return value;
 }, z.array(z.string()).optional().default([]))
 .transform((arr) => arr.map((x) => x.trim()).filter(Boolean));

export const IdSchema = z.string().trim().min(1);

const FlexibleStringSchema = z.preprocess((value) => {
 if (typeof value === "string") {
  return value;
 }

 if (value && typeof value === "object" && "radical" in value) {
  const radical = value.radical;
  return typeof radical === "string" ? radical : "";
 }

 return value;
}, OptionalStringSchema);

// Universal notes

export const NoteKindSchema = z.enum([
 "general",
 "usage",
 "warning",
 "memory_tip",
 "source",
 "ui",
 "parser",
 "teacher",
 "etymology",
 "radical",
 "culture",
]);

export const NoteSchema = z.object({
 id: IdSchema.optional(),
 kind: NoteKindSchema.default("general"),
 text_vi: NonEmptyStringSchema,
 text_zh: OptionalStringSchema,
 source_ref: OptionalStringSchema,
 tags: StringArraySchema,
 check_needed: z.boolean().default(false),
});

// POS / tags

export const PartOfSpeechSchema = z.enum([
 "noun",
 "verb",
 "adjective",
 "adverb",
 "particle",
 "preposition",
 "conjunction",
 "measure_word",
 "pronoun",
 "numeral",
 "interjection",

 "phrase",
 "noun_phrase",
 "verb_phrase",
 "verb_noun",
 "adjective_phrase",

 "idiom",
 "proper_noun",
 "grammar_word",
 "morpheme",

 "unknown",
]);

export const PosSchema = z.preprocess(
 (value) => {
  if (typeof value === "string") {
   return {
    raw_vi: value,
    raw_cn: "",
    normalized: value,
    notes: [],
   };
  }

  return value;
 },
 z.object({
  raw_vi: OptionalStringSchema,
  raw_cn: OptionalStringSchema,
  normalized: PartOfSpeechSchema.default("unknown"),
  notes: z.array(NoteSchema).default([]),
 }),
);

export const ImportanceLevelSchema = z.enum(["A+++", "A++", "A+", "A", "B+", "B", "C", "unknown"]);

// Meaning

export const MeaningSchema = z.object({
 hanviet: OptionalStringSchema,

 meaning_vi: NonEmptyStringSchema,
 meaning_en: OptionalStringSchema,

 natural_translations_vi: z.array(NonEmptyStringSchema).default([]),

 short_definition_vi: OptionalStringSchema,
 textbook_focus_vi: OptionalStringSchema,

 register_vi: OptionalStringSchema,
 usage_domain_vi: OptionalStringSchema,

 notes: z.array(NoteSchema).default([]),
});

// Radical-aware character / word formation

export const ComponentRoleSchema = z.enum([
 "radical",
 "semantic",
 "phonetic",
 "visible_component",
 "simplified_component",
 "traditional_component",
 "stroke_shape",
 "unknown",
]);

export const RadicalFormSchema = z.enum([
 "main",
 "variant",
 "simplified",
 "traditional",
 "position_form",
 "not_radical",
 "unknown",
]);

export const RadicalInfoSchema = z.object({
 radical: FlexibleStringSchema, // ví dụ: 糸
 radical_variant: OptionalStringSchema, // ví dụ: 纟
 radical_name_vi: OptionalStringSchema, // ví dụ: bộ Mịch
 radical_name_zh: OptionalStringSchema, // ví dụ: 绞丝旁 / 糸部 nếu có
 hanviet: OptionalStringSchema, // ví dụ: mịch
 meaning_vi: OptionalStringSchema, // ví dụ: sợi tơ
 kangxi_no: z.number().int().positive().optional(),
 stroke_count: z.number().int().nonnegative().optional(),
 form: RadicalFormSchema.default("unknown"),
 notes: z.array(NoteSchema).default([]),
 check_needed: z.boolean().default(false),
});

export const CharacterComponentSchema = z.object({
 text: NonEmptyStringSchema,

 hanviet: OptionalStringSchema,
 meaning_vi: OptionalStringSchema,

 position_vi: OptionalStringSchema,
 role: ComponentRoleSchema.default("visible_component"),

 /**
  * Quan trọng:
  * - is_radical = true nếu component này đang được xem như bộ thủ / biến thể bộ thủ.
  * - radical chứa thông tin chuẩn hóa về bộ.
  */
 is_radical: z.boolean().default(false),
 radical: z.preprocess(
  (value) => (value === null ? undefined : value),
  RadicalInfoSchema.optional(),
 ),

 notes: z.array(NoteSchema).default([]),

 check_needed: z.boolean().default(false),
});

export const CharacterAnalysisSchema = z.object({
 hanzi: NonEmptyStringSchema,

 lishu_vi: OptionalStringSchema,
 structure_note_vi: OptionalStringSchema,

 /**
  * Bộ thủ chính của chữ nếu xác định được.
  * Ví dụ:
  * - 终 → main_radical.radical_variant = "纟", radical = "糸"
  * - 瞒 → main_radical.radical = "目"
  */
 main_radical: z.preprocess(
  (value) => (value === null ? undefined : value),
  RadicalInfoSchema.optional(),
 ),

 components: z.array(CharacterComponentSchema).default([]),

 original_meaning_vi: OptionalStringSchema,
 modern_meaning_vi: OptionalStringSchema,
 modern_logic_vi: OptionalStringSchema,

 warning_vi: OptionalStringSchema,
 notes: z.array(NoteSchema).default([]),

 check_needed: z.boolean().default(false),
});

export const WordFormationSchema = z.object({
 characters: z.array(CharacterAnalysisSchema).default([]),

 word_logic_vi: OptionalStringSchema,
 memory_tip_vi: OptionalStringSchema,

 warning_vi: OptionalStringSchema,
 notes: z.array(NoteSchema).default([]),

 check_needed: z.boolean().default(false),
});

// Comparisons

export const RelatedWordSchema = z.preprocess(
 (value) => {
  if (Array.isArray(value)) {
   const [word, pinyin, meaningVi, differenceVi] = value;

   return {
    word,
    pinyin,
    meaning_vi: meaningVi,
    difference_vi: differenceVi,
   };
  }

  if (value && typeof value === "object" && "word" in value) {
   if (Array.isArray(value.word)) {
    return {
     ...value,
     word: value.word.map(String).join("、"),
    };
   }
  }

  return value;
 },
 z.object({
  word: NonEmptyStringSchema,
  pinyin: OptionalStringSchema,

  meaning_vi: OptionalStringSchema,
  difference_vi: OptionalStringSchema,

  register_vi: OptionalStringSchema,
  example_zh: OptionalStringSchema,
  example_vi: OptionalStringSchema,

  notes: z.array(NoteSchema).default([]),
  check_needed: z.boolean().default(false),
 }),
);

export const ContrastPairSchema = z.preprocess(
 (value) => {
  if (Array.isArray(value)) {
   const [left, right, meaningVi, noteVi] = value;

   return {
    left,
    right,
    meaning_vi: meaningVi,
    note_vi: noteVi,
   };
  }

  return value;
 },
 z.object({
  left: NonEmptyStringSchema,
  right: NonEmptyStringSchema,

  meaning_vi: OptionalStringSchema,
  note_vi: OptionalStringSchema,

  notes: z.array(NoteSchema).default([]),
 }),
);

export const ComparisonSchema = z.object({
 near_synonyms: z.array(RelatedWordSchema).default([]),
 antonyms: z.array(RelatedWordSchema).default([]),
 contrast_pairs: z.array(ContrastPairSchema).default([]),

 usage_rules: z.array(NonEmptyStringSchema).default([]),

 notes: z.array(NoteSchema).default([]),
});

// Collocations / 搭配

export const CollocationSchema = z.object({
 id: IdSchema,
 order: z.number().int().positive(),

 zh: NonEmptyStringSchema,
 pinyin: OptionalStringSchema,
 vi: OptionalStringSchema,

 pattern: OptionalStringSchema,
 note_vi: OptionalStringSchema,

 tags: StringArraySchema,
 notes: z.array(NoteSchema).default([]),
});

// Examples

export const ExampleLevelSchema = z.preprocess(
 (value) => {
  if (value === "application" || value === "lesson" || value === "lesson_context") {
   return "applied";
  }

  return value;
 },
 z.enum(["basic", "core", "standard", "intermediate", "applied", "expanded", "complex"]),
);

export const VocabularyExampleSchema = z.object({
 id: IdSchema,
 order: z.number().int().positive(),

 zh: NonEmptyStringSchema,
 pinyin: OptionalStringSchema,
 vi: OptionalStringSchema,

 analysis_vi: OptionalStringSchema,

 highlight: StringArraySchema,
 grammar_refs: StringArraySchema,
 vocab_refs: StringArraySchema,

 source_ref: OptionalStringSchema,
 level: ExampleLevelSchema.default("basic"),

 audio_key: OptionalStringSchema,

 notes: z.array(NoteSchema).default([]),
 check_needed: z.boolean().default(false),
});

// Culture / fact

export const CultureNoteSchema = z.object({
 title: OptionalStringSchema,
 content_vi: OptionalStringSchema,

 tags: StringArraySchema,
 source_refs: StringArraySchema,

 notes: z.array(NoteSchema).default([]),
 check_needed: z.boolean().default(false),
});

// Warnings / common mistakes

export const UsageExampleSchema = z.object({
 zh: NonEmptyStringSchema,
 pinyin: OptionalStringSchema,
 vi: OptionalStringSchema,
 note_vi: OptionalStringSchema,
 notes: z.array(NoteSchema).default([]),
});

export const UsageExampleInputSchema = z.union([
 UsageExampleSchema,
 NonEmptyStringSchema.transform((value) => ({
  zh: value,
  pinyin: "",
  vi: "",
  note_vi: "",
  notes: [],
 })),
]);

export const WarningSchema = z.object({
 id: IdSchema,
 order: z.number().int().positive().default(1),

 rule_vi: OptionalStringSchema,

 natural_examples: z.array(UsageExampleInputSchema).default([]),
 unnatural_examples: z.array(UsageExampleInputSchema).default([]),

 wrong_examples: z.array(UsageExampleInputSchema).default([]),
 correct_examples: z.array(UsageExampleInputSchema).default([]),

 explanation_vi: OptionalStringSchema,
 severity: z.enum(["info", "warning", "critical"]).default("warning"),

 notes: z.array(NoteSchema).default([]),
});

// Flashcards

export const FlashcardModeSchema = z.enum([
 "hanzi_to_meaning",
 "meaning_to_hanzi",
 "pinyin_to_hanzi",
 "audio_to_hanzi",
 "collocation",
 "example_sentence",
]);

export const FlashcardSchema = z.object({
 front: NonEmptyStringSchema,
 back: NonEmptyStringSchema,

 hint: OptionalStringSchema,

 modes: z
  .array(FlashcardModeSchema)
  .default(["hanzi_to_meaning", "meaning_to_hanzi", "pinyin_to_hanzi"]),

 tags: StringArraySchema,
 notes: z.array(NoteSchema).default([]),
});

// Deep vocabulary item

export const DeepVocabularyItemSchema = z.object({
 id: IdSchema,
 type: z.literal("deep_vocabulary_item").default("deep_vocabulary_item"),

 order: z.number().int().positive(),

 hanzi: NonEmptyStringSchema,
 pinyin: NonEmptyStringSchema,

 pos: PosSchema,
 level_tag: ImportanceLevelSchema.default("unknown"),
 tags: StringArraySchema,

 meaning: MeaningSchema,

 word_formation: WordFormationSchema.default({
  characters: [],
  word_logic_vi: "",
  memory_tip_vi: "",
  warning_vi: "",
  notes: [],
  check_needed: false,
 }),

 comparison: ComparisonSchema.default({
  near_synonyms: [],
  antonyms: [],
  contrast_pairs: [],
  usage_rules: [],
  notes: [],
 }),

 collocations: z.array(CollocationSchema).default([]),
 examples: z.array(VocabularyExampleSchema).default([]),

 culture_note: CultureNoteSchema.optional(),
 warnings: z.array(WarningSchema).default([]),

 flashcard: FlashcardSchema.optional(),

 audio_key: OptionalStringSchema,

 /**
  * raw_markdown chỉ để debug/re-parse.
  * UI không render field này.
  */
 raw_markdown: OptionalStringSchema,

 notes: z.array(NoteSchema).default([]),
 check_needed: z.boolean().default(false),
});
