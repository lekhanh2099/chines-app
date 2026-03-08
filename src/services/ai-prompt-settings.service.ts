import type { SupabaseClient } from "@supabase/supabase-js";
import {
 DEFAULT_SENTENCE_LOOKUP_PROMPT,
 DEFAULT_WORD_LOOKUP_PROMPT,
 getSentenceLookupPromptTemplate,
 getWordLookupPromptTemplate,
} from "@/lib/ai-prompts";
import {
 DEFAULT_GEMINI_MODEL,
 normalizeGeminiModel,
 type GeminiModelId,
} from "@/lib/gemini-models";
import type { DbUserAiPromptSettings } from "@/types/database";

export type UserAiPromptSettings = {
 wordLookupPrompt: string;
 sentenceLookupPrompt: string;
 geminiModel: GeminiModelId;
};

export const defaultUserAiPromptSettings: UserAiPromptSettings = {
 wordLookupPrompt: DEFAULT_WORD_LOOKUP_PROMPT,
 sentenceLookupPrompt: DEFAULT_SENTENCE_LOOKUP_PROMPT,
 geminiModel: DEFAULT_GEMINI_MODEL,
};

function normalizeRow(
 row?: Partial<DbUserAiPromptSettings> | null,
): UserAiPromptSettings {
 return {
  wordLookupPrompt: getWordLookupPromptTemplate(row?.word_lookup_prompt),
  sentenceLookupPrompt: getSentenceLookupPromptTemplate(
   row?.sentence_lookup_prompt,
  ),
  geminiModel: normalizeGeminiModel(row?.gemini_model),
 };
}

export async function getUserAiPromptSettings(
 supabase: SupabaseClient,
 userId: string,
): Promise<UserAiPromptSettings> {
 const { data } = await supabase
  .from("user_ai_prompt_settings")
  .select("word_lookup_prompt, sentence_lookup_prompt, gemini_model")
  .eq("user_id", userId)
  .maybeSingle();

 return normalizeRow(data as Partial<DbUserAiPromptSettings> | null);
}

export type UpsertPromptSettingsInput = {
 wordLookupPrompt: string;
 sentenceLookupPrompt: string;
 geminiModel: GeminiModelId;
};

export async function upsertUserAiPromptSettings(
 supabase: SupabaseClient,
 userId: string,
 settings: UpsertPromptSettingsInput,
): Promise<UserAiPromptSettings | null> {
 const payload = {
  user_id: userId,
  word_lookup_prompt: getWordLookupPromptTemplate(settings.wordLookupPrompt),
  sentence_lookup_prompt: getSentenceLookupPromptTemplate(
   settings.sentenceLookupPrompt,
  ),
  gemini_model: normalizeGeminiModel(settings.geminiModel),
  updated_at: new Date().toISOString(),
 };

 const { data, error } = await supabase
  .from("user_ai_prompt_settings")
  .upsert(payload, { onConflict: "user_id" })
  .select("word_lookup_prompt, sentence_lookup_prompt, gemini_model")
  .single();

 if (error) {
  console.error("[AiPromptSettings] upsert error:", error);
  return null;
 }

 return normalizeRow(data as Partial<DbUserAiPromptSettings> | null);
}
