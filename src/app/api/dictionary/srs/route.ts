import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import { saveCanonicalDictionaryEntryToSrsAsServer } from "@/features/dictionary/server/dictionary-persistence.server";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
 verifyExpectedAuthenticatedOwner,
} from "@/lib/api/authenticated-route";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";
import { resolveAiAnalysisRuntime } from "@/services/ai-analysis-runtime.service";
import { analyzeHanziBasicDetailed } from "@/services/ai.service";
import {
 getDictionaryEntryByHeadword,
 getPrimaryMeaning,
 getVocabByHanzi,
 getVocabularyAnalysis,
 normalizeDictionaryHeadword,
 upsertDictionaryEntry,
} from "@/services/vocab.service";
import { PersonalNoteModeSchema } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const saveDictionarySrsSchema = z.strictObject({
 hanzi: z.string().trim().min(1).max(32),
 contextSentence: z.string().max(10_000).optional(),
 contextTranslation: z.string().max(10_000).optional(),
 personalNote: z.string().max(10_000).optional(),
 personalNoteMode: PersonalNoteModeSchema.optional(),
});

function runtimeError(status: "missing-key" | "storage-unavailable") {
 return status === "missing-key"
  ? apiError(
     "No active AI API key is available to resolve this dictionary entry.",
     409,
     "AI_KEY_REQUIRED",
    )
  : apiError("The server-side API key store is unavailable.", 503, "AI_KEY_STORAGE_UNAVAILABLE");
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const ownerError = verifyExpectedAuthenticatedOwner(request, auth.context);
 if (ownerError) return ownerError;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = saveDictionarySrsSchema.safeParse(body);
 if (!parsed.success) {
  return apiError("Invalid dictionary SRS payload", 400, "INVALID_PAYLOAD");
 }

 const lookupKey = normalizeDictionaryHeadword(parsed.data.hanzi);
 const authority = createServiceRoleSupabaseClient();
 let dictionaryEntry = await getDictionaryEntryByHeadword(authority, lookupKey);

 // A trusted legacy cache row may predate dictionary_core. Canonicalize from
 // server-read data only; never promote meaning/analysis supplied by the browser.
 if (!dictionaryEntry) {
  const legacy = await getVocabByHanzi(authority, lookupKey);
  if (legacy) {
   dictionaryEntry = await upsertDictionaryEntry(authority, {
    headword: legacy.hanzi,
    pinyin: legacy.pinyin ?? undefined,
    sinoVietnamese: legacy.sino_vietnamese ?? undefined,
    meaning: legacy.meaning ?? "",
    ai_analysis: getVocabularyAnalysis(legacy),
   });
  }
 }

 // If the learner saves a brand-new lookup whose deep/custom analysis has not
 // produced canonical content, resolve only the fixed basic lexicography prompt
 // here. Custom prompt output is never promoted into the shared dictionary.
 if (!dictionaryEntry) {
  const runtime = await resolveAiAnalysisRuntime({
   supabase: auth.context.supabase,
   userId: auth.context.user.id,
  });
  if (!runtime.ok) return runtimeError(runtime.status);

  const basicLookup = await analyzeHanziBasicDetailed(lookupKey, {
   userApiKeys: [runtime.credential],
   allowGroq: true,
  });
  if (!basicLookup.data) {
   return apiError(
    "Could not resolve a trusted basic dictionary entry.",
    503,
    "DICTIONARY_CANONICAL_RESOLUTION_FAILED",
   );
  }

  dictionaryEntry = await upsertDictionaryEntry(authority, {
   headword: lookupKey,
   pinyin: basicLookup.data.pinyin,
   sinoVietnamese: basicLookup.data.sino_vietnamese || basicLookup.data.han_viet,
   meaning: getPrimaryMeaning(basicLookup.data, basicLookup.data.meaning_summary || ""),
   ai_analysis: basicLookup.data,
  });
 }

 if (!dictionaryEntry) {
  return apiError(
   "Dictionary entry could not be canonicalized.",
   503,
   "DICTIONARY_ENTRY_NOT_READY",
  );
 }

 const saved = await saveCanonicalDictionaryEntryToSrsAsServer({
  authority,
  userId: auth.context.user.id,
  entry: dictionaryEntry,
  options: {
   contextSentence: parsed.data.contextSentence,
   contextTranslation: parsed.data.contextTranslation,
   personalNote: parsed.data.personalNote,
   personalNoteMode: parsed.data.personalNoteMode,
  },
 });

 if (!saved) {
  return apiError("Could not save vocabulary to SRS", 503, "VOCAB_SRS_SAVE_FAILED");
 }

 return privateNoStoreJson(saved);
}
