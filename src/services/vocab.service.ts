/**
 * Vocabulary Service — Supabase data access layer.
 *
 * Pure data operations. No UI, no React, no Next.js.
 * All functions accept a Supabase client as first argument
 * to support both client-side and server-side usage.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { extractChinese } from "@/lib/chinese-utils";
import type {
 DbDictionaryCore,
 DbVocabulary,
 AiAnalysis,
 AiDefinition,
 AiRadical,
 DictionaryCoreData,
 DictionaryCoreDefinition,
 VocabData,
 VocabWithProgress,
} from "@/types/database";

function isMissingColumnError(error: unknown): boolean {
 const code =
  typeof error === "object" && error !== null && "code" in error
   ? String((error as { code?: unknown }).code || "")
   : "";
 const message =
  typeof error === "object" && error !== null && "message" in error
   ? String((error as { message?: unknown }).message || "").toLowerCase()
   : "";

 return (
  code === "42703" ||
  code === "PGRST204" ||
  message.includes("does not exist") ||
  message.includes("schema cache")
 );
}

function isMissingDictionaryCacheSchemaError(error: unknown): boolean {
 const code =
  typeof error === "object" && error !== null && "code" in error
   ? String((error as { code?: unknown }).code || "")
   : "";
 const message =
  typeof error === "object" && error !== null && "message" in error
   ? String((error as { message?: unknown }).message || "").toLowerCase()
   : "";

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

function normalizeAnalysis(
 analysis?: AiAnalysis | null,
 sinoVietnamese?: string | null,
): AiAnalysis {
 const source = analysis || {};
 const normalizedDefinitions = source.definitions?.map((definition) => ({
  ...definition,
  text: definition.text || definition.meaning,
  meaning: definition.meaning || definition.text,
  examples: definition.examples?.map((example) => ({
   ...example,
   py: example.py || example.pinyin,
   pinyin: example.pinyin || example.py,
  })),
 }));

 const normalizedGrammar = source.grammar_breakdown?.map((point) => ({
  ...point,
  pattern: point.pattern || point.structure,
  structure: point.structure || point.pattern,
 }));

 const resolvedSinoVietnamese =
  sinoVietnamese || source.sino_vietnamese || source.han_viet || undefined;

 return {
  ...source,
  ...(resolvedSinoVietnamese
   ? {
      sino_vietnamese: resolvedSinoVietnamese,
      han_viet: source.han_viet || resolvedSinoVietnamese,
     }
   : {}),
  ...(normalizedDefinitions ? { definitions: normalizedDefinitions } : {}),
  ...(normalizedGrammar ? { grammar_breakdown: normalizedGrammar } : {}),
  ...(source.common_mistakes || source.confusion || source.confusion_warning
   ? {
      common_mistakes:
       source.common_mistakes || source.confusion || source.confusion_warning,
      confusion:
       source.confusion || source.confusion_warning || source.common_mistakes,
      confusion_warning:
       source.confusion_warning || source.confusion || source.common_mistakes,
     }
   : {}),
 };
}

function getDictionaryDefinitionsFromAnalysis(
 analysis?: AiAnalysis | null,
 fallbackMeaning = "",
): DictionaryCoreDefinition[] {
 return getNormalizedDefinitions(analysis, fallbackMeaning)
  .map((definition) => {
   const firstExample = definition.examples?.find(
    (example) => example.cn || example.vi,
   );

   return {
    part_of_speech: definition.pos || "",
    meaning: definition.meaning || definition.text || fallbackMeaning,
    example: firstExample?.cn
     ? `${firstExample.cn}${firstExample.vi ? ` (${firstExample.vi})` : ""}`
     : firstExample?.vi || "",
    examples: definition.examples,
   };
  })
  .filter((definition) => definition.meaning);
}

function buildDictionaryCoreData(
 analysis?: AiAnalysis | null,
 fallbackMeaning = "",
): DictionaryCoreData {
 const normalized = normalizeAnalysis(analysis);
 const definitions = getDictionaryDefinitionsFromAnalysis(
  normalized,
  fallbackMeaning,
 );

 return {
  definitions,
  ai_analysis: Object.keys(normalized).length ? normalized : undefined,
 };
}

export function getDictionaryCoreAnalysis(
 entry?: Pick<DbDictionaryCore, "data" | "sino_vietnamese"> | null,
): AiAnalysis {
 const data = (entry?.data || {}) as DictionaryCoreData;
 const embeddedAnalysis = normalizeAnalysis(
  (data.ai_analysis || {}) as AiAnalysis,
  entry?.sino_vietnamese || null,
 );

 if (Object.keys(embeddedAnalysis).length) {
  return embeddedAnalysis;
 }

 const definitions = (data.definitions || []).map((definition) => ({
  pos: definition.part_of_speech || "",
  meaning: definition.meaning || "",
  text: definition.meaning || "",
  examples: definition.examples,
 }));

 return normalizeAnalysis(
  {
   definitions,
   sino_vietnamese: entry?.sino_vietnamese || undefined,
   han_viet: entry?.sino_vietnamese || undefined,
  },
  entry?.sino_vietnamese || null,
 );
}

export async function getDictionaryEntryByHeadword(
 supabase: SupabaseClient,
 headword: string,
): Promise<DbDictionaryCore | null> {
 const lookupKey = normalizeDictionaryHeadword(headword);
 if (!lookupKey) {
  return null;
 }

 const { data, error } = await supabase
  .from("dictionary_core")
  .select(
   "id, headword, lookup_key, pinyin, sino_vietnamese, data, lookup_count, created_at",
  )
  .eq("lookup_key", lookupKey)
  .maybeSingle();

 if (error) {
  if (!isMissingDictionaryCacheSchemaError(error)) {
   console.error("[VocabService] dictionary_core lookup error:", error);
  }
  return null;
 }

 return (data as DbDictionaryCore | null) || null;
}

export async function incrementDictionaryLookupCount(
 supabase: SupabaseClient,
 entry: Pick<DbDictionaryCore, "id" | "lookup_count">,
): Promise<void> {
 const { error } = await supabase
  .from("dictionary_core")
  .update({ lookup_count: (entry.lookup_count || 0) + 1 })
  .eq("id", entry.id);

 if (error && !isMissingDictionaryCacheSchemaError(error)) {
  console.error("[VocabService] dictionary_core count update error:", error);
 }
}

export async function upsertDictionaryEntry(
 supabase: SupabaseClient,
 input: {
  headword: string;
  pinyin?: string;
  sinoVietnamese?: string;
  meaning?: string;
  ai_analysis?: AiAnalysis;
 },
): Promise<DbDictionaryCore | null> {
 const normalizedHeadword = normalizeDictionaryHeadword(input.headword);
 if (!normalizedHeadword) {
  return null;
 }

 const existing = await getDictionaryEntryByHeadword(
  supabase,
  normalizedHeadword,
 );
 const existingAnalysis = getDictionaryCoreAnalysis(existing);
 const incomingAnalysis = normalizeAnalysis(input.ai_analysis);
 const resolvedAnalysis = Object.keys(incomingAnalysis).length
  ? normalizeAnalysis({
     ...existingAnalysis,
     ...incomingAnalysis,
    })
  : existingAnalysis;
 const resolvedMeaning =
  input.meaning ||
  getPrimaryMeaning(resolvedAnalysis, getPrimaryMeaning(existingAnalysis, ""));
 const resolvedPinyin =
  input.pinyin || existing?.pinyin || resolvedAnalysis.pinyin || "";
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
  .select(
   "id, headword, lookup_key, pinyin, sino_vietnamese, data, lookup_count, created_at",
  )
  .single();

 if (error) {
  if (!isMissingDictionaryCacheSchemaError(error)) {
   console.error("[VocabService] dictionary_core upsert error:", error);
  }
  return null;
 }

 return data as DbDictionaryCore;
}

export function mapDictionaryEntryToVocabData(
 entry: DbDictionaryCore,
): VocabData {
 const analysis = getDictionaryCoreAnalysis(entry);

 return {
  dictionary_id: entry.id,
  hanzi: entry.headword,
  pinyin: entry.pinyin || analysis.pinyin || "",
  sino_vietnamese:
   entry.sino_vietnamese || analysis.sino_vietnamese || analysis.han_viet,
  meaning: getPrimaryMeaning(analysis, ""),
  ai_analysis: analysis,
 };
}

export async function saveUserDictionaryRelationship(
 supabase: SupabaseClient,
 userId: string,
 dictionaryId: string,
): Promise<boolean> {
 const { error } = await supabase.from("user_vocabularies").upsert(
  {
   user_id: userId,
   dictionary_id: dictionaryId,
  },
  { onConflict: "user_id,dictionary_id" },
 );

 if (error) {
  if (!isMissingDictionaryCacheSchemaError(error)) {
   console.error("[VocabService] user_vocabularies upsert error:", error);
  }
  return false;
 }

 return true;
}

export function getVocabularyAnalysis(
 vocab?: Pick<
  DbVocabulary,
  "analysis" | "ai_analysis" | "sino_vietnamese"
 > | null,
): AiAnalysis {
 return normalizeAnalysis(
  (vocab?.analysis || vocab?.ai_analysis || {}) as AiAnalysis,
  vocab?.sino_vietnamese || null,
 );
}

export function getPrimaryMeaning(
 analysis?: AiAnalysis | null,
 fallbackMeaning = "",
): string {
 const normalized = normalizeAnalysis(analysis);

 return (
  normalized.definitions?.find((item) => item.meaning || item.text)?.meaning ||
  normalized.definitions?.find((item) => item.text)?.text ||
  normalized.meanings?.find((item) => item.definition)?.definition ||
  fallbackMeaning
 );
}

export function getBasicVocabularyAnalysis(
 analysis?: AiAnalysis | null,
 fallbackMeaning = "",
): AiAnalysis {
 const normalized = normalizeAnalysis(analysis);
 const primaryDefinition = normalized.definitions?.find(
  (item) => item.meaning || item.text,
 );
 const meaningSummary =
  normalized.meaning_summary || getPrimaryMeaning(normalized, fallbackMeaning);

 return normalizeAnalysis({
  pinyin: normalized.pinyin,
  sino_vietnamese: normalized.sino_vietnamese,
  han_viet: normalized.han_viet,
  meaning_summary: meaningSummary,
  ...(primaryDefinition
   ? {
      definitions: [
       {
        pos: primaryDefinition.pos,
        meaning:
         primaryDefinition.meaning ||
         primaryDefinition.text ||
         meaningSummary ||
         fallbackMeaning,
        text:
         primaryDefinition.text ||
         primaryDefinition.meaning ||
         meaningSummary ||
         fallbackMeaning,
       },
      ],
     }
   : {}),
 });
}

export function getBasicVocabData(vocab: VocabData): VocabData {
 const basicAnalysis = getBasicVocabularyAnalysis(
  vocab.ai_analysis,
  vocab.meaning || "",
 );

 return {
  ...vocab,
  pinyin: vocab.pinyin || basicAnalysis.pinyin || "",
  sino_vietnamese:
   vocab.sino_vietnamese ||
   basicAnalysis.sino_vietnamese ||
   basicAnalysis.han_viet,
  meaning: getPrimaryMeaning(basicAnalysis, vocab.meaning || ""),
  ai_analysis: basicAnalysis,
 };
}

export function hasInspectorDeepDiveData(
 analysis?: AiAnalysis | null,
): boolean {
 const normalized = normalizeAnalysis(analysis);

 return !!(
  normalized.components?.length ||
  normalized.etymology ||
  normalized.mnemonic_story ||
  normalized.usage_logic?.length ||
  normalized.examples?.length ||
  normalized.collocations?.length ||
  normalized.related_words?.length ||
  normalized.vn_trap ||
  normalized.common_mistakes ||
  normalized.confusion ||
  normalized.confusion_warning
 );
}

export function isGenericEnglishFallbackAnalysis(
 analysis?: AiAnalysis | null,
): boolean {
 const normalized = normalizeAnalysis(analysis);
 if (!Object.keys(normalized).length) return false;

 const hasEnglishMarker =
  normalized.definitions?.some(
   (item) => item.pos?.trim().toUpperCase() === "EN",
  ) ||
  normalized.meanings?.some(
   (item) => item.part_of_speech?.trim().toUpperCase() === "EN",
  );

 if (!hasEnglishMarker) {
  return false;
 }

 const hasVietnameseSpecificData = !!(
  normalized.sino_vietnamese ||
  normalized.han_viet ||
  normalized.radicals?.length ||
  normalized.word_type ||
  normalized.common_mistakes ||
  normalized.confusion ||
  normalized.confusion_warning ||
  normalized.examples?.some((example) => example.vi) ||
  normalized.definitions?.some((definition) =>
   definition.examples?.some((example) => example.vi),
  )
 );

 return !hasVietnameseSpecificData;
}

export function hasDetailedVocabAnalysis(
 analysis?: AiAnalysis | null,
): boolean {
 const normalized = normalizeAnalysis(analysis);
 if (!Object.keys(normalized).length) return false;

 if (isGenericEnglishFallbackAnalysis(normalized)) {
  return false;
 }

 return !!(
  normalized.pinyin ||
  normalized.word_type ||
  normalized.sino_vietnamese ||
  normalized.radicals?.length ||
  normalized.definitions?.length ||
  normalized.meanings?.length ||
  normalized.etymology ||
  normalized.examples?.length ||
  normalized.related_words?.length ||
  normalized.usage_logic?.length ||
  normalized.common_mistakes ||
  normalized.sentence_translation ||
  normalized.grammar_breakdown?.length
 );
}

export function getNormalizedRadicals(
 analysis?: AiAnalysis | null,
): AiRadical[] {
 const normalized = normalizeAnalysis(analysis);
 if (!Object.keys(normalized).length) return [];

 if (normalized.radicals?.length) {
  return normalized.radicals.filter(
   (item) => item.char || item.meaning || item.pinyin,
  );
 }

 if (normalized.radical) {
  return [{ char: normalized.radical, meaning: normalized.radical }];
 }

 return [];
}

export function getNormalizedDefinitions(
 analysis?: AiAnalysis | null,
 fallbackMeaning = "",
): AiDefinition[] {
 const normalized = normalizeAnalysis(analysis);

 if (normalized.definitions?.length) {
  return normalized.definitions
   .map((item) => ({
    ...item,
    text: item.text || item.meaning,
    meaning: item.meaning || item.text,
   }))
   .filter((item) => item.text || item.meaning || item.pos);
 }

 if (normalized.meanings?.length) {
  return normalized.meanings
   .map((item) => ({
    pos: item.part_of_speech,
    text: item.definition,
    meaning: item.definition,
    examples: item.example
     ? [
        {
         cn: item.example.cn,
         pinyin: item.example.pinyin,
         py: item.example.pinyin,
         vi: item.example.vi,
        },
       ]
     : undefined,
   }))
   .filter((item) => item.text || item.pos);
 }

 if (fallbackMeaning) {
  return [{ text: fallbackMeaning, meaning: fallbackMeaning }];
 }

 return [];
}

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
    sino_vietnamese: v.sino_vietnamese || undefined,
    meaning: getPrimaryMeaning(getVocabularyAnalysis(v), v.meaning || ""),
    ai_analysis: getVocabularyAnalysis(v),
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
 const [vocab, dictionaryEntry] = await Promise.all([
  getVocabByHanzi(supabase, hanzi),
  getDictionaryEntryByHeadword(supabase, hanzi),
 ]);

 if (!vocab && !dictionaryEntry) {
  return {
   vocab: { hanzi, pinyin: "", meaning: "", ai_analysis: {} },
   srsLevel: null,
   isSaved: false,
  };
 }

 const legacyAnalysis = getVocabularyAnalysis(vocab);
 const dictionaryAnalysis = getDictionaryCoreAnalysis(dictionaryEntry);
 const resolvedAnalysis = normalizeAnalysis({
  ...legacyAnalysis,
  ...dictionaryAnalysis,
 });
 const resolvedMeaning = getPrimaryMeaning(
  resolvedAnalysis,
  vocab?.meaning || "",
 );

 const vocabData: VocabData = {
  id: vocab?.id,
  dictionary_id: dictionaryEntry?.id,
  hanzi: dictionaryEntry?.headword || vocab?.hanzi || hanzi,
  pinyin:
   dictionaryEntry?.pinyin || vocab?.pinyin || resolvedAnalysis.pinyin || "",
  sino_vietnamese:
   dictionaryEntry?.sino_vietnamese ||
   vocab?.sino_vietnamese ||
   resolvedAnalysis.sino_vietnamese ||
   resolvedAnalysis.han_viet ||
   undefined,
  meaning: resolvedMeaning,
  ai_analysis: resolvedAnalysis,
 };

 let progress: {
  proficiency_level: number;
  is_favorited: boolean;
  dictionary_id?: string | null;
 } | null = null;
 let progressError: unknown = null;

 if (vocab?.id) {
  const progressResult = await supabase
   .from("user_vocab_progress")
   .select("proficiency_level, is_favorited, dictionary_id")
   .eq("user_id", userId)
   .eq("vocab_id", vocab.id)
   .single();

  progress = progressResult.data;
  progressError = progressResult.error;
 }

 if (progressError && isMissingColumnError(progressError) && vocab?.id) {
  const legacyProgressResult = await supabase
   .from("user_vocab_progress")
   .select("proficiency_level, is_favorited")
   .eq("user_id", userId)
   .eq("vocab_id", vocab.id)
   .single();

  progress = legacyProgressResult.data
   ? {
      ...legacyProgressResult.data,
      dictionary_id: null,
     }
   : null;
  progressError = legacyProgressResult.error;
 }

 void progressError;

 if (!progress && dictionaryEntry?.id) {
  const dictionaryProgressResult = await supabase
   .from("user_vocab_progress")
   .select("proficiency_level, is_favorited, dictionary_id")
   .eq("user_id", userId)
   .eq("dictionary_id", dictionaryEntry.id)
   .maybeSingle();

  progress = dictionaryProgressResult.data;
 }

 if (progress?.dictionary_id) {
  vocabData.dictionary_id = progress.dictionary_id;
 }

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
  sinoVietnamese?: string;
  meaning?: string;
  ai_analysis?: AiAnalysis;
 },
): Promise<{ id: string } | null> {
 const normalizedAnalysis = normalizeAnalysis(
  data.ai_analysis,
  data.sinoVietnamese,
 );
 const resolvedMeaning = getPrimaryMeaning(
  normalizedAnalysis,
  data.meaning || "",
 );
 const resolvedSinoVietnamese =
  data.sinoVietnamese ||
  normalizedAnalysis.sino_vietnamese ||
  normalizedAnalysis.han_viet ||
  "";

 let { data: vocab, error } = await supabase
  .from("vocabularies")
  .upsert(
   {
    hanzi: data.hanzi,
    pinyin: data.pinyin || "",
    sino_vietnamese: resolvedSinoVietnamese || null,
    meaning: resolvedMeaning,
    analysis: normalizedAnalysis,
    ai_analysis: normalizedAnalysis,
   },
   { onConflict: "hanzi" },
  )
  .select("id")
  .single();

 if (error && isMissingColumnError(error)) {
  console.warn(
   "[VocabService] Falling back to legacy vocab schema; migration may be missing.",
  );

  const legacyResult = await supabase
   .from("vocabularies")
   .upsert(
    {
     hanzi: data.hanzi,
     pinyin: data.pinyin || "",
     meaning: resolvedMeaning,
     ai_analysis: normalizedAnalysis,
    },
    { onConflict: "hanzi" },
   )
   .select("id")
   .single();

  vocab = legacyResult.data;
  error = legacyResult.error;
 }

 if (error) {
  console.error("[VocabService] upsert error:", error);
  return null;
 }

 return vocab;
}

export async function syncDictionaryEntryToLegacyVocab(
 supabase: SupabaseClient,
 entry: DbDictionaryCore,
): Promise<{ id: string } | null> {
 const vocabData = mapDictionaryEntryToVocabData(entry);

 return upsertVocab(supabase, {
  hanzi: vocabData.hanzi,
  pinyin: vocabData.pinyin,
  sinoVietnamese: vocabData.sino_vietnamese,
  meaning: vocabData.meaning,
  ai_analysis: vocabData.ai_analysis,
 });
}

/** Save/bookmark a vocabulary for a user (adds to SRS) */
export async function saveVocabToSrs(
 supabase: SupabaseClient,
 userId: string,
 vocabData: VocabData,
 options?: {
  contextSentence?: string;
  contextTranslation?: string;
  personalNote?: string;
  personalNoteMode?: "normal" | "important";
 },
): Promise<{ vocabId: string; dictionaryId?: string } | null> {
 const dictionaryEntry = await upsertDictionaryEntry(supabase, {
  headword: vocabData.hanzi,
  pinyin: vocabData.pinyin,
  sinoVietnamese: vocabData.sino_vietnamese,
  meaning: vocabData.meaning || "",
  ai_analysis: vocabData.ai_analysis,
 });

 if (dictionaryEntry) {
  vocabData.dictionary_id = dictionaryEntry.id;
 }

 const vocab = dictionaryEntry
  ? await syncDictionaryEntryToLegacyVocab(supabase, dictionaryEntry)
  : await upsertVocab(supabase, {
     hanzi: vocabData.hanzi,
     pinyin: vocabData.pinyin,
     sinoVietnamese: vocabData.sino_vietnamese,
     meaning: vocabData.meaning || "",
     ai_analysis: vocabData.ai_analysis,
    });

 if (!vocab) return null;

 if (dictionaryEntry) {
  await saveUserDictionaryRelationship(supabase, userId, dictionaryEntry.id);
 }

 // Upsert user progress
 let { error } = await supabase.from("user_vocab_progress").upsert(
  {
   user_id: userId,
   vocab_id: vocab.id,
   dictionary_id: dictionaryEntry?.id || vocabData.dictionary_id || null,
   is_favorited: true,
   context_sentence: options?.contextSentence ?? null,
   context_translation: options?.contextTranslation ?? null,
   personal_note: options?.personalNote?.trim() || null,
   personal_note_mode: options?.personalNoteMode ?? null,
  },
  { onConflict: "user_id,vocab_id" },
 );

 if (error && isMissingColumnError(error)) {
  console.warn(
   "[VocabService] Falling back to legacy user_vocab_progress schema; migration may be missing.",
  );

  const legacyResult = await supabase.from("user_vocab_progress").upsert(
   {
    user_id: userId,
    vocab_id: vocab.id,
    is_favorited: true,
   },
   { onConflict: "user_id,vocab_id" },
  );

  error = legacyResult.error;
 }

 if (error) {
  console.error("[VocabService] save to SRS error:", error);
  return null;
 }

 return {
  vocabId: vocab.id,
  dictionaryId: dictionaryEntry?.id || vocabData.dictionary_id,
 };
}

/** Track a looked-up vocabulary in the user's personal list without forcing favorite/SRS state. */
export async function trackVocabLookup(
 supabase: SupabaseClient,
 userId: string,
 vocabData: VocabData,
): Promise<{ vocabId: string; dictionaryId?: string } | null> {
 const dictionaryEntry = await upsertDictionaryEntry(supabase, {
  headword: vocabData.hanzi,
  pinyin: vocabData.pinyin,
  sinoVietnamese: vocabData.sino_vietnamese,
  meaning: vocabData.meaning || "",
  ai_analysis: vocabData.ai_analysis,
 });

 if (dictionaryEntry) {
  vocabData.dictionary_id = dictionaryEntry.id;
 }

 const vocab = dictionaryEntry
  ? await syncDictionaryEntryToLegacyVocab(supabase, dictionaryEntry)
  : await upsertVocab(supabase, {
     hanzi: vocabData.hanzi,
     pinyin: vocabData.pinyin,
     sinoVietnamese: vocabData.sino_vietnamese,
     meaning: vocabData.meaning || "",
     ai_analysis: vocabData.ai_analysis,
    });

 if (!vocab) return null;

 if (dictionaryEntry) {
  await saveUserDictionaryRelationship(supabase, userId, dictionaryEntry.id);
 }

 let { error } = await supabase.from("user_vocab_progress").upsert(
  {
   user_id: userId,
   vocab_id: vocab.id,
   dictionary_id: dictionaryEntry?.id || vocabData.dictionary_id || null,
   is_favorited: false,
  },
  { onConflict: "user_id,vocab_id", ignoreDuplicates: true },
 );

 if (error && isMissingColumnError(error)) {
  console.warn(
   "[VocabService] Falling back to legacy lookup tracking schema; migration may be missing.",
  );

  const legacyResult = await supabase.from("user_vocab_progress").upsert(
   {
    user_id: userId,
    vocab_id: vocab.id,
    is_favorited: false,
   },
   { onConflict: "user_id,vocab_id", ignoreDuplicates: true },
  );

  error = legacyResult.error;
 }

 if (error) {
  console.error("[VocabService] track lookup error:", error);
  return null;
 }

 return {
  vocabId: vocab.id,
  dictionaryId: dictionaryEntry?.id || vocabData.dictionary_id,
 };
}

/** Delete a vocabulary from user's SRS tracking */
export async function removeVocabFromSrs(
 supabase: SupabaseClient,
 userId: string,
 vocabId: string,
): Promise<boolean> {
 let deletedProgress: {
  dictionary_id?: string | null;
 } | null = null;

 const { data, error: initialError } = await supabase
  .from("user_vocab_progress")
  .delete()
  .eq("user_id", userId)
  .eq("vocab_id", vocabId)
  .select("dictionary_id")
  .maybeSingle();

 deletedProgress = (data as { dictionary_id?: string | null } | null) || null;
 let error = initialError;

 if (error && isMissingColumnError(error)) {
  const legacyDeleteResult = await supabase
   .from("user_vocab_progress")
   .delete()
   .eq("user_id", userId)
   .eq("vocab_id", vocabId);

  error = legacyDeleteResult.error;
  deletedProgress = null;
 }

 if (error) {
  console.error("[VocabService] remove from SRS error:", error);
  return false;
 }

 if (deletedProgress?.dictionary_id) {
  const relationResult = await supabase
   .from("user_vocabularies")
   .delete()
   .eq("user_id", userId)
   .eq("dictionary_id", deletedProgress.dictionary_id);

  if (
   relationResult.error &&
   !isMissingDictionaryCacheSchemaError(relationResult.error)
  ) {
   console.error(
    "[VocabService] remove user_vocabularies relation error:",
    relationResult.error,
   );
  }
 }

 return true;
}
