/**
 * Legacy domain and normalized service types.
 *
 * Use `supabase.generated.ts` for raw database rows. Keep types here only when a service deliberately
 * narrows JSON fields, normalizes nullable columns, or models a non-table response.
 */

import { JsonObjectSchema, JsonValueSchema } from "@/types/json";
import { z } from "zod";
import type { Tables } from "@/types/supabase.generated";
import { ApiKeyProviderSchema } from "@/lib/api-key-providers";

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

export const NoteCategorySchema = z.enum(["grammar", "vocabulary", "culture", "general"]);
export const NoteStatusSchema = z.enum(["draft", "reviewed", "mastered"]);
export const ReadingStatusSchema = z.enum(["inbox", "reading", "completed"]);
export const PersonalNoteModeSchema = z.enum(["normal", "important"]);

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

/* ══════════════════════════════════════════
   Enums & Constrained Types
   ══════════════════════════════════════════ */

export type NoteCategory = z.infer<typeof NoteCategorySchema>;
export type ReadingStatus = z.infer<typeof ReadingStatusSchema>;
export type PersonalNoteMode = z.infer<typeof PersonalNoteModeSchema>;

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
export type AiWordRelation = z.infer<typeof aiWordRelationSchema>;
export type AiRelatedCompound = z.infer<typeof aiRelatedCompoundSchema>;
export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
export type DictionaryCoreData = z.infer<typeof DictionaryCoreDataSchema>;
export type DbDictionaryCore = z.infer<typeof DbDictionaryCoreSchema>;
export type SentenceInsightResponse = z.infer<typeof sentenceInsightSchema>;

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
