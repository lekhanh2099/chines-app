import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mapDictionaryEntryToVocabData } from "@/services/vocab.service";
import type { DbDictionaryCore, PersonalNoteMode, VocabData } from "@/types/database";
import type { Database } from "@/types/supabase.generated";

type AuthorityClient = SupabaseClient<Database>;
type DictionaryEntry = DbDictionaryCore;

export type ServerSrsSaveResult = {
 vocabId: string;
 dictionaryId: string;
 contextSchemaAvailable: true;
 noteSchemaAvailable: true;
};

/**
 * Direct service-role write for the shared legacy cache.
 *
 * This deliberately does not call the historical SECURITY DEFINER RPC: browser
 * execution of that RPC is being revoked, and server authority can write the
 * cache table directly without depending on auth.uid() semantics.
 */
export async function upsertLegacyVocabularyCacheAsServer(
 authority: AuthorityClient,
 vocabData: VocabData,
): Promise<{ id: string } | null> {
 const analysis = vocabData.ai_analysis ?? {};
 const { data, error } = await authority
  .from("vocabularies")
  .upsert(
   {
    hanzi: vocabData.hanzi.trim(),
    pinyin: vocabData.pinyin?.trim() || null,
    sino_vietnamese: vocabData.sino_vietnamese?.trim() || null,
    meaning: vocabData.meaning?.trim() || null,
    analysis,
    ai_analysis: analysis,
   },
   { onConflict: "hanzi" },
  )
  .select("id")
  .single();

 if (error || !data) return null;
 return { id: data.id };
}

export async function syncDictionaryEntryToLegacyCacheAsServer(
 authority: AuthorityClient,
 entry: DictionaryEntry,
) {
 return upsertLegacyVocabularyCacheAsServer(authority, mapDictionaryEntryToVocabData(entry));
}

/**
 * Persist only user-owned SRS state using identities resolved from a canonical
 * dictionary row already read/created on the server. Browser-provided meaning,
 * pinyin and AI analysis never enter this write path.
 *
 * Optional context/note fields preserve their existing values when a caller
 * omits them. This prevents a plain "save to SRS" action from erasing a note or
 * reading context written by an earlier, richer save flow.
 */
export async function saveCanonicalDictionaryEntryToSrsAsServer({
 authority,
 userId,
 entry,
 options,
}: {
 authority: AuthorityClient;
 userId: string;
 entry: DictionaryEntry;
 options?: {
  contextSentence?: string;
  contextTranslation?: string;
  personalNote?: string;
  personalNoteMode?: PersonalNoteMode;
 };
}): Promise<ServerSrsSaveResult | null> {
 const vocab = await syncDictionaryEntryToLegacyCacheAsServer(authority, entry);
 if (!vocab) return null;

 const relation = await authority.from("user_vocabularies").upsert(
  {
   user_id: userId,
   dictionary_id: entry.id,
  },
  { onConflict: "user_id,dictionary_id", ignoreDuplicates: true },
 );
 if (relation.error) return null;

 const existingProgressResult = await authority
  .from("user_vocab_progress")
  .select("context_sentence, context_translation, personal_note, personal_note_mode")
  .eq("user_id", userId)
  .eq("vocab_id", vocab.id)
  .maybeSingle();
 if (existingProgressResult.error) return null;

 const existingProgress = existingProgressResult.data;
 const progress = await authority.from("user_vocab_progress").upsert(
  {
   user_id: userId,
   vocab_id: vocab.id,
   dictionary_id: entry.id,
   is_favorited: true,
   context_sentence:
    options?.contextSentence !== undefined
     ? options.contextSentence
     : (existingProgress?.context_sentence ?? null),
   context_translation:
    options?.contextTranslation !== undefined
     ? options.contextTranslation
     : (existingProgress?.context_translation ?? null),
   personal_note:
    options?.personalNote !== undefined
     ? options.personalNote.trim() || null
     : (existingProgress?.personal_note ?? null),
   personal_note_mode:
    options?.personalNoteMode !== undefined
     ? options.personalNoteMode
     : (existingProgress?.personal_note_mode ?? null),
  },
  { onConflict: "user_id,vocab_id" },
 );
 if (progress.error) return null;

 return {
  vocabId: vocab.id,
  dictionaryId: entry.id,
  contextSchemaAvailable: true,
  noteSchemaAvailable: true,
 };
}
