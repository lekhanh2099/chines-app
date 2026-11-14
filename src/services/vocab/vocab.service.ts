/**
 * Vocabulary Service — Supabase data access layer.
 *
 * Pure data operations. No UI, no React, no Next.js.
 * All functions accept a Supabase client as first argument
 * to support both client-side and server-side usage.
 */

import { JsonObjectSchema } from "@/types/json";
import type { Tables } from "@/types/supabase.generated";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { extractChinese } from "@/lib/text/chinese-utils";
import {
 mergeAnalysisPreferIncoming,
 mergeAnalysisPreserveExisting,
 normalizeAnalysis,
} from "@/services/vocab/vocab-analysis-normalizers";
import {
 buildDictionaryCoreData,
 getDictionaryCoreAnalysis,
 getPrimaryMeaning,
 getVocabularyAnalysis,
} from "@/services/vocab/vocab-analysis-selectors";
import {
 aiAnalysisSchema,
 DbDictionaryCoreSchema,
 DbVocabularySchema,
 PersonalNoteModeSchema,
 VocabDataSchema,
} from "@/types/database";
import type { AiAnalysis, VocabData } from "@/types/database";
import type { Database } from "@/types/supabase.generated";

export {
 getBasicVocabData,
 getBasicVocabularyAnalysis,
 getDictionaryCoreAnalysis,
 getNormalizedAntonyms,
 getNormalizedDefinitions,
 getNormalizedRadicals,
 getNormalizedRelatedCompounds,
 getNormalizedSynonyms,
 getPrimaryMeaning,
 getVocabularyAnalysis,
 hasDetailedVocabAnalysis,
 hasInspectorDeepDiveData,
 isGenericEnglishFallbackAnalysis,
 mapDictionaryEntryToVocabData,
} from "@/services/vocab/vocab-analysis-selectors";

type AppSupabaseClient = SupabaseClient<Database>;

const DictionaryMergeModeSchema = z.enum(["preserve-existing", "prefer-incoming"]);

type UserVocabProgressRow = Tables<"user_vocab_progress">;
type UserVocabProgressRecord = {
 proficiency_level: NonNullable<UserVocabProgressRow["proficiency_level"]>;
 is_favorited: NonNullable<UserVocabProgressRow["is_favorited"]>;
 dictionary_id: UserVocabProgressRow["dictionary_id"];
 personal_note: UserVocabProgressRow["personal_note"];
 personal_note_mode: z.infer<z.ZodNullable<typeof PersonalNoteModeSchema>>;
};

type VocabWithProgressResult = z.infer<
 z.ZodObject<{
  vocab: typeof VocabDataSchema;
  srsLevel: z.ZodNullable<z.ZodNumber>;
  isSaved: z.ZodBoolean;
  personalNote: z.ZodString;
  personalNoteMode: typeof PersonalNoteModeSchema;
 }>
>;

const supabaseErrorLikeSchema = z.object({
 code: z.string().optional().default(""),
 message: z.string().optional().default(""),
});

type SupabaseErrorInput = Parameters<typeof supabaseErrorLikeSchema.safeParse>[0];

function parseSupabaseError(error: SupabaseErrorInput) {
 const parsed = supabaseErrorLikeSchema.safeParse(error);
 return parsed.success ? parsed.data : { code: "", message: "" };
}

function isMissingColumnError(error: SupabaseErrorInput): boolean {
 const { code, message: rawMessage } = parseSupabaseError(error);
 const message = rawMessage.toLowerCase();

 return (
  code === "42703" ||
  code === "PGRST204" ||
  message.includes("does not exist") ||
  message.includes("schema cache")
 );
}

function isMissingDictionaryCacheSchemaError(error: SupabaseErrorInput): boolean {
 const { code, message: rawMessage } = parseSupabaseError(error);
 const message = rawMessage.toLowerCase();

 return (
  code === "42P01" ||
  code === "42703" ||
  code === "PGRST204" ||
  code === "PGRST205" ||
  message.includes("dictionary_core") ||
  message.includes("user_vocabularies")
 );
}

export function normalizeDictionaryHeadword(text: string): string {
 const trimmed = text.trim();
 const chineseOnly = extractChinese(trimmed);
 return (chineseOnly || trimmed).trim();
}

export async function getDictionaryEntryByHeadword(
 supabase: AppSupabaseClient,
 headword: string,
): Promise<z.infer<z.ZodNullable<typeof DbDictionaryCoreSchema>>> {
 const lookupKey = normalizeDictionaryHeadword(headword);
 if (!lookupKey) {
  return null;
 }

 const { data, error } = await supabase
  .from("dictionary_core")
  .select("id, headword, lookup_key, pinyin, sino_vietnamese, data, lookup_count, created_at")
  .eq("lookup_key", lookupKey)
  .maybeSingle();

 if (error) {
  if (!isMissingDictionaryCacheSchemaError(error)) {
   logger.error("[VocabService] dictionary_core lookup error:", error);
  }
  return null;
 }

 if (!data) {
  return null;
 }

 const parsed = DbDictionaryCoreSchema.safeParse(data);
 if (!parsed.success) {
  logger.error("[VocabService] invalid dictionary_core row:", parsed.error);
  return null;
 }

 return parsed.data;
}

export async function upsertDictionaryEntry(
 supabase: AppSupabaseClient,
 input: {
  headword: string;
  pinyin?: string;
  sinoVietnamese?: string;
  meaning?: string;
  ai_analysis?: AiAnalysis;
  mergeMode?: z.infer<typeof DictionaryMergeModeSchema>;
 },
): Promise<z.infer<z.ZodNullable<typeof DbDictionaryCoreSchema>>> {
 const normalizedHeadword = normalizeDictionaryHeadword(input.headword);
 if (!normalizedHeadword) {
  return null;
 }

 const existing = await getDictionaryEntryByHeadword(supabase, normalizedHeadword);
 const existingAnalysis = getDictionaryCoreAnalysis(existing);
 const incomingAnalysis = normalizeAnalysis(input.ai_analysis);
 const mergeMode = input.mergeMode || DictionaryMergeModeSchema.enum["preserve-existing"];
 const resolvedAnalysis = Object.keys(incomingAnalysis).length
  ? normalizeAnalysis(
     mergeMode === "prefer-incoming"
      ? aiAnalysisSchema.parse(
         mergeAnalysisPreferIncoming(
          JsonObjectSchema.parse(existingAnalysis),
          JsonObjectSchema.parse(incomingAnalysis),
         ),
        )
      : aiAnalysisSchema.parse(
         mergeAnalysisPreserveExisting(
          JsonObjectSchema.parse(existingAnalysis),
          JsonObjectSchema.parse(incomingAnalysis),
         ),
        ),
    )
  : existingAnalysis;
 const resolvedMeaning =
  input.meaning || getPrimaryMeaning(resolvedAnalysis, getPrimaryMeaning(existingAnalysis, ""));
 const resolvedPinyin = input.pinyin || existing?.pinyin || resolvedAnalysis.pinyin || "";
 const resolvedSinoVietnamese =
  input.sinoVietnamese ||
  existing?.sino_vietnamese ||
  resolvedAnalysis.sino_vietnamese ||
  resolvedAnalysis.han_viet ||
  null;

 const { data, error } = await supabase
  .from("dictionary_core")
  .upsert(
   {
    headword: input.headword.trim() || normalizedHeadword,
    lookup_key: normalizedHeadword,
    pinyin: resolvedPinyin || null,
    sino_vietnamese: resolvedSinoVietnamese,
    data: buildDictionaryCoreData(resolvedAnalysis, resolvedMeaning),
   },
   { onConflict: "lookup_key" },
  )
  .select("id, headword, lookup_key, pinyin, sino_vietnamese, data, lookup_count, created_at")
  .single();

 if (error) {
  if (!isMissingDictionaryCacheSchemaError(error)) {
   logger.error("[VocabService] dictionary_core upsert error:", error);
  }
  return null;
 }

 const parsed = DbDictionaryCoreSchema.safeParse(data);
 if (!parsed.success) {
  logger.error("[VocabService] invalid dictionary_core upsert row:", parsed.error);
  return null;
 }

 return parsed.data;
}

/* ══════════════════════════════════════════
   Read Operations
   ══════════════════════════════════════════ */

/** Fetch a single vocabulary by hanzi text */
export async function getVocabByHanzi(
 supabase: AppSupabaseClient,
 hanzi: string,
): Promise<z.infer<z.ZodNullable<typeof DbVocabularySchema>>> {
 const { data, error } = await supabase
  .from("vocabularies")
  .select("*")
  .eq("hanzi", hanzi)
  .single();

 if (error || !data) return null;
 const parsed = DbVocabularySchema.safeParse(data);
 if (!parsed.success) {
  logger.error("[VocabService] invalid vocabularies row:", parsed.error);
  return null;
 }

 return parsed.data;
}

export async function getUserVocabProgressRecord(
 supabase: AppSupabaseClient,
 userId: string,
 lookup: {
  vocabId?: string;
  dictionaryId?: string;
 },
): Promise<z.infer<z.ZodNullable<z.ZodType<UserVocabProgressRecord>>>> {
 let fullQuery = supabase
  .from("user_vocab_progress")
  .select("proficiency_level, is_favorited, dictionary_id, personal_note, personal_note_mode")
  .eq("user_id", userId);

 if (lookup.vocabId) {
  fullQuery = fullQuery.eq("vocab_id", lookup.vocabId);
 }

 if (lookup.dictionaryId) {
  fullQuery = fullQuery.eq("dictionary_id", lookup.dictionaryId);
 }

 const fullResult = await fullQuery.maybeSingle();

 if (!fullResult.error) {
  return fullResult.data
   ? {
      proficiency_level: fullResult.data.proficiency_level ?? 0,
      is_favorited: fullResult.data.is_favorited ?? false,
      dictionary_id: fullResult.data.dictionary_id,
      personal_note: fullResult.data.personal_note,
      personal_note_mode:
       fullResult.data.personal_note_mode === "important"
        ? "important"
        : fullResult.data.personal_note_mode === "normal"
          ? "normal"
          : null,
     }
   : null;
 }

 if (!isMissingColumnError(fullResult.error)) {
  return null;
 }

 let legacyDictionaryQuery = supabase
  .from("user_vocab_progress")
  .select("proficiency_level, is_favorited, dictionary_id")
  .eq("user_id", userId);

 if (lookup.vocabId) {
  legacyDictionaryQuery = legacyDictionaryQuery.eq("vocab_id", lookup.vocabId);
 }

 if (lookup.dictionaryId) {
  legacyDictionaryQuery = legacyDictionaryQuery.eq("dictionary_id", lookup.dictionaryId);
 }

 const legacyDictionaryResult = await legacyDictionaryQuery.maybeSingle();

 if (!legacyDictionaryResult.error) {
  return legacyDictionaryResult.data
   ? {
      proficiency_level: legacyDictionaryResult.data.proficiency_level ?? 0,
      is_favorited: legacyDictionaryResult.data.is_favorited ?? false,
      dictionary_id: legacyDictionaryResult.data.dictionary_id,
      personal_note: null,
      personal_note_mode: null,
     }
   : null;
 }

 if (!isMissingColumnError(legacyDictionaryResult.error)) {
  return null;
 }

 let legacyQuery = supabase
  .from("user_vocab_progress")
  .select("proficiency_level, is_favorited")
  .eq("user_id", userId);

 if (lookup.vocabId) {
  legacyQuery = legacyQuery.eq("vocab_id", lookup.vocabId);
 }

 const legacyResult = await legacyQuery.maybeSingle();

 if (!legacyResult.error) {
  return legacyResult.data
   ? {
      proficiency_level: legacyResult.data.proficiency_level ?? 0,
      is_favorited: legacyResult.data.is_favorited ?? false,
      dictionary_id: null,
      personal_note: null,
      personal_note_mode: null,
     }
   : null;
 }

 return null;
}

/** Fetch vocab + user SRS progress for a specific word */
export async function getVocabWithProgress(
 supabase: AppSupabaseClient,
 hanzi: string,
 userId: string,
): Promise<VocabWithProgressResult> {
 const [vocab, dictionaryEntry] = await Promise.all([
  getVocabByHanzi(supabase, hanzi),
  getDictionaryEntryByHeadword(supabase, hanzi),
 ]);

 if (!vocab && !dictionaryEntry) {
  return {
   vocab: { hanzi, pinyin: "", meaning: "", ai_analysis: {} },
   srsLevel: null,
   isSaved: false,
   personalNote: "",
   personalNoteMode: "important",
  };
 }

 const legacyAnalysis = getVocabularyAnalysis(vocab);
 const dictionaryAnalysis = getDictionaryCoreAnalysis(dictionaryEntry);
 const resolvedAnalysis = normalizeAnalysis({
  ...legacyAnalysis,
  ...dictionaryAnalysis,
 });
 const resolvedMeaning = getPrimaryMeaning(resolvedAnalysis, vocab?.meaning || "");

 const vocabData: VocabData = {
  id: vocab?.id,
  dictionary_id: dictionaryEntry?.id,
  hanzi: dictionaryEntry?.headword || vocab?.hanzi || hanzi,
  pinyin: dictionaryEntry?.pinyin || vocab?.pinyin || resolvedAnalysis.pinyin || "",
  sino_vietnamese:
   dictionaryEntry?.sino_vietnamese ||
   vocab?.sino_vietnamese ||
   resolvedAnalysis.sino_vietnamese ||
   resolvedAnalysis.han_viet ||
   undefined,
  meaning: resolvedMeaning,
  ai_analysis: resolvedAnalysis,
 };

 let progress: z.infer<z.ZodNullable<z.ZodType<UserVocabProgressRecord>>> = null;

 if (vocab?.id) {
  progress = await getUserVocabProgressRecord(supabase, userId, {
   vocabId: vocab.id,
  });
 }

 if (!progress && dictionaryEntry?.id) {
  progress = await getUserVocabProgressRecord(supabase, userId, {
   dictionaryId: dictionaryEntry.id,
  });
 }

 if (progress?.dictionary_id) {
  vocabData.dictionary_id = progress.dictionary_id;
 }

 return {
  vocab: vocabData,
  srsLevel: progress?.proficiency_level ?? null,
  isSaved: !!progress,
  personalNote: progress?.personal_note || "",
  personalNoteMode: progress?.personal_note_mode || "important",
 };
}
