import type { JsonFieldValue } from "@/types/json";
import { NextRequest, NextResponse } from "next/server";
import { pinyin as getPinyin } from "pinyin-pro";
import { z } from "zod";
import {
 syncDictionaryEntryToLegacyCacheAsServer,
 upsertLegacyVocabularyCacheAsServer,
} from "@/features/dictionary/server/dictionary-persistence.server";
import {
 applyServerTimingHeaders,
 isAbortError,
 throwIfAborted,
 type ServerTimingMetric,
} from "@/lib/request-utils";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";
import { logger } from "@/lib/logger";
import { resolveAiAnalysisRuntime } from "@/services/ai-analysis-runtime.service";
import { analyzeHanziBasicDetailed } from "@/services/ai.service";
import {
 getBasicVocabData,
 getDictionaryEntryByHeadword,
 getPrimaryMeaning,
 getVocabularyAnalysis,
 getVocabByHanzi,
 mapDictionaryEntryToVocabData,
 normalizeDictionaryHeadword,
 upsertDictionaryEntry,
} from "@/services/vocab.service";
import type { VocabData } from "@/types/database";

const basicLookupSchema = z.object({
 text: z.string().trim().min(1).max(120),
 lessonId: z.string().trim().min(1).max(200).optional(),
});
const maxCanonicalHeadwordLength = 32;

function roundMs(value: number): number {
 return Math.round(value * 100) / 100;
}

function buildLookupResponse(vocabData: VocabData, cached: boolean, source: string) {
 return NextResponse.json({
  cached,
  source,
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

function hasUsableBasicMeaning(
 vocabData: ReturnType<typeof getBasicVocabData>,
): vocabData is VocabData {
 return !!vocabData?.meaning.trim();
}

function runtimeError(status: "missing-key" | "storage-unavailable") {
 return status === "missing-key"
  ? NextResponse.json(
     { error: "Chưa có API key AI đang hoạt động. Hãy thêm key trong Cài đặt → AI." },
     { status: 409 },
    )
  : NextResponse.json({ error: "Kho API key an toàn phía server chưa sẵn sàng." }, { status: 503 });
}

export async function POST(request: NextRequest) {
 const startedAt = performance.now();
 const metrics: ServerTimingMetric[] = [];
 let lookupText = "";
 let source = "unknown";
 let cached = false;
 let aiStatus = "skipped";

 const finalize = (response: NextResponse) => {
  const totalMs = performance.now() - startedAt;
  applyServerTimingHeaders(response.headers, [...metrics, { name: "total", durationMs: totalMs }], {
   "x-lookup-route": "basic",
   "x-lookup-source": source,
   "x-lookup-cache": cached ? "hit" : "miss",
   "x-lookup-ai-status": aiStatus,
  });

  logger.info(
   "[lookup/basic]",
   JSON.stringify({
    lookupText,
    source,
    cached,
    aiStatus,
    aborted: request.signal.aborted,
    totalMs: roundMs(totalMs),
   }),
  );

  return response;
 };

 try {
  const supabase = await createClient();
  const {
   data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
   source = "unauthorized";
   return finalize(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const payload: JsonFieldValue = await request.json();
  const parsed = basicLookupSchema.safeParse(payload);

  if (!parsed.success) {
   source = "invalid";
   return finalize(NextResponse.json({ error: "Invalid basic lookup payload" }, { status: 400 }));
  }

  lookupText = normalizeDictionaryHeadword(parsed.data.text);
  const canPersistCanonical = lookupText.length <= maxCanonicalHeadwordLength;

  const cacheStartedAt = performance.now();
  if (parsed.data.lessonId) {
   const { data: lessonVocab, error: lessonVocabError } = await supabase
    .from("hanzihome_vocab_items")
    .select("id, word, pinyin, han_viet, meaning")
    .eq("lesson_id", parsed.data.lessonId)
    .eq("word", lookupText)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

   if (lessonVocabError) {
    logger.warn("[lookup/basic] lesson vocabulary lookup failed", lessonVocabError);
   } else if (lessonVocab) {
    metrics.push({ name: "lesson_vocab", durationMs: performance.now() - cacheStartedAt });
    source = "lesson_vocab";
    cached = true;
    return finalize(
     buildLookupResponse(
      getBasicVocabData({
       id: lessonVocab.id,
       hanzi: lessonVocab.word,
       pinyin: lessonVocab.pinyin,
       sino_vietnamese: lessonVocab.han_viet || undefined,
       meaning: lessonVocab.meaning,
       ai_analysis: {},
      }),
      true,
      source,
     ),
    );
   }
  }

  const cachedDictionary = await getDictionaryEntryByHeadword(supabase, lookupText);

  if (cachedDictionary) {
   const cachedDictionaryVocab = getBasicVocabData(mapDictionaryEntryToVocabData(cachedDictionary));
   metrics.push({
    name: "cache",
    durationMs: performance.now() - cacheStartedAt,
   });
   if (hasUsableBasicMeaning(cachedDictionaryVocab)) {
    source = "dictionary_core";
    cached = true;
    return finalize(buildLookupResponse(cachedDictionaryVocab, true, source));
   }
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
    meaning: getPrimaryMeaning(getVocabularyAnalysis(cachedWord), cachedWord.meaning || ""),
    ai_analysis: getVocabularyAnalysis(cachedWord),
   });

   if (hasUsableBasicMeaning(cachedVocab)) {
    source = "legacy_vocab";
    cached = true;
    return finalize(buildLookupResponse(cachedVocab, true, source));
   }
  }

  throwIfAborted(request.signal);

  const aiStartedAt = performance.now();
  aiStatus = "runtime";
  const runtime = await resolveAiAnalysisRuntime({ supabase, userId: user.id });
  if (!runtime.ok) {
   source = "ai_runtime_unavailable";
   aiStatus = runtime.status;
   return finalize(runtimeError(runtime.status));
  }

  throwIfAborted(request.signal);
  aiStatus = "running";
  const basicLookup = await analyzeHanziBasicDetailed(lookupText, {
   userApiKeys: [runtime.credential],
   allowGroq: true,
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
     meaning: getPrimaryMeaning(getVocabularyAnalysis(cachedWord), cachedWord.meaning || ""),
     ai_analysis: getVocabularyAnalysis(cachedWord),
    });

    if (hasUsableBasicMeaning(fallbackVocab)) {
     source = "legacy_vocab_fallback";
     cached = true;
     return finalize(buildLookupResponse(fallbackVocab, true, source));
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
   sino_vietnamese: basicLookup.data.sino_vietnamese || basicLookup.data.han_viet || undefined,
   meaning: getPrimaryMeaning(basicLookup.data, basicLookup.data.meaning_summary || ""),
   ai_analysis: basicLookup.data,
  });

  throwIfAborted(request.signal);

  // Long selections are Reader/selection content, not canonical dictionary
  // headwords. They can receive a transient basic explanation but cannot create
  // shared dictionary/cache rows.
  if (!canPersistCanonical) {
   source = "ai_basic_transient";
   return finalize(buildLookupResponse(basicVocab, false, source));
  }

  // Shared dictionary/cache rows are server-owned and only the fixed basic
  // lexicography prompt is eligible for canonicalization.
  const canonicalSupabase = createServiceRoleSupabaseClient();
  const dictionaryEntry = await upsertDictionaryEntry(canonicalSupabase, {
   headword: lookupText,
   pinyin: basicVocab.pinyin,
   sinoVietnamese: basicVocab.sino_vietnamese,
   meaning: basicVocab.meaning,
   ai_analysis: basicVocab.ai_analysis,
  });

  const legacyVocab = dictionaryEntry
   ? await syncDictionaryEntryToLegacyCacheAsServer(canonicalSupabase, dictionaryEntry)
   : await upsertLegacyVocabularyCacheAsServer(canonicalSupabase, basicVocab);

  const persistedBasicVocab: VocabData = {
   ...basicVocab,
   id: legacyVocab?.id,
   dictionary_id: dictionaryEntry?.id,
  };

  source = "ai_basic";
  return finalize(buildLookupResponse(persistedBasicVocab, false, source));
 } catch (error) {
  if (isAbortError(error) || request.signal.aborted) {
   source = "aborted";
   aiStatus = "aborted";
   return finalize(new NextResponse(null, { status: 499 }));
  }

  logger.error("[lookup/basic] Unexpected error:", error);
  source = "error";
  if (aiStatus === "skipped") {
   aiStatus = "error";
  }

  return finalize(
   NextResponse.json({ error: "Lookup basic failed unexpectedly." }, { status: 500 }),
  );
 }
}
