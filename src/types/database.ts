/**
 * Legacy domain and normalized service types.
 *
 * Use `supabase.generated.ts` for raw database rows. Keep types here only when a service deliberately
 * narrows JSON fields, normalizes nullable columns, or models a non-table response.
 */

import { JsonObjectSchema, JsonValueSchema, type JsonObject } from "@/types/json";
import { z } from "zod";
import type { Tables } from "@/types/supabase.generated";
import { ApiKeyProviderSchema } from "@/lib/api-key-providers";

/* ══════════════════════════════════════════
   Legacy normalized service rows
   ══════════════════════════════════════════ */

export const DbUserSchema = z.object({
 id: z.string(),
 display_name: z.string().nullable(),
 avatar_url: z.string().nullable(),
 role: z.enum(["user", "admin"]),
 subscription_tier: z.enum(["free", "pro", "lifetime"]),
 ai_credits: z.number(),
 created_at: z.string(),
});
export type DbUser = z.infer<typeof DbUserSchema>;

export const DbBookSchema = z.object({
 id: z.string(),
 title: z.string(),
 level: z.string().nullable(),
 cover_url: z.string().nullable(),
 is_published: z.boolean(),
 created_at: z.string(),
});
export type DbBook = z.infer<typeof DbBookSchema>;

export const DbLessonSchema = z.object({
 id: z.string(),
 book_id: z.string().nullable(),
 title: z.string(),
 lesson_order: z.number().nullable(),
 description: z.string().nullable(),
 raw_passage: z.string().nullable(),
 audio_url: z.string().nullable(),
 created_at: z.string(),
});
export type DbLesson = z.infer<typeof DbLessonSchema>;

export type DbUserAiPromptSettings = Tables<"user_ai_prompt_settings">;

export const DbUserApiKeySchema = z.object({
 id: z.string(),
 user_id: z.string(),
 provider: ApiKeyProviderSchema,
 label: z.string(),
 masked_key: z.string(),
 encrypted_key: z.string(),
 is_active: z.boolean(),
 priority: z.number(),
 default_model: z.string().nullable(),
 last_validated_at: z.string().nullable(),
 created_at: z.string(),
 updated_at: z.string(),
});
export type DbUserApiKey = z.infer<typeof DbUserApiKeySchema>;

export type DbUserVocabulary = {
 user_id: string;
 dictionary_id: string;
 created_at: string;
};

export const NoteCategorySchema = z.enum(["grammar", "vocabulary", "culture", "general"]);
export const NoteStatusSchema = z.enum(["draft", "reviewed", "mastered"]);
export const ReadingStatusSchema = z.enum(["inbox", "reading", "completed"]);
export const PersonalNoteModeSchema = z.enum(["normal", "important"]);
export const VocabTypeSchema = z.enum(["word", "sentence"]);

export const DbNoteSchema = z.object({
 id: z.string(),
 user_id: z.string(),
 title: z.string(),
 content: JsonObjectSchema,
 reading_content: JsonObjectSchema.nullable(),
 split_view_enabled: z.boolean(),
 tags: z.array(z.string()),
 linked_lesson_id: z.string().nullable(),
 is_published: z.boolean(),
 category: NoteCategorySchema,
 status: NoteStatusSchema,
 short_id: z.string().nullable(),
 created_at: z.string(),
 updated_at: z.string(),
 folder_id: z.string().nullable(),
 reading_status: ReadingStatusSchema.nullable(),
 source_url: z.string().nullable(),
 source_host: z.string().nullable(),
 source_label: z.string().nullable(),
 source_author: z.string().nullable(),
 source_published_at: z.string().nullable(),
 source_captured_at: z.string().nullable(),
});

export type DbNote = z.infer<typeof DbNoteSchema>;

export const DbExerciseSchema = z.object({
 id: z.string(),
 lesson_id: z.string(),
 type: z.enum(["multiple_choice", "fill_blank", "true_false"]),
 content: JsonObjectSchema,
 order_index: z.number().nullable(),
});
export type DbExercise = z.infer<typeof DbExerciseSchema>;

export const DbUserLessonProgressSchema = z.object({
 user_id: z.string(),
 lesson_id: z.string(),
 status: z.enum(["started", "completed"]),
 last_accessed_at: z.string(),
});
export type DbUserLessonProgress = z.infer<typeof DbUserLessonProgressSchema>;

export const DbUserVocabProgressSchema = z.object({
 user_id: z.string(),
 vocab_id: z.string(),
 proficiency_level: z.number(),
 next_review_at: z.string().nullable(),
 is_favorited: z.boolean(),
 context_sentence: z.string().nullable(),
 context_translation: z.string().nullable(),
 personal_note: z.string().nullable(),
 personal_note_mode: PersonalNoteModeSchema.nullable(),
});
export type DbUserVocabProgress = z.infer<typeof DbUserVocabProgressSchema>;

export const DbLessonVocabularySchema = z.object({
 lesson_id: z.string(),
 vocab_id: z.string(),
 is_target_word: z.boolean(),
});
export type DbLessonVocabulary = z.infer<typeof DbLessonVocabularySchema>;

/* ══════════════════════════════════════════
   Enums & Constrained Types
   ══════════════════════════════════════════ */

export type NoteCategory = z.infer<typeof NoteCategorySchema>;
export type NoteStatus = z.infer<typeof NoteStatusSchema>;
export type ReadingStatus = z.infer<typeof ReadingStatusSchema>;
export const VocabProficiencySchema = z.union([
 z.literal(0),
 z.literal(1),
 z.literal(2),
 z.literal(3),
 z.literal(4),
 z.literal(5),
]);
export type VocabProficiency = z.infer<typeof VocabProficiencySchema>;
export type PersonalNoteMode = z.infer<typeof PersonalNoteModeSchema>;
export type VocabType = z.infer<typeof VocabTypeSchema>;

/* ══════════════════════════════════════════
   AI Analysis (JSONB shape)
   ══════════════════════════════════════════ */

/* ══════════════════════════════════════════
   Zod Validators (for untrusted data)
   ══════════════════════════════════════════ */

export const aiRadicalSchema = z.object({
 char: z.string().optional(),
 pinyin: z.string().optional(),
 meaning: z.string().optional(),
});

export const aiDefinitionExampleSchema = z.object({
 cn: z.string().optional(),
 py: z.string().optional(),
 pinyin: z.string().optional(),
 vi: z.string().optional(),
});

export const aiDefinitionMeaningSchema = z.object({
 meaning: z.string().optional(),
 examples: z.array(aiDefinitionExampleSchema).optional(),
});

export const aiDefinitionSchema = z.object({
 pos: z.string().optional(),
 text: z.string().optional(),
 meaning: z.string().optional(),
 color: z.string().optional(),
 examples: z.array(aiDefinitionExampleSchema).optional(),
 meanings: z.array(aiDefinitionMeaningSchema).optional(),
});

export const aiGrammarPointSchema = z.object({
 pattern: z.string().optional(),
 structure: z.string().optional(),
 explanation: z.string().optional(),
});

export const aiMeaningSchema = z.object({
 part_of_speech: z.string().optional(),
 definition: z.string().optional(),
 example: z
  .object({
   cn: z.string().optional(),
   pinyin: z.string().optional(),
   vi: z.string().optional(),
  })
  .optional(),
});

export const aiEtymologySchema = z.object({
 type: z.string().optional(),
 origin: z.string().optional(),
 mnemonic: z.string().optional(),
 explanation: z.string().optional(),
});

export const aiWordRelationSchema = z.object({
 word: z.string().optional(),
 pinyin: z.string().optional(),
 meaning: z.string().optional(),
});

export const aiRelatedCompoundSchema = aiWordRelationSchema;

export const aiComponentSchema = z.object({
 part: z.string().optional(),
 name: z.string().optional(),
 meaning: z.string().optional(),
});

export const aiSourceMetadataSchema = z.object({
 course_key: z.string().optional(),
 lesson_key: z.string().optional(),
 lesson_number: z.number().optional().nullable(),
 lesson_title: z.string().optional(),
 row_number: z.number().optional().nullable(),
 category: z.string().optional(),
 source_file: z.string().optional(),
});

export const aiExampleSchema = z.object({
 zh: z.string(),
 pinyin: z.string(),
 vi: z.string(),
 note: z.string().optional(),
});

export const aiAnalysisSchema = z.object({
 hanzi: z.string().optional(),
 pinyin: z.string().optional(),
 han_viet: z.string().optional(),
 sino_vietnamese: z.string().optional(),
 meaning_summary: z.string().optional(),
 meaning_detail: z.string().optional(),
 han_viet_note: z.string().optional(),
 source_metadata: aiSourceMetadataSchema.optional(),
 stroke_count: z.number().optional().nullable(),
 radical: z.string().optional().nullable(),
 radicals: z.array(aiRadicalSchema).optional(),
 components: z.array(aiComponentSchema).optional(),
 word_type: z.string().optional(),
 definitions: z.array(aiDefinitionSchema).optional(),
 decomposition: z.string().optional(),
 comparisons: z.array(z.string()).optional(),
 etymology: z.union([z.string(), aiEtymologySchema]).optional(),
 related_compounds: z.array(aiRelatedCompoundSchema).optional(),
 synonyms: z.array(aiWordRelationSchema).optional(),
 antonyms: z.array(aiWordRelationSchema).optional(),
 mnemonic_story: z.string().optional(),
 meanings: z.array(aiMeaningSchema).optional(),
 examples: z.array(aiExampleSchema).optional(),
 usage_logic: z.array(z.string()).optional(),
 collocations: z.array(z.string()).optional(),
 related_words: z.array(z.string()).optional(),
 usage_note: z.string().optional(),
 cultural_note: z.string().optional(),
 hsk_level: z.string().optional(),
 tocfl_level: z.string().optional(),
 notes: z.string().optional(),
 vn_trap: z.string().optional().nullable(),
 common_mistakes: z.string().optional().nullable(),
 confusion: z.string().optional().nullable(),
 confusion_warning: z.string().optional().nullable(),
 sentence_translation: z.string().optional(),
 grammar_breakdown: z.array(aiGrammarPointSchema).optional(),
});

export const dictionaryCoreDefinitionSchema = z.object({
 part_of_speech: z.string().optional(),
 meaning: z.string().optional(),
 example: z.string().optional(),
 examples: z.array(aiDefinitionExampleSchema).optional(),
});

export const DictionaryCoreDataSchema = z.object({
 definitions: z.array(dictionaryCoreDefinitionSchema).optional(),
 ai_analysis: aiAnalysisSchema.optional(),
});

export const DbDictionaryCoreSchema = z.object({
 id: z.string(),
 headword: z.string(),
 lookup_key: z.string(),
 pinyin: z.string().nullable(),
 sino_vietnamese: z.string().nullable(),
 data: DictionaryCoreDataSchema,
 lookup_count: z.number(),
 created_at: z.string(),
});

export const DbVocabularySchema = z.object({
 id: z.string(),
 hanzi: z.string(),
 pinyin: z.string().nullable(),
 sino_vietnamese: z.string().nullable(),
 meaning: z.string().nullable(),
 analysis: JsonValueSchema,
 ai_analysis: JsonValueSchema.nullable(),
 created_at: z.string().nullable(),
});

export const GenerateVocabResponseSchema = z.object({
 data: aiAnalysisSchema,
 cached: z.boolean(),
});

export const sentenceInsightSchema = z.object({
 text: z.string().optional(),
 pinyin: z.string().optional(),
 translation: z.string().optional(),
 grammar_points: z.array(aiGrammarPointSchema).optional(),
});

export type AiVocabResponse = z.infer<typeof aiAnalysisSchema>;
export type AiRadical = z.infer<typeof aiRadicalSchema>;
export type AiDefinitionExample = z.infer<typeof aiDefinitionExampleSchema>;
export type AiDefinitionMeaning = z.infer<typeof aiDefinitionMeaningSchema>;
export type AiDefinition = z.infer<typeof aiDefinitionSchema>;
export type DictionaryCoreDefinition = z.infer<typeof dictionaryCoreDefinitionSchema>;
export type AiGrammarPoint = z.infer<typeof aiGrammarPointSchema>;
export type AiMeaning = z.infer<typeof aiMeaningSchema>;
export type AiEtymology = z.infer<typeof aiEtymologySchema>;
export type AiWordRelation = z.infer<typeof aiWordRelationSchema>;
export type AiRelatedCompound = z.infer<typeof aiRelatedCompoundSchema>;
export type AiComponent = z.infer<typeof aiComponentSchema>;
export type AiSourceMetadata = z.infer<typeof aiSourceMetadataSchema>;
export type AiExample = z.infer<typeof aiExampleSchema>;
export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
export type DictionaryCoreData = z.infer<typeof DictionaryCoreDataSchema>;
export type DbDictionaryCore = z.infer<typeof DbDictionaryCoreSchema>;
export type DbVocabulary = z.infer<typeof DbVocabularySchema>;
export type SentenceInsightResponse = z.infer<typeof sentenceInsightSchema>;

/* ══════════════════════════════════════════
   Composite / View Types (used by features)
   ══════════════════════════════════════════ */

export const DbVocabCourseSchema = z.object({
 id: z.string(),
 owner_id: z.string(),
 course_key: z.string(),
 title: z.string(),
 source_file: z.string(),
 source_path: z.string().nullable(),
 generated_at: z.string().nullable(),
 imported_at: z.string(),
 created_at: z.string(),
});
export type DbVocabCourse = z.infer<typeof DbVocabCourseSchema>;

export const DbVocabLessonSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 lesson_key: z.string(),
 lesson_number: z.number().nullable(),
 title: z.string(),
 lesson_order: z.number(),
 item_count: z.number(),
 created_at: z.string(),
 updated_at: z.string(),
});
export type DbVocabLesson = z.infer<typeof DbVocabLessonSchema>;

export const DbVocabEntrySchema = z.object({
 id: z.string(),
 course_id: z.string(),
 lesson_id: z.string(),
 hanzi: z.string(),
 pinyin: z.string().nullable(),
 sino_vietnamese: z.string().nullable(),
 meaning: z.string().nullable(),
 word_type: z.string().nullable(),
 category: z.string().nullable(),
 row_number: z.number(),
 ai_analysis: aiAnalysisSchema.nullable(),
 created_at: z.string(),
 updated_at: z.string(),
});
export type DbVocabEntry = z.infer<typeof DbVocabEntrySchema>;

export const DbUserVocabEntryProgressSchema = z.object({
 user_id: z.string(),
 entry_id: z.string(),
 proficiency_level: z.number(),
 next_review_at: z.string().nullable(),
 is_favorited: z.boolean(),
 last_answered_at: z.string().nullable(),
 created_at: z.string(),
 updated_at: z.string(),
});
export type DbUserVocabEntryProgress = z.infer<typeof DbUserVocabEntryProgressSchema>;

/** Vocabulary enriched with user progress */
export const VocabLearningStatusSchema = z.enum(["new", "learning", "mastered"]);

export const VocabSourceSchema = z.object({
 courseKey: z.string().optional(),
 lessonKey: z.string(),
 lessonNumber: z.number().nullable(),
 lessonTitle: z.string().optional(),
 rowNumber: z.number().nullable().optional(),
 category: z.string().optional(),
 sourceFile: z.string().optional(),
});

export const VocabWithProgressSchema = z.object({
 id: z.string(),
 hanzi: z.string(),
 pinyin: z.string(),
 sino_vietnamese: z.string().optional(),
 meaning: z.string(),
 ai_analysis: aiAnalysisSchema,
 source: VocabSourceSchema.optional(),
 proficiency_level: z.number(),
 is_favorited: z.boolean(),
 status: VocabLearningStatusSchema,
 type: VocabTypeSchema,
});
export type VocabWithProgress = z.infer<typeof VocabWithProgressSchema>;

export const VocabEntryWithProgressSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 lesson_id: z.string(),
 hanzi: z.string(),
 pinyin: z.string(),
 sino_vietnamese: z.string().optional(),
 meaning: z.string(),
 word_type: z.string().optional(),
 category: z.string().optional(),
 row_number: z.number(),
 ai_analysis: aiAnalysisSchema,
 proficiency_level: z.number(),
 is_favorited: z.boolean(),
 last_answered_at: z.string().nullable(),
 status: VocabLearningStatusSchema,
 type: VocabTypeSchema,
 source: VocabSourceSchema.extend({
  courseKey: z.string(),
  lessonTitle: z.string(),
  rowNumber: z.number(),
 }),
});
export type VocabEntryWithProgress = z.infer<typeof VocabEntryWithProgressSchema>;

export const VocabLessonWithStatsSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 lesson_key: z.string(),
 lesson_number: z.number().nullable(),
 title: z.string(),
 lesson_order: z.number(),
 item_count: z.number(),
 entries: z.array(VocabEntryWithProgressSchema),
 studied: z.number(),
 mastered: z.number(),
 learning: z.number(),
 fresh: z.number(),
 progress: z.number(),
 categories: z.array(z.object({ name: z.string(), count: z.number() })),
});
export type VocabLessonWithStats = z.infer<typeof VocabLessonWithStatsSchema>;

export const VocabCourseWithLessonsSchema = z.object({
 id: z.string(),
 course_key: z.string(),
 title: z.string(),
 source_file: z.string(),
 source_path: z.string().nullable().optional(),
 generated_at: z.string().nullable().optional(),
 imported_at: z.string().optional(),
 lessons: z.array(VocabLessonWithStatsSchema),
 entries: z.array(VocabEntryWithProgressSchema),
});
export type VocabCourseWithLessons = z.infer<typeof VocabCourseWithLessonsSchema>;

export const GrammarExerciseTypeSchema = z.enum([
 "fill_blank",
 "multiple_choice",
 "reorder_sentence",
 "translate_zh",
 "identify_error",
]);
export type GrammarExerciseType = z.infer<typeof GrammarExerciseTypeSchema>;

export const GrammarPointContentSchema = z.object({
 quick_example: z
  .object({ zh: z.string().optional(), pinyin: z.string().optional(), vi: z.string().optional() })
  .optional(),
 core: z.string().optional(),
 explanation: z.string().optional(),
 formulas: z.array(z.string()).optional(),
 structures: z.array(z.string()).optional(),
 usage_notes: z.array(z.string()).optional(),
 traps: z.array(z.string()).optional(),
 common_mistakes: z.array(z.string()).optional(),
 comparisons: z.array(z.string()).optional(),
 quiz: z
  .object({
   q: z.string().optional(),
   choices: z.array(z.string()).optional(),
   a: z.number().optional(),
  })
  .optional(),
 coach_contrasts: z.array(z.object({ title: z.string(), body: z.string() })).optional(),
 examples: z.array(aiExampleSchema).optional(),
 source_metadata: z
  .object({
   course_key: z.string().optional(),
   lesson_key: z.string().optional(),
   lesson_number: z.number().nullable().optional(),
   lesson_title: z.string().optional(),
   row_number: z.number().nullable().optional(),
   source: z.string().optional(),
  })
  .optional(),
});
export type GrammarPointContent = z.infer<typeof GrammarPointContentSchema>;

export const GrammarExerciseContentSchema = z.object({
 choices: z
  .array(z.object({ id: z.string(), text: z.string(), note: z.string().optional() }))
  .optional(),
 tokens: z.array(z.string()).optional(),
 segments: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
 accepted_answers: z.array(z.string()).optional(),
 required_terms: z.array(z.string()).optional(),
 sample_answer: z.string().optional(),
 blank: z.string().optional(),
 exercise_set_id: z.string().optional(),
 generated_by: z.string().optional(),
 generated_at: z.string().optional(),
 source_point_title: z.string().optional(),
});
export type GrammarExerciseContent = z.infer<typeof GrammarExerciseContentSchema>;

export const DbGrammarCourseSchema = z.object({
 id: z.string(),
 owner_id: z.string(),
 course_key: z.string(),
 title: z.string(),
 source_type: z.string(),
 source_file: z.string().nullable().optional(),
 created_at: z.string().optional(),
 updated_at: z.string().optional(),
});
export type DbGrammarCourse = z.infer<typeof DbGrammarCourseSchema>;

export const DbGrammarLessonSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 lesson_key: z.string(),
 lesson_number: z.number().nullable(),
 title: z.string(),
 lesson_order: z.number(),
 description: z.string().nullable().optional(),
 created_at: z.string().optional(),
 updated_at: z.string().optional(),
});
export type DbGrammarLesson = z.infer<typeof DbGrammarLessonSchema>;

export const DbGrammarPointSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 lesson_id: z.string().nullable().optional(),
 title: z.string(),
 hanzi: z.string().nullable().optional(),
 pinyin: z.string().nullable().optional(),
 vietnamese_title: z.string().nullable().optional(),
 level: z.string().nullable().optional(),
 category: z.string().nullable().optional(),
 tags: z.array(z.string()).nullable().optional(),
 row_number: z.number(),
 content: GrammarPointContentSchema.nullable().optional(),
 created_at: z.string().optional(),
 updated_at: z.string().optional(),
});
export type DbGrammarPoint = z.infer<typeof DbGrammarPointSchema>;

export const DbGrammarExerciseSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 lesson_id: z.string().nullable().optional(),
 point_id: z.string().nullable().optional(),
 exercise_type: GrammarExerciseTypeSchema,
 prompt: z.string(),
 content: GrammarExerciseContentSchema.nullable().optional(),
 answer: JsonObjectSchema.nullable().optional(),
 explanation: z.string().nullable().optional(),
 exercise_order: z.number(),
 created_at: z.string().optional(),
 updated_at: z.string().optional(),
});
export type DbGrammarExercise = z.infer<typeof DbGrammarExerciseSchema>;

export const DbUserGrammarPointProgressSchema = z.object({
 user_id: z.string(),
 point_id: z.string(),
 proficiency_level: z.number(),
 last_studied_at: z.string().nullable().optional(),
 next_review_at: z.string().nullable().optional(),
 created_at: z.string().optional(),
 updated_at: z.string().optional(),
});
export type DbUserGrammarPointProgress = z.infer<typeof DbUserGrammarPointProgressSchema>;

export const GrammarPointWithProgressSchema = DbGrammarPointSchema.omit({
 content: true,
 tags: true,
}).extend({
 content: GrammarPointContentSchema,
 tags: z.array(z.string()),
 proficiency_level: z.number(),
 status: VocabLearningStatusSchema,
 exercises: z.array(DbGrammarExerciseSchema),
});
export type GrammarPointWithProgress = z.infer<typeof GrammarPointWithProgressSchema>;

export const GrammarLessonWithStatsSchema = DbGrammarLessonSchema.extend({
 points: z.array(GrammarPointWithProgressSchema),
 exercises: z.array(DbGrammarExerciseSchema),
 fresh: z.number(),
 learning: z.number(),
 mastered: z.number(),
 progress: z.number(),
 categories: z.array(z.object({ name: z.string(), count: z.number() })),
});
export type GrammarLessonWithStats = z.infer<typeof GrammarLessonWithStatsSchema>;

export const GrammarCourseWithLessonsSchema = DbGrammarCourseSchema.extend({
 lessons: z.array(GrammarLessonWithStatsSchema),
 points: z.array(GrammarPointWithProgressSchema),
 exercises: z.array(DbGrammarExerciseSchema),
});
export type GrammarCourseWithLessons = z.infer<typeof GrammarCourseWithLessonsSchema>;

/** Vocab data used by inspector & dictionary */
export const VocabDataSchema = z.object({
 id: z.string().optional(),
 dictionary_id: z.string().optional(),
 hanzi: z.string(),
 pinyin: z.string(),
 sino_vietnamese: z.string().optional(),
 meaning: z.string(),
 ai_analysis: aiAnalysisSchema.optional(),
});
export type VocabData = z.infer<typeof VocabDataSchema>;

export const SmartSelectionModeSchema = z.enum(["word", "sentence"]);
export type SmartSelectionMode = z.infer<typeof SmartSelectionModeSchema>;

export const SmartSelectionResultSchema = z.object({
 mode: SmartSelectionModeSchema,
 selection: z.string(),
 context_sentence: z.string(),
 entry: VocabDataSchema,
 radicals: z.array(aiRadicalSchema),
 components: z.array(aiComponentSchema),
 definitions: z.array(aiDefinitionSchema),
 meaning_summary: z.string(),
 etymology: z.string(),
 mnemonic_story: z.string(),
 translation: z.string(),
 grammar_points: z.array(aiGrammarPointSchema),
 isSaved: z.boolean(),
 found: z.boolean(),
 personal_note: z.string(),
 personal_note_mode: PersonalNoteModeSchema,
});
export type SmartSelectionResult = z.infer<typeof SmartSelectionResultSchema>;
