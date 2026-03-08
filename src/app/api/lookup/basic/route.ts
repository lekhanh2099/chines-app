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
import { analyzeHanziBasicDetailed } from "@/services/ai.service";
import { getUserAiPromptSettings } from "@/services/ai-prompt-settings.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";
import {
 getBasicVocabData,
 getDictionaryEntryByHeadword,
 getPrimaryMeaning,
 getVocabularyAnalysis,
 getVocabByHanzi,
 mapDictionaryEntryToVocabData,
 normalizeDictionaryHeadword,
 syncDictionaryEntryToLegacyVocab,
 upsertDictionaryEntry,
 upsertVocab,
} from "@/services/vocab.service";
import type { VocabData } from "@/types/database";

const basicLookupSchema = z.object({
 text: z.string().trim().min(1).max(120),
 geminiModel: z.string().trim().min(1).max(200).optional(),
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

function hasUsableBasicData(
 vocabData: VocabData | null,
): vocabData is VocabData {
 return !!(
  vocabData &&
  (vocabData.pinyin || vocabData.sino_vietnamese || vocabData.meaning)
 );
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
    "x-lookup-route": "basic",
    "x-lookup-source": source,
    "x-lookup-cache": cached ? "hit" : "miss",
    "x-lookup-ai-status": aiStatus,
    "x-lookup-user-keys": userApiKeyCount,
   },
  );

  console.info(
   "[lookup/basic]",
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
  const parsed = basicLookupSchema.safeParse(payload);

  if (!parsed.success) {
   source = "invalid";
   return finalize(
    NextResponse.json(
     { error: "Invalid basic lookup payload" },
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
   metrics.push({
    name: "cache",
    durationMs: performance.now() - cacheStartedAt,
   });
   source = "dictionary_core";
   cached = true;
   return finalize(
    buildLookupResponse(
     getBasicVocabData(mapDictionaryEntryToVocabData(cachedDictionary)),
     true,
    ),
   );
  }

  const cachedWord = await getVocabByHanzi(supabase, lookupText);
  metrics.push({
   name: "cache",
   durationMs: performance.now() - cacheStartedAt,
  });

  if (cachedWord) {
   const cachedVocab = getBasicVocabData({
    id: cachedWord.id,
    hanzi: cachedWord.hanzi,
    pinyin: cachedWord.pinyin || getPinyin(lookupText),
    sino_vietnamese: cachedWord.sino_vietnamese || undefined,
    meaning: getPrimaryMeaning(
     getVocabularyAnalysis(cachedWord),
     cachedWord.meaning || "",
    ),
    ai_analysis: getVocabularyAnalysis(cachedWord),
   });

   if (hasUsableBasicData(cachedVocab)) {
    source = "legacy_vocab";
    cached = true;
    return finalize(buildLookupResponse(cachedVocab, true));
   }
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
  const basicLookup = await analyzeHanziBasicDetailed(lookupText, {
   geminiModel: parsed.data.geminiModel || promptSettings?.geminiModel,
   userApiKeys,
   abortSignal: request.signal,
  });
  metrics.push({
   name: "ai",
   durationMs: performance.now() - aiStartedAt,
  });
  aiStatus = basicLookup.data ? "ok" : "failed";

  if (!basicLookup.data) {
   if (cachedWord) {
    const fallbackVocab = getBasicVocabData({
     id: cachedWord.id,
     hanzi: cachedWord.hanzi,
     pinyin: cachedWord.pinyin || getPinyin(lookupText),
     sino_vietnamese: cachedWord.sino_vietnamese || undefined,
     meaning: getPrimaryMeaning(
      getVocabularyAnalysis(cachedWord),
      cachedWord.meaning || "",
     ),
     ai_analysis: getVocabularyAnalysis(cachedWord),
    });

    if (hasUsableBasicData(fallbackVocab)) {
     source = "legacy_vocab_fallback";
     cached = true;
     return finalize(buildLookupResponse(fallbackVocab, true));
    }
   }

   source = "ai_basic_error";
   return finalize(
    NextResponse.json(
     {
      error:
       basicLookup.error ||
       "Không thể generate nghĩa cơ bản lúc này vì AI provider đang unavailable.",
     },
     { status: 503 },
    ),
   );
  }

  const basicVocab = getBasicVocabData({
   hanzi: lookupText,
   pinyin: basicLookup.data.pinyin || getPinyin(lookupText),
   sino_vietnamese:
    basicLookup.data.sino_vietnamese || basicLookup.data.han_viet || undefined,
   meaning: getPrimaryMeaning(
    basicLookup.data,
    basicLookup.data.meaning_summary || "",
   ),
   ai_analysis: basicLookup.data,
  });

  throwIfAborted(request.signal);

  const persistStartedAt = performance.now();
  const dictionaryEntry = await upsertDictionaryEntry(supabase, {
   headword: lookupText,
   pinyin: basicVocab.pinyin,
   sinoVietnamese: basicVocab.sino_vietnamese,
   meaning: basicVocab.meaning,
   ai_analysis: basicVocab.ai_analysis,
  });

  if (dictionaryEntry) {
   const mirrored = await syncDictionaryEntryToLegacyVocab(
    supabase,
    dictionaryEntry,
   );
   metrics.push({
    name: "persist",
    durationMs: performance.now() - persistStartedAt,
   });
   source = "ai_basic";
   return finalize(
    buildLookupResponse(
     {
      ...getBasicVocabData(mapDictionaryEntryToVocabData(dictionaryEntry)),
      id: mirrored?.id,
     },
     false,
    ),
   );
  }

  const mirrored = await upsertVocab(supabase, {
   hanzi: basicVocab.hanzi,
   pinyin: basicVocab.pinyin,
   sinoVietnamese: basicVocab.sino_vietnamese,
   meaning: basicVocab.meaning,
   ai_analysis: basicVocab.ai_analysis,
  });
  metrics.push({
   name: "persist",
   durationMs: performance.now() - persistStartedAt,
  });
  source = "ai_basic";

  return finalize(
   buildLookupResponse(
    {
     ...basicVocab,
     id: mirrored?.id,
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

  console.error("[lookup/basic] Unexpected error:", error);
  source = "error";
  if (aiStatus === "skipped") {
   aiStatus = "error";
  }

  return finalize(
   NextResponse.json(
    { error: "Lookup basic failed unexpectedly." },
    { status: 500 },
   ),
  );
 }
}
