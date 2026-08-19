import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getSentenceLookupPromptTemplate, getWordLookupPromptTemplate } from "@/lib/ai-prompts";
import { GeminiModelIdSchema, normalizeGeminiModel } from "@/lib/gemini-models";
import type { DbUserAiPromptSettings } from "@/types/database";
import type { Database } from "@/types/supabase.generated";

export type UserAiPromptSettings = z.infer<
 z.ZodObject<{
  wordLookupPrompt: z.ZodString;
  sentenceLookupPrompt: z.ZodString;
  geminiModel: typeof GeminiModelIdSchema;
 }>
>;
type PromptSettingsRow = {
 word_lookup_prompt: DbUserAiPromptSettings["word_lookup_prompt"];
 sentence_lookup_prompt: DbUserAiPromptSettings["sentence_lookup_prompt"];
 gemini_model: DbUserAiPromptSettings["gemini_model"];
};
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
type AppSupabaseClient = SupabaseClient<Database>;

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
