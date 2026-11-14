import { z } from "zod";
import {
 normalizeAnalysis,
 normalizeDefinitionExamples,
 normalizeDefinitionMeanings,
} from "@/services/vocab/vocab-analysis-normalizers";
import { aiAnalysisSchema, DbDictionaryCoreSchema, DbVocabularySchema } from "@/types/database";
import type {
 DbDictionaryCore,
 AiAnalysis,
 AiDefinition,
 AiRadical,
 AiRelatedCompound,
 AiWordRelation,
 DictionaryCoreData,
 DictionaryCoreDefinition,
 VocabData,
} from "@/types/database";

type VocabularyAnalysisSource = z.infer<
 z.ZodNullable<
  z.ZodObject<{
   analysis: typeof DbVocabularySchema.shape.analysis;
   ai_analysis: typeof DbVocabularySchema.shape.ai_analysis;
   sino_vietnamese: typeof DbVocabularySchema.shape.sino_vietnamese;
  }>
 >
>;

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

export function buildDictionaryCoreData(
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
