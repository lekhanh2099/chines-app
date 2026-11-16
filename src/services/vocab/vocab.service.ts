/**
 * Vocabulary Service — Supabase data access layer.
 *
 * Pure data operations. No UI, no React, no Next.js.
 * All functions accept a Supabase client as first argument
 * to support both client-side and server-side usage.
 */

import { JsonObjectSchema } from "@/types/json";
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
} from "@/services/vocab/vocab-analysis-selectors";
import { aiAnalysisSchema, DbDictionaryCoreSchema, DbVocabularySchema } from "@/types/database";
import type { AiAnalysis } from "@/types/database";
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

const supabaseErrorLikeSchema = z.object({
 code: z.string().optional().default(""),
 message: z.string().optional().default(""),
});

type SupabaseErrorInput = Parameters<typeof supabaseErrorLikeSchema.safeParse>[0];

function parseSupabaseError(error: SupabaseErrorInput) {
 const parsed = supabaseErrorLikeSchema.safeParse(error);
 return parsed.success ? parsed.data : { code: "", message: "" };
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
