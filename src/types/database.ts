/**
 * Database types derived from Supabase schema.
 * Source of truth: supabase/migrations/*.sql
 *
 * TODO: Replace with auto-generated types via `supabase gen types typescript`
 * when CI/CD pipeline is set up.
 */

import { z } from "zod";

/* ══════════════════════════════════════════
   Raw DB Row Types (match SQL exactly)
   ══════════════════════════════════════════ */

export type DbUser = {
 id: string;
 display_name: string | null;
 avatar_url: string | null;
 role: "user" | "admin";
 subscription_tier: "free" | "pro" | "lifetime";
 ai_credits: number;
 created_at: string;
};

export type DbBook = {
 id: string;
 title: string;
 level: string | null;
 cover_url: string | null;
 is_published: boolean;
 created_at: string;
};

export type DbLesson = {
 id: string;
 book_id: string | null;
 title: string;
 lesson_order: number | null;
 description: string | null;
 raw_passage: string | null;
 audio_url: string | null;
 created_at: string;
};

export type DbVocabulary = {
 id: string;
 hanzi: string;
 pinyin: string | null;
 sino_vietnamese: string | null;
 meaning: string | null;
 analysis: AiAnalysis | null;
 ai_analysis: AiAnalysis | null;
 created_at: string;
};

export type DbUserAiPromptSettings = {
 user_id: string;
 word_lookup_prompt: string;
 sentence_lookup_prompt: string;
 gemini_model: string;
 deepseek_api_key_encrypted: string | null;
 deepseek_enabled: boolean;
 created_at: string;
 updated_at: string;
};

export type DbUserApiKey = {
 id: string;
 user_id: string;
 provider: "deepseek" | "gemini" | "openai";
 label: string;
 masked_key: string;
 encrypted_key: string;
 is_active: boolean;
 priority: number;
 default_model: string | null;
 last_validated_at: string | null;
 created_at: string;
 updated_at: string;
};

export type DbDictionaryCore = {
 id: string;
 headword: string;
 lookup_key: string;
 pinyin: string | null;
 sino_vietnamese: string | null;
 data: Record<string, unknown>;
 lookup_count: number;
 type: VocabType;
 created_at: string;
};

export type DbUserVocabulary = {
 user_id: string;
 dictionary_id: string;
 created_at: string;
};

export type DbNote = {
 id: string;
 user_id: string;
 title: string;
 content: Record<string, unknown>;
 reading_content: Record<string, unknown> | null;
 split_view_enabled: boolean;
 tags: string[];
 linked_lesson_id: string | null;
 is_published: boolean;
 category: NoteCategory;
 status: NoteStatus;
 short_id: string | null;
 created_at: string;
 updated_at: string;
};

export type DbExercise = {
 id: string;
 lesson_id: string;
 type: "multiple_choice" | "fill_blank" | "true_false";
 content: Record<string, unknown>;
 order_index: number | null;
};

export type DbUserLessonProgress = {
 user_id: string;
 lesson_id: string;
 status: "started" | "completed";
 last_accessed_at: string;
};

export type DbUserVocabProgress = {
 user_id: string;
 vocab_id: string;
 proficiency_level: number;
 next_review_at: string | null;
 is_favorited: boolean;
 context_sentence: string | null;
 context_translation: string | null;
 personal_note: string | null;
 personal_note_mode: PersonalNoteMode | null;
};

export type DbLessonVocabulary = {
 lesson_id: string;
 vocab_id: string;
 is_target_word: boolean;
};

/* ══════════════════════════════════════════
   Enums & Constrained Types
   ══════════════════════════════════════════ */

export type NoteCategory = "grammar" | "vocabulary" | "culture" | "general";
export type NoteStatus = "draft" | "reviewed" | "mastered";
export type VocabProficiency = 0 | 1 | 2 | 3 | 4 | 5;
export type PersonalNoteMode = "normal" | "important";
export type VocabType = "word" | "sentence";

/* ══════════════════════════════════════════
   AI Analysis (JSONB shape)
   ══════════════════════════════════════════ */

export type AiRadical = {
 char?: string;
 pinyin?: string;
 meaning?: string;
};

export type AiDefinitionExample = {
 cn?: string;
 py?: string;
 pinyin?: string;
 vi?: string;
};

export type AiDefinitionMeaning = {
 meaning?: string;
 examples?: AiDefinitionExample[];
};

export type AiDefinition = {
 pos?: string;
 text?: string;
 meaning?: string;
 color?: string;
 examples?: AiDefinitionExample[];
 meanings?: AiDefinitionMeaning[];
};

export type DictionaryCoreDefinition = {
 part_of_speech?: string;
 meaning?: string;
 example?: string;
 examples?: AiDefinitionExample[];
};

export type AiGrammarPoint = {
 pattern?: string;
 structure?: string;
 explanation?: string;
};

export type AiMeaning = {
 part_of_speech?: string;
 definition?: string;
 example?: {
  cn?: string;
  pinyin?: string;
  vi?: string;
 };
};

export type AiEtymology = {
 type?: string;
 origin?: string;
 mnemonic?: string;
 explanation?: string;
};

export type AiWordRelation = {
 word?: string;
 pinyin?: string;
 meaning?: string;
};

export type AiRelatedCompound = AiWordRelation;

export type AiComponent = {
 part?: string;
 name?: string;
 meaning?: string;
};

export type AiSourceMetadata = {
 course_key?: string;
 lesson_key?: string;
 lesson_number?: number | null;
 lesson_title?: string;
 row_number?: number | null;
 category?: string;
 source_file?: string;
};

export type AiExample = {
 zh: string;
 pinyin: string;
 vi: string;
 note?: string;
};

export type AiAnalysis = {
 hanzi?: string;
 pinyin?: string;
 han_viet?: string;
 sino_vietnamese?: string;
 meaning_summary?: string;
 meaning_detail?: string;
 han_viet_note?: string;
 source_metadata?: AiSourceMetadata;
 stroke_count?: number | null;
 radical?: string | null;
 radicals?: AiRadical[];
 components?: AiComponent[];
 word_type?: string;
 definitions?: AiDefinition[];
 decomposition?: string;
 comparisons?: string[];
 etymology?: string | AiEtymology;
 related_compounds?: AiRelatedCompound[];
 synonyms?: AiWordRelation[];
 antonyms?: AiWordRelation[];
 mnemonic_story?: string;
 meanings?: AiMeaning[];
 examples?: AiExample[];
 usage_logic?: string[];
 collocations?: string[];
 related_words?: string[];
 usage_note?: string;
 cultural_note?: string;
 hsk_level?: string;
 tocfl_level?: string;
 notes?: string;
 vn_trap?: string | null;
 common_mistakes?: string | null;
 confusion?: string | null;
 confusion_warning?: string | null;
 sentence_translation?: string;
 grammar_breakdown?: AiGrammarPoint[];
};

export type DictionaryCoreData = {
 definitions?: DictionaryCoreDefinition[];
 ai_analysis?: AiAnalysis;
};

export type SentenceInsight = {
 text: string;
 pinyin?: string;
 translation?: string;
 grammar_points?: AiGrammarPoint[];
};

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
 examples: z
  .array(
   z.object({
    zh: z.string(),
    pinyin: z.string(),
    vi: z.string(),
    note: z.string().optional(),
   }),
  )
  .optional(),
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

export const sentenceInsightSchema = z.object({
 text: z.string().optional(),
 pinyin: z.string().optional(),
 translation: z.string().optional(),
 grammar_points: z.array(aiGrammarPointSchema).optional(),
});

export type AiVocabResponse = z.infer<typeof aiAnalysisSchema>;
export type SentenceInsightResponse = z.infer<typeof sentenceInsightSchema>;

/* ══════════════════════════════════════════
   Composite / View Types (used by features)
   ══════════════════════════════════════════ */

/** Vocabulary enriched with user progress */
export type VocabWithProgress = {
 id: string;
 hanzi: string;
 pinyin: string;
 sino_vietnamese?: string;
 meaning: string;
 ai_analysis: AiAnalysis;
 source?: {
  courseKey?: string;
  lessonKey: string;
  lessonNumber: number | null;
  lessonTitle?: string;
  rowNumber?: number | null;
  category?: string;
  sourceFile?: string;
 };
 proficiency_level: number;
 is_favorited: boolean;
 status: "new" | "learning" | "mastered";
 type: VocabType;
};

/** Vocab data used by inspector & dictionary */
export type VocabData = {
 id?: string;
 dictionary_id?: string;
 hanzi: string;
 pinyin: string;
 sino_vietnamese?: string;
 meaning: string;
 ai_analysis?: AiAnalysis;
};

export type SmartSelectionMode = "word" | "sentence";

export type SmartSelectionResult = {
 mode: SmartSelectionMode;
 selection: string;
 context_sentence: string;
 entry: VocabData;
 radicals: AiRadical[];
 components: AiComponent[];
 definitions: AiDefinition[];
 meaning_summary: string;
 etymology: string;
 mnemonic_story: string;
 translation: string;
 grammar_points: AiGrammarPoint[];
 isSaved: boolean;
 found: boolean;
 personal_note: string;
 personal_note_mode: PersonalNoteMode;
};
