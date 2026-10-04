import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase.generated";
import { parseErrorLike, type ErrorInput } from "@/types/error";
import {
 normalizeProgressRows,
 vocabRowSchema,
 dictionaryRowSchema,
 buildSavedItems,
 type ProgressRow,
} from "./dictionary-srs-utils";

const PAGE_SIZE = 1000;
const RESOURCE_BATCH_SIZE = 200;

function isMissingTableError(code: ReturnType<typeof getErrorCode>) {
 return code === "42P01" || code === "PGRST205";
}

function getErrorCode(error: ErrorInput) {
 return parseErrorLike(error).code || undefined;
}

export async function getDictionarySrsCollection(
 supabase: SupabaseClient<Database>,
 userId: string,
) {
 const progressRows: ProgressRow[] = [];
 let missingSchema = false;

 for (let offset = 0; ; offset += PAGE_SIZE) {
  const progressResult = await supabase
   .from("user_vocab_progress")
   .select(
    "vocab_id, dictionary_id, proficiency_level, is_favorited, personal_note, personal_note_mode, updated_at",
   )
   .eq("user_id", userId)
   .eq("is_favorited", true)
   .order("updated_at", { ascending: false })
   .order("vocab_id")
   .range(offset, offset + PAGE_SIZE - 1);

  if (progressResult.error) {
   const code = getErrorCode(progressResult.error);
   if (offset > 0) throw progressResult.error;

   if (isMissingTableError(code)) {
    missingSchema = true;
    break;
   } else if (code === "42703" || code === "PGRST204") {
    for (let legacyOffset = 0; ; legacyOffset += PAGE_SIZE) {
     const fallbackResult = await supabase
      .from("user_vocab_progress")
      .select("vocab_id, proficiency_level, is_favorited")
      .eq("user_id", userId)
      .eq("is_favorited", true)
      .order("vocab_id")
      .range(legacyOffset, legacyOffset + PAGE_SIZE - 1);

     if (fallbackResult.error) {
      missingSchema = isMissingTableError(getErrorCode(fallbackResult.error));
      if (!missingSchema || legacyOffset > 0) throw fallbackResult.error;
      break;
     } else {
      const page = normalizeProgressRows(fallbackResult.data ?? [], true);
      progressRows.push(...page);
      if (page.length < PAGE_SIZE) break;
     }
    }
    break;
   } else {
    throw progressResult.error;
   }
  } else {
   const page = normalizeProgressRows(progressResult.data ?? [], false);
   progressRows.push(...page);
   if (page.length < PAGE_SIZE) break;
  }
 }

 const vocabIds = Array.from(new Set(progressRows.map((row) => row.vocab_id)));
 const dictionaryIds = Array.from(
  new Set(
   progressRows
    .map((row) => row.dictionary_id)
    .filter((dictionaryId): dictionaryId is string => Boolean(dictionaryId)),
  ),
 );

 const [vocabRows, dictionaryRows] = await Promise.all([
  (async () => {
   const rows: ReturnType<typeof vocabRowSchema.parse>[] = [];
   for (let start = 0; start < vocabIds.length; start += RESOURCE_BATCH_SIZE) {
    const result = await supabase
     .from("vocabularies")
     .select("id, hanzi, pinyin, sino_vietnamese, meaning")
     .in("id", vocabIds.slice(start, start + RESOURCE_BATCH_SIZE));
    if (result.error) throw result.error;
    rows.push(...vocabRowSchema.array().parse(result.data ?? []));
   }
   return rows;
  })(),
  (async () => {
   const rows: ReturnType<typeof dictionaryRowSchema.parse>[] = [];
   for (let start = 0; start < dictionaryIds.length; start += RESOURCE_BATCH_SIZE) {
    const result = await supabase
     .from("dictionary_core")
     .select("id, headword, pinyin, sino_vietnamese, ai_analysis")
     .in("id", dictionaryIds.slice(start, start + RESOURCE_BATCH_SIZE));
    if (result.error) throw result.error;
    rows.push(...dictionaryRowSchema.array().parse(result.data ?? []));
   }
   return rows;
  })(),
 ]);
 const savedItems = buildSavedItems({ progressRows, vocabRows, dictionaryRows });
 return { savedItems, missingSchema };
}
