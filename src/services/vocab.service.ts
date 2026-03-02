/**
 * Vocabulary Service — Supabase data access layer.
 *
 * Pure data operations. No UI, no React, no Next.js.
 * All functions accept a Supabase client as first argument
 * to support both client-side and server-side usage.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
 DbVocabulary,
 AiAnalysis,
 VocabData,
 VocabWithProgress,
} from "@/types/database";

/* ══════════════════════════════════════════
   Read Operations
   ══════════════════════════════════════════ */

/** Fetch a single vocabulary by hanzi text */
export async function getVocabByHanzi(
 supabase: SupabaseClient,
 hanzi: string,
): Promise<DbVocabulary | null> {
 const { data, error } = await supabase
  .from("vocabularies")
  .select("*")
  .eq("hanzi", hanzi)
  .single();

 if (error || !data) return null;
 return data as DbVocabulary;
}

/** Fetch user's vocabulary list with progress */
export async function getUserVocabList(
 supabase: SupabaseClient,
 userId: string,
): Promise<VocabWithProgress[]> {
 const { data: progress } = await supabase
  .from("user_vocab_progress")
  .select(
   `
   vocab_id,
   proficiency_level,
   is_favorited,
   vocabularies (
    id,
    hanzi,
    pinyin,
    meaning,
    ai_analysis,
    created_at
   )
  `,
  )
  .eq("user_id", userId);

 if (!progress) return [];

 return progress
  .filter((p) => p.vocabularies)
  .map((p) => {
   const v = p.vocabularies as unknown as DbVocabulary;
   let status: VocabWithProgress["status"] = "new";
   if (p.proficiency_level >= 4) status = "mastered";
   else if (p.proficiency_level >= 2) status = "learning";

   return {
    id: v.id,
    hanzi: v.hanzi,
    pinyin: v.pinyin || "",
    meaning: v.meaning || "",
    ai_analysis: (v.ai_analysis || {}) as AiAnalysis,
    proficiency_level: p.proficiency_level,
    is_favorited: p.is_favorited,
    status,
   };
  });
}

/** Fetch vocab + user SRS progress for a specific word */
export async function getVocabWithProgress(
 supabase: SupabaseClient,
 hanzi: string,
 userId: string,
): Promise<{
 vocab: VocabData;
 srsLevel: number | null;
 isSaved: boolean;
}> {
 const vocab = await getVocabByHanzi(supabase, hanzi);

 if (!vocab) {
  return {
   vocab: { hanzi, pinyin: "", meaning: "", ai_analysis: {} },
   srsLevel: null,
   isSaved: false,
  };
 }

 const vocabData: VocabData = {
  id: vocab.id,
  hanzi: vocab.hanzi,
  pinyin: vocab.pinyin || "",
  meaning: vocab.meaning || "",
  ai_analysis: (vocab.ai_analysis || {}) as AiAnalysis,
 };

 const { data: progress } = await supabase
  .from("user_vocab_progress")
  .select("proficiency_level, is_favorited")
  .eq("user_id", userId)
  .eq("vocab_id", vocab.id)
  .single();

 return {
  vocab: vocabData,
  srsLevel: progress?.proficiency_level ?? null,
  isSaved: !!progress,
 };
}

/* ══════════════════════════════════════════
   Write Operations
   ══════════════════════════════════════════ */

/** Upsert vocabulary record (e.g., from inspector save or AI result) */
export async function upsertVocab(
 supabase: SupabaseClient,
 data: {
  hanzi: string;
  pinyin?: string;
  meaning?: string;
  ai_analysis?: AiAnalysis;
 },
): Promise<{ id: string } | null> {
 const { data: vocab, error } = await supabase
  .from("vocabularies")
  .upsert(
   {
    hanzi: data.hanzi,
    pinyin: data.pinyin || "",
    meaning: data.meaning || "",
    ...(data.ai_analysis ? { ai_analysis: data.ai_analysis } : {}),
   },
   { onConflict: "hanzi" },
  )
  .select("id")
  .single();

 if (error) {
  console.error("[VocabService] upsert error:", error);
  return null;
 }

 return vocab;
}

/** Save/bookmark a vocabulary for a user (adds to SRS) */
export async function saveVocabToSrs(
 supabase: SupabaseClient,
 userId: string,
 vocabData: VocabData,
): Promise<{ vocabId: string } | null> {
 // Upsert the vocabulary first
 const vocab = await upsertVocab(supabase, {
  hanzi: vocabData.hanzi,
  pinyin: vocabData.pinyin,
  meaning: vocabData.meaning || "",
 });

 if (!vocab) return null;

 // Upsert user progress
 const { error } = await supabase.from("user_vocab_progress").upsert(
  {
   user_id: userId,
   vocab_id: vocab.id,
   is_favorited: true,
  },
  { onConflict: "user_id,vocab_id" },
 );

 if (error) {
  console.error("[VocabService] save to SRS error:", error);
  return null;
 }

 return { vocabId: vocab.id };
}

/** Delete a vocabulary from user's SRS tracking */
export async function removeVocabFromSrs(
 supabase: SupabaseClient,
 userId: string,
 vocabId: string,
): Promise<boolean> {
 const { error } = await supabase
  .from("user_vocab_progress")
  .delete()
  .eq("user_id", userId)
  .eq("vocab_id", vocabId);

 if (error) {
  console.error("[VocabService] remove from SRS error:", error);
  return false;
 }

 return true;
}
