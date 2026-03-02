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
 meaning: string | null;
 ai_analysis: AiAnalysis;
 created_at: string;
};

export type DbNote = {
 id: string;
 user_id: string;
 title: string;
 content: Record<string, unknown>;
 tags: string[];
 linked_lesson_id: string | null;
 is_published: boolean;
 category: NoteCategory;
 status: NoteStatus;
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

/* ══════════════════════════════════════════
   AI Analysis (JSONB shape)
   ══════════════════════════════════════════ */

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
 explanation?: string;
};

export type AiAnalysis = {
 hanzi?: string;
 pinyin?: string;
 han_viet?: string;
 stroke_count?: number;
 radical?: string;
 word_type?: string;
 etymology?: string | AiEtymology;
 meanings?: AiMeaning[];
 examples?: { zh: string; pinyin: string; vi: string }[];
 usage_logic?: string[];
 collocations?: string[];
 related_words?: string[];
 vn_trap?: string | null;
 common_mistakes?: string | null;
};

/* ══════════════════════════════════════════
   Zod Validators (for untrusted data)
   ══════════════════════════════════════════ */

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
 explanation: z.string().optional(),
});

export const aiAnalysisSchema = z.object({
 hanzi: z.string(),
 pinyin: z.string().optional(),
 han_viet: z.string().optional(),
 stroke_count: z.number().optional().nullable(),
 radical: z.string().optional().nullable(),
 word_type: z.string().optional(),
 etymology: z.union([z.string(), aiEtymologySchema]).optional(),
 meanings: z.array(aiMeaningSchema).optional(),
 examples: z
  .array(
   z.object({
    zh: z.string(),
    pinyin: z.string(),
    vi: z.string(),
   }),
  )
  .optional(),
 usage_logic: z.array(z.string()).optional(),
 collocations: z.array(z.string()).optional(),
 related_words: z.array(z.string()).optional(),
 vn_trap: z.string().optional().nullable(),
 common_mistakes: z.string().optional().nullable(),
});

export type AiVocabResponse = z.infer<typeof aiAnalysisSchema>;

/* ══════════════════════════════════════════
   Composite / View Types (used by features)
   ══════════════════════════════════════════ */

/** Vocabulary enriched with user progress */
export type VocabWithProgress = {
 id: string;
 hanzi: string;
 pinyin: string;
 meaning: string;
 ai_analysis: AiAnalysis;
 proficiency_level: number;
 is_favorited: boolean;
 status: "new" | "learning" | "mastered";
};

/** Vocab data used by inspector & dictionary */
export type VocabData = {
 id?: string;
 hanzi: string;
 pinyin: string;
 meaning: string;
 ai_analysis?: AiAnalysis;
};
