import { NextRequest, NextResponse } from "next/server";
import { pinyin as getPinyin } from "pinyin-pro";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
 analyzeHanziDetailed,
 analyzeSentenceDetailed,
} from "@/services/ai.service";
import { getUserAiPromptSettings } from "@/services/ai-prompt-settings.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";
import {
 getPrimaryMeaning,
 getVocabByHanzi,
 getVocabularyAnalysis,
 hasDetailedVocabAnalysis,
 isGenericEnglishFallbackAnalysis,
 upsertVocab,
} from "@/services/vocab.service";

const lookupSchema = z.object({
 text: z.string().trim().min(1).max(120),
 type: z.enum(["word", "sentence"]),
 geminiModel: z.string().trim().min(1).max(200).optional(),
 wordPromptTemplate: z.string().trim().min(1).max(8000).optional(),
 sentencePromptTemplate: z.string().trim().min(1).max(8000).optional(),
});

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const payload: unknown = await request.json();
 const parsed = lookupSchema.safeParse(payload);

 if (!parsed.success) {
  return NextResponse.json(
   { error: "Invalid lookup payload" },
   { status: 400 },
  );
 }

 const {
  data: { user },
 } = await supabase.auth.getUser();
 const promptSettings = user?.id
  ? await getUserAiPromptSettings(supabase, user.id)
  : null;
 const userApiKeys = user?.id
  ? await getActiveUserApiKeyCredentials(supabase, user.id)
  : [];

 if (parsed.data.type === "sentence") {
  const sentenceLookup = await analyzeSentenceDetailed(parsed.data.text, {
   geminiModel: parsed.data.geminiModel || promptSettings?.geminiModel,
   promptTemplate:
    parsed.data.sentencePromptTemplate ||
    promptSettings?.sentenceLookupPrompt ||
    undefined,
   userApiKeys,
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

  return NextResponse.json({ cached: false, data: sentenceLookup.data });
 }

 const cachedWord = await getVocabByHanzi(supabase, parsed.data.text);
 const cachedAnalysis = getVocabularyAnalysis(cachedWord);

 if (cachedWord && hasDetailedVocabAnalysis(cachedAnalysis)) {
  return NextResponse.json({
   cached: true,
   data: {
    id: cachedWord.id,
    hanzi: cachedWord.hanzi,
    pinyin:
     cachedWord.pinyin || cachedAnalysis.pinyin || getPinyin(parsed.data.text),
    sino_vietnamese:
     cachedWord.sino_vietnamese ||
     cachedAnalysis.sino_vietnamese ||
     cachedAnalysis.han_viet ||
     null,
    meaning: getPrimaryMeaning(cachedAnalysis, cachedWord.meaning || ""),
    analysis: cachedAnalysis,
   },
  });
 }

 const aiLookup = await analyzeHanziDetailed(parsed.data.text, {
  geminiModel: parsed.data.geminiModel || promptSettings?.geminiModel,
  promptTemplate:
   parsed.data.wordPromptTemplate ||
   promptSettings?.wordLookupPrompt ||
   undefined,
  userApiKeys,
 });

 if (!aiLookup.data) {
  const fallbackMeaning = isGenericEnglishFallbackAnalysis(cachedAnalysis)
   ? ""
   : getPrimaryMeaning(cachedAnalysis, cachedWord?.meaning || "");

  if (cachedWord && fallbackMeaning) {
   return NextResponse.json({
    cached: true,
    data: {
     id: cachedWord.id,
     hanzi: cachedWord.hanzi,
     pinyin:
      cachedWord.pinyin || cachedAnalysis.pinyin || getPinyin(parsed.data.text),
     sino_vietnamese:
      cachedWord.sino_vietnamese ||
      cachedAnalysis.sino_vietnamese ||
      cachedAnalysis.han_viet ||
      null,
     meaning: fallbackMeaning,
     analysis: cachedAnalysis,
    },
   });
  }

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

 await upsertVocab(supabase, {
  hanzi: parsed.data.text,
  pinyin: aiResult.pinyin || getPinyin(parsed.data.text),
  sinoVietnamese: aiResult.sino_vietnamese || aiResult.han_viet,
  meaning: getPrimaryMeaning(aiResult, ""),
  ai_analysis: aiResult,
 });

 return NextResponse.json({
  cached: false,
  data: {
   hanzi: parsed.data.text,
   pinyin: aiResult.pinyin || getPinyin(parsed.data.text),
   sino_vietnamese: aiResult.sino_vietnamese || aiResult.han_viet || null,
   meaning: getPrimaryMeaning(aiResult, ""),
   analysis: aiResult,
  },
 });
}
