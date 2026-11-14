import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase.generated";
import { z } from "zod";
import { PersonalNoteModeSchema } from "@/types/database";
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

export const saveDictionarySrsSchema = z.strictObject({
 hanzi: z.string().trim().min(1).max(32),
 contextSentence: z.string().max(10_000).optional(),
 contextTranslation: z.string().max(10_000).optional(),
 personalNote: z.string().max(10_000).optional(),
 personalNoteMode: PersonalNoteModeSchema.optional(),
});

const saveSrsResponseSchema = z.object({
 vocabId: z.string().min(1),
 dictionaryId: z.string().nullable(),
 contextSchemaAvailable: z.boolean(),
 noteSchemaAvailable: z.boolean(),
});

export class DictionarySrsApiError extends Error {
 constructor(
  message: string,
  readonly status: number,
 ) {
  super(message);
 }
}

export async function saveDictionarySrs(
 input: z.input<typeof saveDictionarySrsSchema>,
 ownerUserId: string,
) {
 const payload = saveDictionarySrsSchema.parse(input);
 const response = await fetch("/api/dictionary/srs", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-HanziHome-Owner-Id": ownerUserId },
  body: JSON.stringify(payload),
 });
 if (!response.ok)
  throw new DictionarySrsApiError("Không thể lưu từ vựng vào SRS.", response.status);
 const result = saveSrsResponseSchema.parse(await response.json());
 if (payload.personalNote?.trim() && !result.noteSchemaAvailable) {
  throw new DictionarySrsApiError("Database chưa có cột personal_note.", 409);
 }
 return result;
}

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
