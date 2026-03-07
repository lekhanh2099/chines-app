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
import { decryptApiKey, encryptApiKey } from "@/lib/encryption";
import type { DbUserAiPromptSettings } from "@/types/database";

export type UserAiPromptSettings = {
 wordLookupPrompt: string;
 sentenceLookupPrompt: string;
 geminiModel: GeminiModelId;
 deepseekEnabled: boolean;
 /** Only present when reading — never sent to client with full key */
 deepseekApiKeySet: boolean;
};

export const defaultUserAiPromptSettings: UserAiPromptSettings = {
 wordLookupPrompt: DEFAULT_WORD_LOOKUP_PROMPT,
 sentenceLookupPrompt: DEFAULT_SENTENCE_LOOKUP_PROMPT,
 geminiModel: DEFAULT_GEMINI_MODEL,
 deepseekEnabled: false,
 deepseekApiKeySet: false,
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
  deepseekEnabled: row?.deepseek_enabled ?? false,
  deepseekApiKeySet: !!row?.deepseek_api_key_encrypted,
 };
}

export async function getUserAiPromptSettings(
 supabase: SupabaseClient,
 userId: string,
): Promise<UserAiPromptSettings> {
 const { data } = await supabase
  .from("user_ai_prompt_settings")
  .select(
   "word_lookup_prompt, sentence_lookup_prompt, gemini_model, deepseek_enabled, deepseek_api_key_encrypted",
  )
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
  .select(
   "word_lookup_prompt, sentence_lookup_prompt, gemini_model, deepseek_enabled, deepseek_api_key_encrypted",
  )
  .single();

 if (error) {
  console.error("[AiPromptSettings] upsert error:", error);
  return null;
 }

 return normalizeRow(data as Partial<DbUserAiPromptSettings> | null);
}

/* ══════════════════════════════════════════
   BYOK — DeepSeek Key Management
   ══════════════════════════════════════════ */

export async function saveDeepSeekKey(
 supabase: SupabaseClient,
 userId: string,
 apiKey: string,
): Promise<{ success: boolean; error?: string }> {
 const encrypted = encryptApiKey(apiKey);

 const { error } = await supabase.from("user_ai_prompt_settings").upsert(
  {
   user_id: userId,
   deepseek_api_key_encrypted: encrypted,
   deepseek_enabled: true,
   word_lookup_prompt: DEFAULT_WORD_LOOKUP_PROMPT,
   sentence_lookup_prompt: DEFAULT_SENTENCE_LOOKUP_PROMPT,
   gemini_model: DEFAULT_GEMINI_MODEL,
   updated_at: new Date().toISOString(),
  },
  { onConflict: "user_id" },
 );

 if (error) {
  console.error("[BYOK] save key error:", error);
  return { success: false, error: "Không lưu được API key." };
 }

 // Also update just the key and enabled columns for existing rows
 await supabase
  .from("user_ai_prompt_settings")
  .update({
   deepseek_api_key_encrypted: encrypted,
   deepseek_enabled: true,
   updated_at: new Date().toISOString(),
  })
  .eq("user_id", userId);

 return { success: true };
}

export async function getDecryptedDeepSeekKey(
 supabase: SupabaseClient,
 userId: string,
): Promise<string | null> {
 const { data } = await supabase
  .from("user_ai_prompt_settings")
  .select("deepseek_api_key_encrypted, deepseek_enabled")
  .eq("user_id", userId)
  .maybeSingle();

 if (!data?.deepseek_api_key_encrypted || !data?.deepseek_enabled) {
  return null;
 }

 try {
  return decryptApiKey(data.deepseek_api_key_encrypted);
 } catch (err) {
  console.error("[BYOK] decrypt failed:", err);
  return null;
 }
}

export async function removeDeepSeekKey(
 supabase: SupabaseClient,
 userId: string,
): Promise<{ success: boolean }> {
 const { error } = await supabase
  .from("user_ai_prompt_settings")
  .update({
   deepseek_api_key_encrypted: null,
   deepseek_enabled: false,
   updated_at: new Date().toISOString(),
  })
  .eq("user_id", userId);

 if (error) {
  console.error("[BYOK] remove key error:", error);
  return { success: false };
 }

 return { success: true };
}

export async function toggleDeepSeekEnabled(
 supabase: SupabaseClient,
 userId: string,
 enabled: boolean,
): Promise<{ success: boolean }> {
 const { error } = await supabase
  .from("user_ai_prompt_settings")
  .update({
   deepseek_enabled: enabled,
   updated_at: new Date().toISOString(),
  })
  .eq("user_id", userId);

 if (error) {
  console.error("[BYOK] toggle error:", error);
  return { success: false };
 }

 return { success: true };
}
