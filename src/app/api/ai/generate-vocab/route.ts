import { createClient } from "@/lib/supabase/server";
import { getUserAiPromptSettings } from "@/services/ai-prompt-settings.service";
import { analyzeHanziDetailed } from "@/services/ai.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";
import {
 getDictionaryEntryByHeadword,
 getPrimaryMeaning,
 getVocabByHanzi,
 hasInspectorDeepDiveData,
 getVocabularyAnalysis,
 mapDictionaryEntryToVocabData,
 normalizeDictionaryHeadword,
 syncDictionaryEntryToLegacyVocab,
 upsertDictionaryEntry,
 upsertVocab,
} from "@/services/vocab.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
 const supabase = await createClient();

 // Auth check
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const body: unknown = await request.json();
 const { hanzi } = body as { hanzi?: string };

 if (!hanzi || typeof hanzi !== "string" || hanzi.length > 10) {
  return NextResponse.json(
   { error: "Invalid hanzi parameter" },
   { status: 400 },
  );
 }

 const lookupText = normalizeDictionaryHeadword(hanzi);
 const cachedDictionary = await getDictionaryEntryByHeadword(
  supabase,
  lookupText,
 );

 if (cachedDictionary) {
  const cachedData = mapDictionaryEntryToVocabData(cachedDictionary);
  if (hasInspectorDeepDiveData(cachedData.ai_analysis)) {
   return NextResponse.json({
    data: cachedData.ai_analysis || {},
    cached: true,
   });
  }
 }

 // Check if we already have AI data in DB via service
 const existing = await getVocabByHanzi(supabase, lookupText);
 const existingAi = getVocabularyAnalysis(existing);

 if (hasInspectorDeepDiveData(existingAi)) {
  return NextResponse.json({ data: existingAi, cached: true });
 }

 // Call AI service
 const promptSettings = await getUserAiPromptSettings(supabase, user.id);
 const userApiKeys = await getActiveUserApiKeyCredentials(supabase, user.id);
 const aiLookup = await analyzeHanziDetailed(lookupText, {
  geminiModel: promptSettings.geminiModel,
  promptTemplate: promptSettings.wordLookupPrompt,
  userApiKeys,
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

 const dictionaryEntry = await upsertDictionaryEntry(supabase, {
  headword: aiResult.hanzi || lookupText,
  pinyin: aiResult.pinyin,
  sinoVietnamese: aiResult.sino_vietnamese || aiResult.han_viet,
  meaning: getPrimaryMeaning(aiResult, ""),
  ai_analysis: aiResult,
 });

 const upsertResult = dictionaryEntry
  ? await syncDictionaryEntryToLegacyVocab(supabase, dictionaryEntry)
  : await upsertVocab(supabase, {
     hanzi: aiResult.hanzi || lookupText,
     pinyin: aiResult.pinyin,
     sinoVietnamese: aiResult.sino_vietnamese || aiResult.han_viet,
     meaning: getPrimaryMeaning(aiResult, ""),
     ai_analysis: aiResult,
    });

 if (!upsertResult) {
  console.error("[generate-vocab] DB upsert failed");
 }

 return NextResponse.json({ data: aiResult, cached: false });
}
