import type { JsonFieldValue } from "@/types/json";
import { NextRequest, NextResponse } from "next/server";
import { pinyin as getPinyin } from "pinyin-pro";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveAiAnalysisRuntime } from "@/services/ai-analysis-runtime.service";
import {
 getAiRuntimeReceipt,
 recordUserAiRuntimeActivity,
 recordUserAiTaskBlockedActivity,
} from "@/services/ai-runtime.service";
import { analyzeHanziDetailed, analyzeSentenceDetailed } from "@/services/ai.service";
import { getUserAiPromptSettings } from "@/services/ai-prompt-settings.service";
import {
 getDictionaryEntryByHeadword,
 mapDictionaryEntryToVocabData,
 normalizeDictionaryHeadword,
 getPrimaryMeaning,
 getVocabByHanzi,
 getVocabularyAnalysis,
 hasDetailedVocabAnalysis,
 isGenericEnglishFallbackAnalysis,
} from "@/services/vocab.service";

const lookupSchema = z.object({
 text: z.string().trim().min(1).max(120),
 type: z.enum(["word", "sentence"]),
 geminiModel: z.string().trim().min(1).max(200).optional(),
 wordPromptTemplate: z.string().trim().min(1).max(8000).optional(),
 sentencePromptTemplate: z.string().trim().min(1).max(8000).optional(),
});

function runtimeError(status: "missing-key" | "storage-unavailable" | "task-disabled") {
 if (status === "task-disabled") {
  return NextResponse.json({ error: "Tác vụ tra cứu sâu đang tắt." }, { status: 409 });
 }
 return status === "missing-key"
  ? NextResponse.json(
     { error: "Chưa có API key AI đang hoạt động. Hãy thêm key trong Cài đặt → AI." },
     { status: 409 },
    )
  : NextResponse.json({ error: "Kho API key an toàn phía server chưa sẵn sàng." }, { status: 503 });
}

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const payload: JsonFieldValue = await request.json();
 const parsed = lookupSchema.safeParse(payload);

 if (!parsed.success) {
  return NextResponse.json({ error: "Invalid lookup payload" }, { status: 400 });
 }

 if (parsed.data.type === "sentence") {
  const startedAt = performance.now();
  const runtime = await resolveAiAnalysisRuntime({
   supabase,
   userId: user.id,
   taskId: "lookup.deep",
  });
  if (!runtime.ok) {
   await recordUserAiTaskBlockedActivity({
    userId: user.id,
    taskId: "lookup.deep",
    errorCode: runtime.reason,
   });
   return runtimeError(runtime.status);
  }

  const promptSettings = await getUserAiPromptSettings(supabase, user.id);
  const sentenceLookup = await analyzeSentenceDetailed(parsed.data.text, {
   geminiModel: parsed.data.geminiModel || promptSettings?.geminiModel,
   promptTemplate:
    parsed.data.sentencePromptTemplate || promptSettings?.sentenceLookupPrompt || undefined,
   userApiKeys: [runtime.credential],
   allowGroq: true,
  });

  if (!sentenceLookup.data) {
   await recordUserAiRuntimeActivity({
    userId: user.id,
    runtime: runtime.runtime,
    status: "failure",
    errorCode: "provider-unavailable",
    latencyMs: Math.round(performance.now() - startedAt),
   });
   return NextResponse.json(
    {
     error:
      sentenceLookup.error ||
      "Không thể generate bản dịch tiếng Việt lúc này vì AI provider đang unavailable.",
    },
    { status: 503 },
   );
  }

  await recordUserAiRuntimeActivity({
   userId: user.id,
   runtime: runtime.runtime,
   status: "success",
   latencyMs: Math.round(performance.now() - startedAt),
  });
  return NextResponse.json({
   cached: false,
   provenance: "ai-transient",
   runtimeReceipt: getAiRuntimeReceipt(runtime.runtime),
   data: sentenceLookup.data,
  });
 }

 const lookupText = normalizeDictionaryHeadword(parsed.data.text);
 const cachedDictionary = await getDictionaryEntryByHeadword(supabase, lookupText);

 if (cachedDictionary) {
  const cachedData = mapDictionaryEntryToVocabData(cachedDictionary);

  return NextResponse.json({
   cached: true,
   data: {
    id: cachedData.id,
    dictionary_id: cachedData.dictionary_id,
    hanzi: cachedData.hanzi,
    pinyin: cachedData.pinyin || getPinyin(lookupText),
    sino_vietnamese: cachedData.sino_vietnamese || null,
    meaning: cachedData.meaning,
    analysis: cachedData.ai_analysis || {},
   },
  });
 }

 const cachedWord = await getVocabByHanzi(supabase, lookupText);
 const cachedAnalysis = getVocabularyAnalysis(cachedWord);

 if (cachedWord && hasDetailedVocabAnalysis(cachedAnalysis)) {
  return NextResponse.json({
   cached: true,
   data: {
    id: cachedWord.id,
    dictionary_id: undefined,
    hanzi: cachedWord.hanzi,
    pinyin: cachedWord.pinyin || cachedAnalysis.pinyin || getPinyin(lookupText),
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

 const startedAt = performance.now();
 const runtime = await resolveAiAnalysisRuntime({
  supabase,
  userId: user.id,
  taskId: "lookup.deep",
 });
 if (!runtime.ok) {
  const fallbackMeaning = isGenericEnglishFallbackAnalysis(cachedAnalysis)
   ? ""
   : getPrimaryMeaning(cachedAnalysis, cachedWord?.meaning || "");

  if (cachedWord && fallbackMeaning) {
   return NextResponse.json({
    cached: true,
    data: {
     id: cachedWord.id,
     dictionary_id: undefined,
     hanzi: cachedWord.hanzi,
     pinyin: cachedWord.pinyin || cachedAnalysis.pinyin || getPinyin(lookupText),
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

  await recordUserAiTaskBlockedActivity({
   userId: user.id,
   taskId: "lookup.deep",
   errorCode: runtime.reason,
  });
  return runtimeError(runtime.status);
 }

 const promptSettings = await getUserAiPromptSettings(supabase, user.id);
 const aiLookup = await analyzeHanziDetailed(lookupText, {
  geminiModel: parsed.data.geminiModel || promptSettings?.geminiModel,
  promptTemplate: parsed.data.wordPromptTemplate || promptSettings?.wordLookupPrompt || undefined,
  userApiKeys: [runtime.credential],
  allowGroq: true,
 });

 if (!aiLookup.data) {
  await recordUserAiRuntimeActivity({
   userId: user.id,
   runtime: runtime.runtime,
   status: "failure",
   errorCode: "provider-unavailable",
   latencyMs: Math.round(performance.now() - startedAt),
  });
  const fallbackMeaning = isGenericEnglishFallbackAnalysis(cachedAnalysis)
   ? ""
   : getPrimaryMeaning(cachedAnalysis, cachedWord?.meaning || "");

  if (cachedWord && fallbackMeaning) {
   return NextResponse.json({
    cached: true,
    data: {
     id: cachedWord.id,
     dictionary_id: undefined,
     hanzi: cachedWord.hanzi,
     pinyin: cachedWord.pinyin || cachedAnalysis.pinyin || getPinyin(lookupText),
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

 // This legacy route accepts caller/user-owned prompt settings. Its generated
 // analysis is therefore request-local and cannot mutate shared dictionary data.
 await recordUserAiRuntimeActivity({
  userId: user.id,
  runtime: runtime.runtime,
  status: "success",
  latencyMs: Math.round(performance.now() - startedAt),
 });
 return NextResponse.json({
  cached: false,
  provenance: "ai-transient",
  runtimeReceipt: getAiRuntimeReceipt(runtime.runtime),
  data: {
   id: undefined,
   dictionary_id: undefined,
   hanzi: lookupText,
   pinyin: aiLookup.data.pinyin || getPinyin(lookupText),
   sino_vietnamese: aiLookup.data.sino_vietnamese || aiLookup.data.han_viet || null,
   meaning: getPrimaryMeaning(aiLookup.data, ""),
   analysis: aiLookup.data,
  },
 });
}
