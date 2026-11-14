import type {
 AiDefinitionExample,
 AiVocabResponse,
 AiWordRelation,
 SentenceInsightResponse,
} from "@/types/database";

export function normalizeWordAnalysis(hanzi: string, parsed: AiVocabResponse): AiVocabResponse {
 const normalizeExamples = (examples?: AiDefinitionExample[]) =>
  examples
   ?.map((example) => ({
    ...example,
    py: example.py || example.pinyin,
    pinyin: example.pinyin || example.py,
   }))
   .filter((example) => example.cn || example.vi || example.py || example.pinyin);

 const normalizeRelations = (relations?: AiWordRelation[]) =>
  relations
   ?.map((relation) => ({
    word: relation.word?.trim(),
    pinyin: relation.pinyin?.trim(),
    meaning: relation.meaning?.trim(),
   }))
   .filter((relation) => relation.word || relation.pinyin || relation.meaning);

 const etymology =
  typeof parsed.etymology === "string"
   ? {
      type: "Không xác định",
      origin: parsed.etymology.trim(),
      mnemonic: parsed.mnemonic_story?.trim() || "",
      explanation: parsed.etymology.trim(),
     }
   : {
      type: parsed.etymology?.type?.trim() || "Không xác định",
      origin: parsed.etymology?.origin?.trim() || parsed.etymology?.explanation?.trim() || "",
      mnemonic: parsed.etymology?.mnemonic?.trim() || parsed.mnemonic_story?.trim() || "",
      explanation: parsed.etymology?.explanation?.trim() || parsed.etymology?.origin?.trim() || "",
     };
 const relatedCompounds = normalizeRelations(parsed.related_compounds);
 const synonyms = normalizeRelations(parsed.synonyms);
 const antonyms = normalizeRelations(parsed.antonyms);
 const legacyRelatedCompounds = Array.from(
  new Set(
   [...(parsed.related_words || []), ...(parsed.collocations || [])]
    .map((word) => word.trim())
    .filter(Boolean),
  ),
 ).map((word) => ({ word }));
 const definitions = parsed.definitions?.map((definition) => ({
  ...definition,
  meanings: definition.meanings
   ?.map((item) => ({
    meaning: item.meaning?.trim(),
    examples: normalizeExamples(item.examples),
   }))
   .filter((item) => item.meaning || item.examples?.length),
  text: definition.text || definition.meaning,
  meaning:
   definition.meaning ||
   definition.text ||
   definition.meanings?.find((item) => item.meaning)?.meaning,
  examples:
   normalizeExamples(definition.examples) ||
   definition.meanings
    ?.find((item) => item.examples?.length)
    ?.examples?.map((example) => ({
     ...example,
     py: example.py || example.pinyin,
     pinyin: example.pinyin || example.py,
    })),
 }));

 const flattenedExamples = [
  ...(parsed.examples || []),
  ...((definitions || []).flatMap((definition) =>
   (definition.examples || []).map((example) => ({
    zh: example.cn || "",
    pinyin: example.pinyin || example.py || "",
    vi: example.vi || "",
   })),
  ) || []),
  ...((parsed.meanings || []).flatMap((meaning) =>
   meaning.example
    ? [
       {
        zh: meaning.example.cn || "",
        pinyin: meaning.example.pinyin || "",
        vi: meaning.example.vi || "",
       },
      ]
    : [],
  ) || []),
 ].filter((example) => example.zh || example.pinyin || example.vi);

 const resolvedSinoVietnamese = parsed.sino_vietnamese || parsed.han_viet || undefined;

 return {
  ...parsed,
  hanzi,
  ...(resolvedSinoVietnamese
   ? {
      sino_vietnamese: resolvedSinoVietnamese,
      han_viet: parsed.han_viet || resolvedSinoVietnamese,
     }
   : {}),
  etymology,
  ...(definitions ? { definitions } : {}),
  related_compounds: relatedCompounds?.length ? relatedCompounds : legacyRelatedCompounds,
  synonyms: synonyms || [],
  antonyms: antonyms || [],
  hsk_level: parsed.hsk_level?.trim() || "",
  tocfl_level: parsed.tocfl_level?.trim() || "",
  notes: parsed.notes?.trim() || "",
  mnemonic_story: parsed.mnemonic_story?.trim() || etymology.mnemonic || "",
  ...(flattenedExamples.length ? { examples: flattenedExamples } : {}),
  ...(parsed.common_mistakes || parsed.confusion || parsed.confusion_warning
   ? {
      common_mistakes: parsed.common_mistakes || parsed.confusion || parsed.confusion_warning,
      confusion: parsed.confusion || parsed.confusion_warning || parsed.common_mistakes,
      confusion_warning: parsed.confusion_warning || parsed.confusion || parsed.common_mistakes,
     }
   : {}),
 };
}

export function normalizeBasicWordAnalysis(
 hanzi: string,
 parsed: AiVocabResponse,
): AiVocabResponse {
 const normalized = normalizeWordAnalysis(hanzi, parsed);
 const firstDefinition = normalized.definitions?.find(
  (definition) => definition.meaning || definition.text,
 );
 const meaningSummary =
  normalized.meaning_summary ||
  firstDefinition?.meaning ||
  firstDefinition?.text ||
  normalized.meanings?.find((item) => item.definition)?.definition ||
  "";

 return {
  hanzi,
  pinyin: normalized.pinyin || "",
  sino_vietnamese: normalized.sino_vietnamese || normalized.han_viet || undefined,
  han_viet: normalized.han_viet || normalized.sino_vietnamese || undefined,
  meaning_summary: meaningSummary,
  ...(firstDefinition
   ? {
      definitions: [
       {
        pos: firstDefinition.pos,
        meaning: firstDefinition.meaning || firstDefinition.text || meaningSummary,
        text: firstDefinition.text || firstDefinition.meaning || meaningSummary,
       },
      ],
     }
   : {}),
 };
}

export function normalizeSentenceInsight(
 text: string,
 parsed: SentenceInsightResponse,
): SentenceInsightResponse {
 return {
  ...parsed,
  text,
  grammar_points: parsed.grammar_points?.map((point) => ({
   ...point,
   pattern: point.pattern || point.structure,
   structure: point.structure || point.pattern,
  })),
 };
}
