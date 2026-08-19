/**
 * Vocabulary Service — Supabase data access layer.
 *
 * Pure data operations. No UI, no React, no Next.js.
 * All functions accept a Supabase client as first argument
 * to support both client-side and server-side usage.
 */

import { JsonObjectSchema } from "@/types/json";
import type { JsonFieldValue, JsonObject } from "@/types/json";
import type { Tables, TablesInsert } from "@/types/supabase.generated";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { extractChinese } from "@/lib/chinese-utils";
import {
 aiAnalysisSchema,
 DbDictionaryCoreSchema,
 DbVocabularySchema,
 PersonalNoteModeSchema,
 VocabDataSchema,
 VocabTypeSchema,
} from "@/types/database";
import type {
 DbDictionaryCore,
 AiAnalysis,
 AiDefinition,
 AiDefinitionExample,
 AiDefinitionMeaning,
 AiRadical,
 AiRelatedCompound,
 AiWordRelation,
 DictionaryCoreData,
 DictionaryCoreDefinition,
 VocabData,
} from "@/types/database";
import type { Database } from "@/types/supabase.generated";

type AppSupabaseClient = SupabaseClient<Database>;

type DictionaryLookupCount = {
 id: DbDictionaryCore["id"];
 lookup_count: DbDictionaryCore["lookup_count"];
};
type VocabularyAnalysisSource = z.infer<
 z.ZodNullable<
  z.ZodObject<{
   analysis: typeof DbVocabularySchema.shape.analysis;
   ai_analysis: typeof DbVocabularySchema.shape.ai_analysis;
   sino_vietnamese: typeof DbVocabularySchema.shape.sino_vietnamese;
  }>
 >
>;
const DictionaryMergeModeSchema = z.enum(["preserve-existing", "prefer-incoming"]);

type UserVocabProgressRow = Tables<"user_vocab_progress">;
type UserVocabProgressRecord = {
 proficiency_level: NonNullable<UserVocabProgressRow["proficiency_level"]>;
 is_favorited: NonNullable<UserVocabProgressRow["is_favorited"]>;
 dictionary_id: UserVocabProgressRow["dictionary_id"];
 personal_note: UserVocabProgressRow["personal_note"];
 personal_note_mode: z.infer<z.ZodNullable<typeof PersonalNoteModeSchema>>;
};

type VocabIdentity = z.infer<z.ZodObject<{ id: z.ZodString }>>;

type SaveVocabResult = z.infer<
 z.ZodObject<{
  vocabId: z.ZodString;
  dictionaryId: z.ZodOptional<z.ZodString>;
  contextSchemaAvailable: z.ZodBoolean;
  noteSchemaAvailable: z.ZodBoolean;
 }>
>;

type TrackVocabResult = {
 vocabId: SaveVocabResult["vocabId"];
 dictionaryId?: SaveVocabResult["dictionaryId"];
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

function isRlsPolicyError(error: SupabaseErrorInput): boolean {
 const { code, message: rawMessage } = parseSupabaseError(error);
 const message = rawMessage.toLowerCase();

 return code === "42501" || message.includes("row-level security policy");
}

function errorMentionsColumn(error: SupabaseErrorInput, columnName: string): boolean {
 const message = parseSupabaseError(error).message.toLowerCase();

 return message.includes(columnName.toLowerCase());
}

export function normalizeDictionaryHeadword(text: string): string {
 const trimmed = text.trim();
 const chineseOnly = extractChinese(trimmed);
 return (chineseOnly || trimmed).trim();
}

/** Classify a vocab entry as word or sentence based on hanzi length and pinyin spaces */
export function classifyVocabType(
 hanzi: string,
 pinyin?: z.infer<z.ZodNullable<z.ZodString>>,
): z.infer<typeof VocabTypeSchema> {
 if (hanzi.length > 4) return "sentence";
 if (pinyin && pinyin.split(" ").length > 3) return "sentence";
 return "word";
}

function normalizeRelatedCompounds(source: AiAnalysis): AiAnalysis["related_compounds"] {
 const normalizedCompounds = normalizeWordRelations(source.related_compounds);

 if (Array.isArray(source.related_compounds)) {
  return normalizedCompounds || [];
 }

 const legacyWords = Array.from(
  new Set(
   [...(source.related_words || []), ...(source.collocations || [])]
    .map((word) => word.trim())
    .filter(Boolean),
  ),
 );

 if (!legacyWords.length) {
  return undefined;
 }

 return legacyWords.map((word) => ({ word }));
}

function normalizeDefinitionExamples(examples?: AiDefinitionExample[]): AiDefinition["examples"] {
 return examples
  ?.map((example) => ({
   ...example,
   py: example.py || example.pinyin,
   pinyin: example.pinyin || example.py,
  }))
  .filter((example) => example.cn || example.vi || example.py || example.pinyin);
}

function normalizeDefinitionMeanings(meanings?: AiDefinitionMeaning[]): AiDefinition["meanings"] {
 return meanings
  ?.map((item) => ({
   meaning: item.meaning?.trim(),
   examples: normalizeDefinitionExamples(item.examples),
  }))
  .filter((item) => item.meaning || item.examples?.length);
}

function normalizeWordRelations(relations?: AiWordRelation[]): AiAnalysis["synonyms"] {
 return relations
  ?.map((relation) => ({
   word: relation.word?.trim(),
   pinyin: relation.pinyin?.trim(),
   meaning: relation.meaning?.trim(),
  }))
  .filter((relation) => relation.word || relation.pinyin || relation.meaning);
}

function normalizeAnalysis(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
 sinoVietnamese?: z.infer<z.ZodNullable<z.ZodString>>,
): AiAnalysis {
 const source = analysis || {};
 const normalizedEtymology =
  typeof source.etymology === "string"
   ? {
      type: "Không xác định",
      origin: source.etymology.trim(),
      mnemonic: source.mnemonic_story?.trim() || "",
      explanation: source.etymology.trim(),
     }
   : source.etymology
     ? {
        type: source.etymology.type?.trim() || "Không xác định",
        origin: source.etymology.origin?.trim() || source.etymology.explanation?.trim() || "",
        mnemonic: source.etymology.mnemonic?.trim() || source.mnemonic_story?.trim() || "",
        explanation: source.etymology.explanation?.trim() || source.etymology.origin?.trim() || "",
       }
     : undefined;
 const normalizedDefinitions = source.definitions?.map((definition) => ({
  ...definition,
  meanings: normalizeDefinitionMeanings(definition.meanings),
  text:
   definition.text ||
   definition.meaning ||
   definition.meanings?.find((item) => item.meaning)?.meaning,
  meaning:
   definition.meaning ||
   definition.text ||
   definition.meanings?.find((item) => item.meaning)?.meaning,
  examples:
   normalizeDefinitionExamples(definition.examples) ||
   normalizeDefinitionMeanings(definition.meanings)?.find((item) => item.examples?.length)
    ?.examples,
 }));

 const normalizedGrammar = source.grammar_breakdown?.map((point) => ({
  ...point,
  pattern: point.pattern || point.structure,
  structure: point.structure || point.pattern,
 }));

 const resolvedSinoVietnamese =
  sinoVietnamese || source.sino_vietnamese || source.han_viet || undefined;
 const normalizedRelatedCompounds = normalizeRelatedCompounds(source);
 const normalizedSynonyms = normalizeWordRelations(source.synonyms);
 const normalizedAntonyms = normalizeWordRelations(source.antonyms);

 return {
  ...source,
  ...(resolvedSinoVietnamese
   ? {
      sino_vietnamese: resolvedSinoVietnamese,
      han_viet: source.han_viet || resolvedSinoVietnamese,
     }
   : {}),
  ...(normalizedDefinitions ? { definitions: normalizedDefinitions } : {}),
  ...(normalizedEtymology ? { etymology: normalizedEtymology } : {}),
  ...(normalizedGrammar ? { grammar_breakdown: normalizedGrammar } : {}),
  ...(normalizedRelatedCompounds ? { related_compounds: normalizedRelatedCompounds } : {}),
  ...(normalizedSynonyms ? { synonyms: normalizedSynonyms } : {}),
  ...(normalizedAntonyms ? { antonyms: normalizedAntonyms } : {}),
  ...(normalizedEtymology?.mnemonic || source.mnemonic_story
   ? {
      mnemonic_story: source.mnemonic_story || normalizedEtymology?.mnemonic || "",
     }
   : {}),
  ...(typeof source.hsk_level === "string" ? { hsk_level: source.hsk_level.trim() } : {}),
  ...(typeof source.tocfl_level === "string" ? { tocfl_level: source.tocfl_level.trim() } : {}),
  ...(typeof source.notes === "string" ? { notes: source.notes.trim() } : {}),
  ...(source.common_mistakes || source.confusion || source.confusion_warning
   ? {
      common_mistakes: source.common_mistakes || source.confusion || source.confusion_warning,
      confusion: source.confusion || source.confusion_warning || source.common_mistakes,
      confusion_warning: source.confusion_warning || source.confusion || source.common_mistakes,
     }
   : {}),
 };
}

function getDictionaryDefinitionsFromAnalysis(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
 fallbackMeaning = "",
): DictionaryCoreDefinition[] {
 return getNormalizedDefinitions(analysis, fallbackMeaning)
  .map((definition) => {
   const firstExample = definition.examples?.find((example) => example.cn || example.vi);

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
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
 fallbackMeaning = "",
): DictionaryCoreData {
 const normalized = normalizeAnalysis(analysis);
 const definitions = getDictionaryDefinitionsFromAnalysis(normalized, fallbackMeaning);

 return {
  definitions,
  ai_analysis: Object.keys(normalized).length ? normalized : undefined,
 };
}

export function getDictionaryCoreAnalysis(
 entry?: z.infer<z.ZodNullable<typeof DbDictionaryCoreSchema>>,
): AiAnalysis {
 const data = entry?.data || {};
 const embeddedAnalysis = normalizeAnalysis(data.ai_analysis || {}, entry?.sino_vietnamese || null);
 const definitions = (data.definitions || []).map((definition) => ({
  pos: definition.part_of_speech || "",
  meaning: definition.meaning || "",
  text: definition.meaning || "",
  examples: definition.examples,
 }));

 return normalizeAnalysis(
  {
   ...embeddedAnalysis,
   definitions:
    embeddedAnalysis.definitions && embeddedAnalysis.definitions.length > 0
     ? embeddedAnalysis.definitions
     : definitions,
   sino_vietnamese: entry?.sino_vietnamese || undefined,
   han_viet: entry?.sino_vietnamese || undefined,
  },
  entry?.sino_vietnamese || null,
 );
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

export async function incrementDictionaryLookupCount(
 supabase: AppSupabaseClient,
 entry: DictionaryLookupCount,
): Promise<void> {
 const { error } = await supabase
  .from("dictionary_core")
  .update({ lookup_count: (entry.lookup_count || 0) + 1 })
  .eq("id", entry.id);

 if (error && !isMissingDictionaryCacheSchemaError(error)) {
  logger.error("[VocabService] dictionary_core count update error:", error);
 }
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

function isMeaningfulValue(value: JsonFieldValue): boolean {
 if (value == null) return false;
 if (typeof value === "string") return value.trim().length > 0;
 if (Array.isArray(value)) return value.length > 0;
 if (typeof value === "object") return Object.keys(value).length > 0;
 return true;
}

function mergeAnalysisPreserveExisting(existing: JsonObject, incoming: JsonObject): JsonObject {
 const merged: JsonObject = { ...existing };

 for (const [key, incomingValue] of Object.entries(incoming)) {
  if (!isMeaningfulValue(incomingValue)) continue;

  const existingValue = merged[key];
  if (!isMeaningfulValue(existingValue)) {
   merged[key] = incomingValue;
   continue;
  }

  const existingObject = JsonObjectSchema.safeParse(existingValue);
  const incomingObject = JsonObjectSchema.safeParse(incomingValue);
  if (existingObject.success && incomingObject.success) {
   merged[key] = mergeAnalysisPreserveExisting(existingObject.data, incomingObject.data);
  }
 }

 return merged;
}

function mergeAnalysisPreferIncoming(existing: JsonObject, incoming: JsonObject): JsonObject {
 const merged: JsonObject = { ...existing };

 for (const [key, incomingValue] of Object.entries(incoming)) {
  if (!isMeaningfulValue(incomingValue)) continue;

  const existingValue = merged[key];
  const existingObject = JsonObjectSchema.safeParse(existingValue);
  const incomingObject = JsonObjectSchema.safeParse(incomingValue);
  if (existingObject.success && incomingObject.success) {
   merged[key] = mergeAnalysisPreferIncoming(existingObject.data, incomingObject.data);
   continue;
  }

  merged[key] = incomingValue;
 }

 return merged;
}

export function mapDictionaryEntryToVocabData(entry: DbDictionaryCore): VocabData {
 const analysis = getDictionaryCoreAnalysis(entry);

 return {
  dictionary_id: entry.id,
  hanzi: entry.headword,
  pinyin: entry.pinyin || analysis.pinyin || "",
  sino_vietnamese: entry.sino_vietnamese || analysis.sino_vietnamese || analysis.han_viet,
  meaning: getPrimaryMeaning(analysis, ""),
  ai_analysis: analysis,
 };
}

export async function saveUserDictionaryRelationship(
 supabase: AppSupabaseClient,
 userId: string,
 dictionaryId: string,
): Promise<boolean> {
 const { error } = await supabase.from("user_vocabularies").upsert(
  {
   user_id: userId,
   dictionary_id: dictionaryId,
  },
  { onConflict: "user_id,dictionary_id", ignoreDuplicates: true },
 );

 if (error) {
  if (!isMissingDictionaryCacheSchemaError(error) && !isRlsPolicyError(error)) {
   logger.error("[VocabService] user_vocabularies upsert error:", error);
  }
  return false;
 }

 return true;
}

export function getVocabularyAnalysis(vocab?: VocabularyAnalysisSource): AiAnalysis {
 const parsed = aiAnalysisSchema.safeParse(vocab?.analysis || vocab?.ai_analysis || {});
 return normalizeAnalysis(parsed.success ? parsed.data : {}, vocab?.sino_vietnamese || null);
}

export function getPrimaryMeaning(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
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
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
 fallbackMeaning = "",
): AiAnalysis {
 const normalized = normalizeAnalysis(analysis);
 const primaryDefinition = normalized.definitions?.find((item) => item.meaning || item.text);
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
         primaryDefinition.meaning || primaryDefinition.text || meaningSummary || fallbackMeaning,
        text:
         primaryDefinition.text || primaryDefinition.meaning || meaningSummary || fallbackMeaning,
       },
      ],
     }
   : {}),
 });
}

export function getBasicVocabData(vocab: VocabData): VocabData {
 const basicAnalysis = getBasicVocabularyAnalysis(vocab.ai_analysis, vocab.meaning || "");

 return {
  ...vocab,
  pinyin: vocab.pinyin || basicAnalysis.pinyin || "",
  sino_vietnamese: vocab.sino_vietnamese || basicAnalysis.sino_vietnamese || basicAnalysis.han_viet,
  meaning: getPrimaryMeaning(basicAnalysis, vocab.meaning || ""),
  ai_analysis: basicAnalysis,
 };
}

function hasStructuredEtymology(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
): boolean {
 const normalized = normalizeAnalysis(analysis);
 const etymology = normalized.etymology;

 return (
  typeof etymology === "object" &&
  etymology !== null &&
  (!!etymology.type || !!etymology.origin || !!etymology.explanation)
 );
}

function hasStructuredRelatedCompounds(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
): boolean {
 return Array.isArray(analysis?.related_compounds);
}

function hasExtendedLexicalFields(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
): boolean {
 return (
  Array.isArray(analysis?.synonyms) &&
  Array.isArray(analysis?.antonyms) &&
  typeof analysis?.notes === "string" &&
  typeof analysis?.hsk_level === "string" &&
  typeof analysis?.tocfl_level === "string"
 );
}

export function hasInspectorDeepDiveData(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
): boolean {
 const normalized = normalizeAnalysis(analysis);

 if (!hasStructuredEtymology(analysis)) {
  return false;
 }

 if (!hasStructuredRelatedCompounds(analysis)) {
  return false;
 }

 if (!hasExtendedLexicalFields(analysis)) {
  return false;
 }

 return !!(
  normalized.components?.length ||
  normalized.etymology ||
  normalized.mnemonic_story ||
  normalized.usage_logic?.length ||
  normalized.examples?.length ||
  normalized.collocations?.length ||
  normalized.related_compounds?.length ||
  normalized.synonyms?.length ||
  normalized.antonyms?.length ||
  normalized.related_words?.length ||
  normalized.notes ||
  normalized.hsk_level ||
  normalized.tocfl_level ||
  normalized.vn_trap ||
  normalized.common_mistakes ||
  normalized.confusion ||
  normalized.confusion_warning
 );
}

export function isGenericEnglishFallbackAnalysis(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
): boolean {
 const normalized = normalizeAnalysis(analysis);
 if (!Object.keys(normalized).length) return false;

 const hasEnglishMarker =
  normalized.definitions?.some((item) => item.pos?.trim().toUpperCase() === "EN") ||
  normalized.meanings?.some((item) => item.part_of_speech?.trim().toUpperCase() === "EN");

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
  normalized.definitions?.some((definition) => definition.examples?.some((example) => example.vi))
 );

 return !hasVietnameseSpecificData;
}

export function hasDetailedVocabAnalysis(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
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
  normalized.related_compounds?.length ||
  normalized.synonyms?.length ||
  normalized.antonyms?.length ||
  normalized.related_words?.length ||
  normalized.usage_logic?.length ||
  normalized.notes ||
  normalized.hsk_level ||
  normalized.tocfl_level ||
  normalized.common_mistakes ||
  normalized.sentence_translation ||
  normalized.grammar_breakdown?.length
 );
}

export function getNormalizedRadicals(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
): AiRadical[] {
 const normalized = normalizeAnalysis(analysis);
 if (!Object.keys(normalized).length) return [];

 if (normalized.radicals?.length) {
  return normalized.radicals.filter((item) => item.char || item.meaning || item.pinyin);
 }

 if (normalized.radical) {
  return [{ char: normalized.radical, meaning: normalized.radical }];
 }

 return [];
}

export function getNormalizedDefinitions(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
 fallbackMeaning = "",
): AiDefinition[] {
 const normalized = normalizeAnalysis(analysis);

 if (normalized.definitions?.length) {
  return normalized.definitions
   .flatMap((item) => {
    const normalizedMeanings = normalizeDefinitionMeanings(item.meanings);

    if (normalizedMeanings?.length) {
     return normalizedMeanings.map((meaning) => ({
      ...item,
      text: meaning.meaning || item.text || item.meaning,
      meaning: meaning.meaning || item.meaning || item.text,
      examples: meaning.examples || item.examples,
      meanings: normalizedMeanings,
     }));
    }

    return [
     {
      ...item,
      text: item.text || item.meaning,
      meaning: item.meaning || item.text,
      examples: normalizeDefinitionExamples(item.examples),
      meanings: normalizedMeanings,
     },
    ];
   })
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

export function getNormalizedRelatedCompounds(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
): AiRelatedCompound[] {
 const normalized = normalizeAnalysis(analysis);

 return (
  normalized.related_compounds?.filter(
   (compound) => compound.word || compound.pinyin || compound.meaning,
  ) || []
 );
}

export function getNormalizedSynonyms(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
): AiWordRelation[] {
 const normalized = normalizeAnalysis(analysis);

 return (
  normalized.synonyms?.filter((relation) => relation.word || relation.pinyin || relation.meaning) ||
  []
 );
}

export function getNormalizedAntonyms(
 analysis?: z.infer<z.ZodNullable<typeof aiAnalysisSchema>>,
): AiWordRelation[] {
 const normalized = normalizeAnalysis(analysis);

 return (
  normalized.antonyms?.filter((relation) => relation.word || relation.pinyin || relation.meaning) ||
  []
 );
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

/* ══════════════════════════════════════════
   Write Operations
   ══════════════════════════════════════════ */

/** Upsert vocabulary record (e.g., from inspector save or AI result) */
export async function upsertVocab(
 supabase: AppSupabaseClient,
 data: {
  hanzi: string;
  pinyin?: string;
  sinoVietnamese?: string;
  meaning?: string;
  ai_analysis?: AiAnalysis;
 },
): Promise<z.infer<z.ZodNullable<z.ZodType<VocabIdentity>>>> {
 const normalizedAnalysis = normalizeAnalysis(data.ai_analysis, data.sinoVietnamese);
 const resolvedMeaning = getPrimaryMeaning(normalizedAnalysis, data.meaning || "");
 const resolvedSinoVietnamese =
  data.sinoVietnamese || normalizedAnalysis.sino_vietnamese || normalizedAnalysis.han_viet || "";

 const { data: vocabularyId, error } = await supabase.rpc("upsert_legacy_vocabulary_cache", {
  p_hanzi: data.hanzi,
  p_pinyin: data.pinyin || undefined,
  p_sino_vietnamese: resolvedSinoVietnamese || undefined,
  p_meaning: resolvedMeaning || undefined,
  p_analysis: normalizedAnalysis,
 });

 if (error) {
  logger.error("[VocabService] upsert error:", error);
  return null;
 }

 return vocabularyId ? { id: vocabularyId } : null;
}

export async function syncDictionaryEntryToLegacyVocab(
 supabase: AppSupabaseClient,
 entry: DbDictionaryCore,
): Promise<z.infer<z.ZodNullable<z.ZodType<VocabIdentity>>>> {
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
 supabase: AppSupabaseClient,
 userId: string,
 vocabData: VocabData,
 options?: {
  contextSentence?: string;
  contextTranslation?: string;
  personalNote?: string;
  personalNoteMode?: z.infer<typeof PersonalNoteModeSchema>;
  dictionaryMergeMode?: z.infer<typeof DictionaryMergeModeSchema>;
 },
): Promise<z.infer<z.ZodNullable<z.ZodType<SaveVocabResult>>>> {
 const dictionaryEntry = await upsertDictionaryEntry(supabase, {
  headword: vocabData.hanzi,
  pinyin: vocabData.pinyin,
  sinoVietnamese: vocabData.sino_vietnamese,
  meaning: vocabData.meaning || "",
  ai_analysis: vocabData.ai_analysis,
  mergeMode: options?.dictionaryMergeMode,
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
 let contextSchemaAvailable = true;
 let noteSchemaAvailable = true;
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
  contextSchemaAvailable =
   !errorMentionsColumn(error, "context_sentence") &&
   !errorMentionsColumn(error, "context_translation");
  noteSchemaAvailable =
   !errorMentionsColumn(error, "personal_note") &&
   !errorMentionsColumn(error, "personal_note_mode");

  const allowContextFields = contextSchemaAvailable;
  const allowNoteFields = noteSchemaAvailable;

  logger.warn(
   "[VocabService] Falling back to legacy user_vocab_progress schema; migration may be missing.",
  );

  const fallbackPayload: TablesInsert<"user_vocab_progress"> = {
   user_id: userId,
   vocab_id: vocab.id,
   dictionary_id: dictionaryEntry?.id || vocabData.dictionary_id || null,
   is_favorited: true,
  };

  if (allowContextFields) {
   fallbackPayload.context_sentence = options?.contextSentence ?? null;
   fallbackPayload.context_translation = options?.contextTranslation ?? null;
  }

  if (allowNoteFields) {
   fallbackPayload.personal_note = options?.personalNote?.trim() || null;
   fallbackPayload.personal_note_mode = options?.personalNoteMode ?? null;
  }

  const contextFallbackResult = await supabase
   .from("user_vocab_progress")
   .upsert(fallbackPayload, { onConflict: "user_id,vocab_id" });

  if (!contextFallbackResult.error) {
   error = null;
  } else if (isMissingColumnError(contextFallbackResult.error)) {
   contextSchemaAvailable =
    contextSchemaAvailable &&
    !errorMentionsColumn(contextFallbackResult.error, "context_sentence") &&
    !errorMentionsColumn(contextFallbackResult.error, "context_translation");
   noteSchemaAvailable =
    noteSchemaAvailable &&
    !errorMentionsColumn(contextFallbackResult.error, "personal_note") &&
    !errorMentionsColumn(contextFallbackResult.error, "personal_note_mode");

   const noteFallbackResult = await supabase.from("user_vocab_progress").upsert(
    {
     user_id: userId,
     vocab_id: vocab.id,
     is_favorited: true,
    },
    { onConflict: "user_id,vocab_id" },
   );

   if (!noteFallbackResult.error) {
    error = null;
   } else if (isMissingColumnError(noteFallbackResult.error)) {
    const legacyResult = await supabase.from("user_vocab_progress").upsert(
     {
      user_id: userId,
      vocab_id: vocab.id,
      is_favorited: true,
     },
     { onConflict: "user_id,vocab_id" },
    );

    error = legacyResult.error;
   } else {
    error = noteFallbackResult.error;
   }
  } else {
   noteSchemaAvailable = false;
   error = contextFallbackResult.error;
  }
 }

 if (error) {
  logger.error("[VocabService] save to SRS error:", error);
  return null;
 }

 return {
  vocabId: vocab.id,
  dictionaryId: dictionaryEntry?.id || vocabData.dictionary_id,
  contextSchemaAvailable,
  noteSchemaAvailable,
 };
}

/** Track a looked-up vocabulary in the user's personal list without forcing favorite/SRS state. */
export async function trackVocabLookup(
 supabase: AppSupabaseClient,
 userId: string,
 vocabData: VocabData,
): Promise<z.infer<z.ZodNullable<z.ZodType<TrackVocabResult>>>> {
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
  logger.warn(
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
  logger.error("[VocabService] track lookup error:", error);
  return null;
 }

 return {
  vocabId: vocab.id,
  dictionaryId: dictionaryEntry?.id || vocabData.dictionary_id,
 };
}
