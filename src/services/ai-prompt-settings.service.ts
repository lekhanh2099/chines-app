import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
 DEFAULT_SENTENCE_LOOKUP_PROMPT,
 DEFAULT_WORD_LOOKUP_PROMPT,
 getSentenceLookupPromptTemplate,
 getWordLookupPromptTemplate,
} from "@/lib/ai-prompts";
import {
 DEFAULT_GEMINI_MODEL,
 GeminiModelIdSchema,
 normalizeGeminiModel,
} from "@/lib/gemini-models";
import type { DbUserAiPromptSettings } from "@/types/database";
import type { Database } from "@/types/supabase.generated";

const UserAiPromptSettingsSchema = z.object({
 wordLookupPrompt: z.string(),
 sentenceLookupPrompt: z.string(),
 geminiModel: GeminiModelIdSchema,
});
export type UserAiPromptSettings = z.infer<typeof UserAiPromptSettingsSchema>;
type PromptSettingsRow = {
 word_lookup_prompt: DbUserAiPromptSettings["word_lookup_prompt"];
 sentence_lookup_prompt: DbUserAiPromptSettings["sentence_lookup_prompt"];
 gemini_model: DbUserAiPromptSettings["gemini_model"];
};
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
type AppSupabaseClient = SupabaseClient<Database>;

export const defaultUserAiPromptSettings: UserAiPromptSettings = {
 wordLookupPrompt: DEFAULT_WORD_LOOKUP_PROMPT,
 sentenceLookupPrompt: DEFAULT_SENTENCE_LOOKUP_PROMPT,
 geminiModel: DEFAULT_GEMINI_MODEL,
};

function normalizeRow(row: Nullable<PromptSettingsRow>): UserAiPromptSettings {
 return {
  wordLookupPrompt: getWordLookupPromptTemplate(row?.word_lookup_prompt),
  sentenceLookupPrompt: getSentenceLookupPromptTemplate(row?.sentence_lookup_prompt),
  geminiModel: normalizeGeminiModel(row?.gemini_model),
 };
}

export async function getUserAiPromptSettings(
 supabase: AppSupabaseClient,
 userId: string,
): Promise<UserAiPromptSettings> {
 const { data } = await supabase
  .from("user_ai_prompt_settings")
  .select("word_lookup_prompt, sentence_lookup_prompt, gemini_model")
  .eq("user_id", userId)
  .maybeSingle();

 return normalizeRow(data);
}

export type UpsertPromptSettingsInput = UserAiPromptSettings;

export async function upsertUserAiPromptSettings(
 supabase: AppSupabaseClient,
 userId: string,
 settings: UpsertPromptSettingsInput,
): Promise<Nullable<UserAiPromptSettings>> {
 const payload = {
  user_id: userId,
  word_lookup_prompt: getWordLookupPromptTemplate(settings.wordLookupPrompt),
  sentence_lookup_prompt: getSentenceLookupPromptTemplate(settings.sentenceLookupPrompt),
  gemini_model: normalizeGeminiModel(settings.geminiModel),
  updated_at: new Date().toISOString(),
 };

 const { data, error } = await supabase
  .from("user_ai_prompt_settings")
  .upsert(payload, { onConflict: "user_id" })
  .select("word_lookup_prompt, sentence_lookup_prompt, gemini_model")
  .single();

 if (error) {
  logger.error("[AiPromptSettings] upsert error:", error);
  return null;
 }

 return normalizeRow(data);
}
