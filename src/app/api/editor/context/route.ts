import type { JsonFieldValue } from "@/types/json";
import { NextRequest, NextResponse } from "next/server";
import { pinyin as getPinyin } from "pinyin-pro";
import { createClient } from "@/lib/supabase/server";
import { extractChinese } from "@/lib/chinese-utils";
import { resolveAiAnalysisRuntime } from "@/services/ai-analysis-runtime.service";
import { getUserAiPromptSettings } from "@/services/ai-prompt-settings.service";
import { analyzeHanziDetailed, analyzeSentenceDetailed } from "@/services/ai.service";
import {
 getDictionaryEntryByHeadword,
 getUserVocabProgressRecord,
 incrementDictionaryLookupCount,
 getPrimaryMeaning,
 getNormalizedDefinitions,
 getNormalizedRadicals,
 getVocabByHanzi,
 getVocabularyAnalysis,
 hasDetailedVocabAnalysis,
 isGenericEnglishFallbackAnalysis,
 mapDictionaryEntryToVocabData,
 normalizeDictionaryHeadword,
 syncDictionaryEntryToLegacyVocab,
 upsertDictionaryEntry,
 upsertVocab,
} from "@/services/vocab.service";
import type {
 PersonalNoteMode,
 SmartSelectionMode,
 SmartSelectionResult,
 VocabData,
} from "@/types/database";
import { SmartSelectionModeSchema } from "@/types/database";
import { GeminiModelIdSchema } from "@/lib/gemini-models";
import { z } from "zod";

const MAX_SELECTION_LENGTH = 120;
const EditorContextRequestSchema = z.object({
 selection: z.string(),
 contextSentence: z.string().optional(),
 mode: SmartSelectionModeSchema.optional(),
 geminiModel: GeminiModelIdSchema.optional(),
 wordPromptTemplate: z.string().optional(),
 sentencePromptTemplate: z.string().optional(),
});
type NullableText = z.infer<z.ZodNullable<z.ZodString>>;

function resolveMode(selection: string): SmartSelectionMode {
 const normalized = extractChinese(selection) || selection;
 return normalized.length <= 2 ? "word" : "sentence";
}

function runtimeError(status: "missing-key" | "storage-unavailable") {
 return status === "missing-key"
  ? NextResponse.json(
     { error: "Chưa có API key AI đang hoạt động. Hãy thêm key trong Cài đặt → AI." },
     { status: 409 },
    )
  : NextResponse.json(
     { error: "Kho API key an toàn phía server chưa sẵn sàng." },
     { status: 503 },
    );
}

async function getProgressState(
 userId: NullableText,
 vocabId: VocabData["id"],
 dictionaryId: VocabData["dictionary_id"],
 supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{
 isSaved: boolean;
 personalNote: string;
 personalNoteMode: PersonalNoteMode;
}> {
 if (!userId || (!vocabId && !dictionaryId)) {
  return {
   isSaved: false,
   personalNote: "",
   personalNoteMode: "important",
  };
 }

 let isSaved = false;

 if (dictionaryId) {
  const { data: relationData } = await supabase
   .from("user_vocabularies")
   .select("dictionary_id")
   .eq("user_id", userId)
   .eq("dictionary_id", dictionaryId)
   .maybeSingle();

  isSaved = !!relationData;
 }

 if (!vocabId) {
  return {
   isSaved,
   personalNote: "",
   personalNoteMode: "important",
  };
 }

 const data = await getUserVocabProgressRecord(supabase, userId, {
  vocabId,
 });

 return {
  isSaved: isSaved || !!data,
  personalNote: data?.personal_note || "",
  personalNoteMode: data?.personal_note_mode || "important",
 };
}

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const body: JsonFieldValue = await request.json();
 const parsedBody = EditorContextRequestSchema.safeParse(body);
 if (!parsedBody.success) {
  return NextResponse.json({ error: "Invalid selection" }, { status: 400 });
 }
 const {
  selection,
  contextSentence,
  mode,
  geminiModel,
  wordPromptTemplate,
  sentencePromptTemplate,
 } = parsedBody.data;

 const rawSelection = selection?.trim();
 if (!rawSelection || rawSelection.length > MAX_SELECTION_LENGTH) {
  return NextResponse.json({ error: "Invalid selection" }, { status: 400 });
 }

 const resolvedMode = mode || resolveMode(rawSelection);
 const normalizedChinese = extractChinese(rawSelection);

 if (resolvedMode === "word") {
  const lookupText = normalizeDictionaryHeadword(normalizedChinese || rawSelection);
  const cachedDictionary = await getDictionaryEntryByHeadword(supabase, lookupText);

  if (cachedDictionary) {
   void incrementDictionaryLookupCount(supabase, {
    id: cachedDictionary.id,
    lookup_count: cachedDictionary.lookup_count,
   });
  }

  const existing = cachedDictionary ? null : await getVocabByHanzi(supabase, lookupText);
  const cachedDictionaryVocab = cachedDictionary
   ? mapDictionaryEntryToVocabData(cachedDictionary)
   : null;
  const existingAnalysis = cachedDictionaryVocab
   ? cachedDictionaryVocab.ai_analysis || {}
   : getVocabularyAnalysis(existing);
  const existingIsEnglishFallback = isGenericEnglishFallbackAnalysis(existingAnalysis);
  const existingMeaning = getPrimaryMeaning(
   existingAnalysis,
   existingIsEnglishFallback ? "" : existing?.meaning || "",
  );
  let vocab: VocabData = {
   id: existing?.id,
   dictionary_id: cachedDictionaryVocab?.dictionary_id,
   hanzi: lookupText,
   pinyin:
    cachedDictionaryVocab?.pinyin ||
    existing?.pinyin ||
    existingAnalysis.pinyin ||
    getPinyin(lookupText),
   sino_vietnamese:
    cachedDictionaryVocab?.sino_vietnamese ||
    existing?.sino_vietnamese ||
    existingAnalysis.sino_vietnamese ||
    existingAnalysis.han_viet ||
    undefined,
   meaning: existingMeaning,
   ai_analysis: existingAnalysis,
  };

  const needsEnrichment =
   (!cachedDictionaryVocab && !existing) ||
   !vocab.pinyin ||
   !existingMeaning ||
   !hasDetailedVocabAnalysis(existingAnalysis);

  if (needsEnrichment && normalizedChinese) {
   const runtime = await resolveAiAnalysisRuntime({ supabase, userId: user.id });
   if (!runtime.ok) return runtimeError(runtime.status);
   const promptSettings = await getUserAiPromptSettings(supabase, user.id);
   const aiLookup = await analyzeHanziDetailed(lookupText, {
    geminiModel: geminiModel || promptSettings?.geminiModel,
    promptTemplate: wordPromptTemplate || promptSettings?.wordLookupPrompt || undefined,
    userApiKeys: [runtime.credential],
    allowGroq: true,
   });

   if (!aiLookup.data) {
    return NextResponse.json(
     {
      error:
       aiLookup.error ||
       "Không thể generate nghĩa tiếng Việt lúc này vì AI provider đang unavailable.",
     },
     { status: 503 },
    );
   }

   const aiResult = aiLookup.data;
   const meaning = getPrimaryMeaning(aiResult, existingMeaning);

   const dictionaryEntry = await upsertDictionaryEntry(supabase, {
    headword: lookupText,
    pinyin: aiResult.pinyin || vocab.pinyin,
    sinoVietnamese: aiResult.sino_vietnamese || aiResult.han_viet,
    meaning,
    ai_analysis: aiResult,
   });

   const upsertResult = dictionaryEntry
    ? await syncDictionaryEntryToLegacyVocab(supabase, dictionaryEntry)
    : await upsertVocab(supabase, {
       hanzi: lookupText,
       pinyin: aiResult.pinyin || vocab.pinyin,
       sinoVietnamese: aiResult.sino_vietnamese || aiResult.han_viet,
       meaning,
       ai_analysis: aiResult,
      });

   vocab = {
    id: upsertResult?.id || existing?.id,
    dictionary_id: dictionaryEntry?.id || vocab.dictionary_id,
    hanzi: lookupText,
    pinyin: aiResult.pinyin || vocab.pinyin,
    sino_vietnamese: aiResult.sino_vietnamese || aiResult.han_viet,
    meaning,
    ai_analysis: aiResult,
   };
  }

  const analysis = vocab.ai_analysis || {};
  const definitions = getNormalizedDefinitions(analysis, vocab.meaning);
  const progress = await getProgressState(user.id, vocab.id, vocab.dictionary_id, supabase);

  const etymologyRaw = analysis.etymology;
  const etymologyText =
   typeof etymologyRaw === "string" ? etymologyRaw : etymologyRaw?.explanation || "";

  const result: SmartSelectionResult = {
   mode: "word",
   selection: lookupText,
   context_sentence: contextSentence?.trim() || rawSelection,
   entry: vocab,
   radicals: getNormalizedRadicals(analysis),
   components: analysis.components || [],
   definitions,
   meaning_summary: analysis.meaning_summary || vocab.meaning || "",
   etymology: etymologyText,
   mnemonic_story: analysis.mnemonic_story || "",
   translation: "",
   grammar_points: [],
   isSaved: progress.isSaved,
   found: !!(vocab.id || definitions.length || vocab.meaning || vocab.pinyin),
   personal_note: progress.personalNote,
   personal_note_mode: progress.personalNoteMode,
  };

  return NextResponse.json(result);
 }

 const sentenceText = rawSelection;
 const existing = await getVocabByHanzi(supabase, sentenceText);
 const existingAnalysis = getVocabularyAnalysis(existing);
 const cachedTranslation = existingAnalysis.sentence_translation || existing?.meaning || "";
 const cachedGrammar = existingAnalysis.grammar_breakdown || [];

 let translation = cachedTranslation;
 let grammarPoints = cachedGrammar;
 let pinyin = existing?.pinyin || getPinyin(sentenceText);

 if (!translation && grammarPoints.length === 0) {
  const runtime = await resolveAiAnalysisRuntime({ supabase, userId: user.id });
  if (!runtime.ok) return runtimeError(runtime.status);
  const promptSettings = await getUserAiPromptSettings(supabase, user.id);
  const sentenceLookup = await analyzeSentenceDetailed(sentenceText, {
   geminiModel: geminiModel || promptSettings?.geminiModel,
   promptTemplate: sentencePromptTemplate || promptSettings?.sentenceLookupPrompt || undefined,
   userApiKeys: [runtime.credential],
   allowGroq: true,
  });
  if (!sentenceLookup.data) {
   return NextResponse.json(
    {
     error:
      sentenceLookup.error ||
      "Không thể generate bản dịch tiếng Việt lúc này vì AI provider đang unavailable.",
    },
    { status: 503 },
   );
  }

  const sentenceInsight = sentenceLookup.data;
  translation = sentenceInsight.translation || "";
  grammarPoints = sentenceInsight.grammar_points || [];
  pinyin = sentenceInsight.pinyin || pinyin;
 }

 const entry: VocabData = {
  id: existing?.id,
  hanzi: sentenceText,
  pinyin,
  meaning: existing?.meaning || translation,
  ai_analysis: {
   ...existingAnalysis,
   ...(translation ? { sentence_translation: translation } : {}),
   ...(grammarPoints.length ? { grammar_breakdown: grammarPoints } : {}),
  },
 };
 const progress = await getProgressState(user.id, entry.id, entry.dictionary_id, supabase);

 const result: SmartSelectionResult = {
  mode: "sentence",
  selection: sentenceText,
  context_sentence: contextSentence?.trim() || sentenceText,
  entry,
  radicals: [],
  components: [],
  definitions: [],
  meaning_summary: existing?.meaning || translation || "",
  etymology: "",
  mnemonic_story: "",
  translation,
  grammar_points: grammarPoints,
  isSaved: progress.isSaved,
  found: !!(existing || translation || grammarPoints.length),
  personal_note: progress.personalNote,
  personal_note_mode: progress.personalNoteMode,
 };

 return NextResponse.json(result);
}
