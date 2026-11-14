import { JsonObjectSchema } from "@/types/json";
import type { JsonFieldValue, JsonObject } from "@/types/json";
import { z } from "zod";
import { aiAnalysisSchema } from "@/types/database";
import type {
 AiAnalysis,
 AiDefinition,
 AiDefinitionExample,
 AiDefinitionMeaning,
 AiWordRelation,
} from "@/types/database";

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

export function normalizeDefinitionExamples(
 examples?: AiDefinitionExample[],
): AiDefinition["examples"] {
 return examples
  ?.map((example) => ({
   ...example,
   py: example.py || example.pinyin,
   pinyin: example.pinyin || example.py,
  }))
  .filter((example) => example.cn || example.vi || example.py || example.pinyin);
}

export function normalizeDefinitionMeanings(
 meanings?: AiDefinitionMeaning[],
): AiDefinition["meanings"] {
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

export function normalizeAnalysis(
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

function isMeaningfulValue(value: JsonFieldValue): boolean {
 if (value == null) return false;
 if (typeof value === "string") return value.trim().length > 0;
 if (Array.isArray(value)) return value.length > 0;
 if (typeof value === "object") return Object.keys(value).length > 0;
 return true;
}

export function mergeAnalysisPreserveExisting(
 existing: JsonObject,
 incoming: JsonObject,
): JsonObject {
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

export function mergeAnalysisPreferIncoming(
 existing: JsonObject,
 incoming: JsonObject,
): JsonObject {
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
