import { NextRequest, NextResponse } from "next/server";
import { pinyin as getPinyin } from "pinyin-pro";
import { z } from "zod";
import {
 applyServerTimingHeaders,
 isAbortError,
 throwIfAborted,
 type ServerTimingMetric,
} from "@/lib/request-utils";
import { createClient } from "@/lib/supabase/server";
import { analyzeHanziDetailed } from "@/services/ai.service";
import { getUserAiPromptSettings } from "@/services/ai-prompt-settings.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";
import {
 getDictionaryEntryByHeadword,
 getPrimaryMeaning,
 getVocabularyAnalysis,
 getVocabByHanzi,
 hasInspectorDeepDiveData,
 mapDictionaryEntryToVocabData,
 normalizeDictionaryHeadword,
 syncDictionaryEntryToLegacyVocab,
 upsertDictionaryEntry,
 upsertVocab,
} from "@/services/vocab.service";
import type { VocabData } from "@/types/database";

const deepLookupSchema = z.object({
 text: z.string().trim().min(1).max(120),
 geminiModel: z.string().trim().min(1).max(200).optional(),
 wordPromptTemplate: z.string().trim().min(1).max(8000).optional(),
});

function roundMs(value: number): number {
 return Math.round(value * 100) / 100;
}

function buildLookupResponse(vocabData: VocabData, cached: boolean) {
 return NextResponse.json({
  cached,
  data: {
   id: vocabData.id,
   dictionary_id: vocabData.dictionary_id,
   hanzi: vocabData.hanzi,
   pinyin: vocabData.pinyin,
   sino_vietnamese: vocabData.sino_vietnamese || null,
   meaning: vocabData.meaning,
   analysis: vocabData.ai_analysis || {},
  },
 });
}

export async function POST(request: NextRequest) {
 const startedAt = performance.now();
 const metrics: ServerTimingMetric[] = [];
 let lookupText = "";
 let source = "unknown";
 let cached = false;
 let aiStatus = "skipped";
 let userApiKeyCount = 0;

 const finalize = (response: NextResponse) => {
  const totalMs = performance.now() - startedAt;
  applyServerTimingHeaders(
   response.headers,
   [...metrics, { name: "total", durationMs: totalMs }],
   {
    "x-lookup-route": "deep",
    "x-lookup-source": source,
    "x-lookup-cache": cached ? "hit" : "miss",
    "x-lookup-ai-status": aiStatus,
    "x-lookup-user-keys": userApiKeyCount,
   },
  );

  console.info(
   "[lookup/deep]",
   JSON.stringify({
    lookupText,
    source,
    cached,
    aiStatus,
    userApiKeyCount,
    aborted: request.signal.aborted,
    totalMs: roundMs(totalMs),
   }),
  );

  return response;
 };

 try {
  const supabase = await createClient();
  const payload: unknown = await request.json();
  const parsed = deepLookupSchema.safeParse(payload);

  if (!parsed.success) {
   source = "invalid";
   return finalize(
    NextResponse.json(
     { error: "Invalid deep lookup payload" },
     { status: 400 },
    ),
   );
  }

  lookupText = normalizeDictionaryHeadword(parsed.data.text);

  const cacheStartedAt = performance.now();
  const cachedDictionary = await getDictionaryEntryByHeadword(
   supabase,
   lookupText,
  );

  if (cachedDictionary) {
   const cachedData = mapDictionaryEntryToVocabData(cachedDictionary);
   metrics.push({
    name: "cache",
    durationMs: performance.now() - cacheStartedAt,
   });
   if (hasInspectorDeepDiveData(cachedData.ai_analysis)) {
    source = "dictionary_core";
    cached = true;
    return finalize(buildLookupResponse(cachedData, true));
   }
  }

  const cachedWord = await getVocabByHanzi(supabase, lookupText);
  const cachedAnalysis = getVocabularyAnalysis(cachedWord);
  metrics.push({
   name: "cache",
   durationMs: performance.now() - cacheStartedAt,
  });

  if (cachedWord && hasInspectorDeepDiveData(cachedAnalysis)) {
   source = "legacy_vocab";
   cached = true;
   return finalize(
    buildLookupResponse(
     {
      id: cachedWord.id,
      hanzi: cachedWord.hanzi,
      pinyin:
       cachedWord.pinyin || cachedAnalysis.pinyin || getPinyin(lookupText),
      sino_vietnamese:
       cachedWord.sino_vietnamese ||
       cachedAnalysis.sino_vietnamese ||
       cachedAnalysis.han_viet ||
       undefined,
      meaning: getPrimaryMeaning(cachedAnalysis, cachedWord.meaning || ""),
      ai_analysis: cachedAnalysis,
     },
     true,
    ),
   );
  }

  throwIfAborted(request.signal);

  const authStartedAt = performance.now();
  const {
   data: { user },
  } = await supabase.auth.getUser();
  const promptSettings = user?.id
   ? await getUserAiPromptSettings(supabase, user.id)
   : null;
  const userApiKeys = user?.id
   ? await getActiveUserApiKeyCredentials(supabase, user.id)
   : [];
  userApiKeyCount = userApiKeys.length;
  metrics.push({
   name: "auth",
   durationMs: performance.now() - authStartedAt,
  });

  throwIfAborted(request.signal);

  const aiStartedAt = performance.now();
  aiStatus = "running";
  const aiLookup = await analyzeHanziDetailed(lookupText, {
   geminiModel: parsed.data.geminiModel || promptSettings?.geminiModel,
   promptTemplate:
    parsed.data.wordPromptTemplate ||
    promptSettings?.wordLookupPrompt ||
    undefined,
   userApiKeys,
   abortSignal: request.signal,
  });
  metrics.push({
   name: "ai",
   durationMs: performance.now() - aiStartedAt,
  });
  aiStatus = aiLookup.data ? "ok" : "failed";

  if (!aiLookup.data) {
   source = "ai_deep_error";
   return finalize(
    NextResponse.json(
     {
      error:
       aiLookup.error ||
       "Không thể generate phân tích sâu lúc này vì AI provider đang unavailable.",
     },
     { status: 503 },
    ),
   );
  }

  throwIfAborted(request.signal);

  const persistStartedAt = performance.now();
  const dictionaryEntry = await upsertDictionaryEntry(supabase, {
   headword: lookupText,
   pinyin: aiLookup.data.pinyin || getPinyin(lookupText),
   sinoVietnamese: aiLookup.data.sino_vietnamese || aiLookup.data.han_viet,
   meaning: getPrimaryMeaning(aiLookup.data, ""),
   ai_analysis: aiLookup.data,
  });

  let legacyVocabId: string | undefined;

  if (dictionaryEntry) {
   const mirrored = await syncDictionaryEntryToLegacyVocab(
    supabase,
    dictionaryEntry,
   );
   legacyVocabId = mirrored?.id;
  } else {
   const mirrored = await upsertVocab(supabase, {
    hanzi: lookupText,
    pinyin: aiLookup.data.pinyin || getPinyin(lookupText),
    sinoVietnamese: aiLookup.data.sino_vietnamese || aiLookup.data.han_viet,
    meaning: getPrimaryMeaning(aiLookup.data, ""),
    ai_analysis: aiLookup.data,
   });
   legacyVocabId = mirrored?.id;
  }
  metrics.push({
   name: "persist",
   durationMs: performance.now() - persistStartedAt,
  });
  source = "ai_deep";

  return finalize(
   buildLookupResponse(
    {
     id: legacyVocabId,
     dictionary_id: dictionaryEntry?.id,
     hanzi: lookupText,
     pinyin: aiLookup.data.pinyin || getPinyin(lookupText),
     sino_vietnamese:
      aiLookup.data.sino_vietnamese || aiLookup.data.han_viet || undefined,
     meaning: getPrimaryMeaning(aiLookup.data, ""),
     ai_analysis: aiLookup.data,
    },
    false,
   ),
  );
 } catch (error) {
  if (isAbortError(error) || request.signal.aborted) {
   source = "aborted";
   aiStatus = "aborted";
   return finalize(new NextResponse(null, { status: 499 }));
  }

  console.error("[lookup/deep] Unexpected error:", error);
  source = "error";
  if (aiStatus === "skipped") {
   aiStatus = "error";
  }

  return finalize(
   NextResponse.json(
    { error: "Lookup deep failed unexpectedly." },
    { status: 500 },
   ),
  );
 }
}
