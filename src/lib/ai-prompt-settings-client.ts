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

const AI_PROMPT_SETTINGS_STORAGE_KEY = "ai-prompt-settings";

export type ClientAiPromptSettings = {
 wordLookupPrompt: string;
 sentenceLookupPrompt: string;
 geminiModel: GeminiModelId;
 deepseekEnabled: boolean;
 deepseekApiKeySet: boolean;
};

export const defaultClientAiPromptSettings: ClientAiPromptSettings = {
 wordLookupPrompt: DEFAULT_WORD_LOOKUP_PROMPT,
 sentenceLookupPrompt: DEFAULT_SENTENCE_LOOKUP_PROMPT,
 geminiModel: DEFAULT_GEMINI_MODEL,
 deepseekEnabled: false,
 deepseekApiKeySet: false,
};

function normalizeSettings(
 settings?: Partial<ClientAiPromptSettings> | null,
): ClientAiPromptSettings {
 return {
  wordLookupPrompt: getWordLookupPromptTemplate(settings?.wordLookupPrompt),
  sentenceLookupPrompt: getSentenceLookupPromptTemplate(
   settings?.sentenceLookupPrompt,
  ),
  geminiModel: normalizeGeminiModel(settings?.geminiModel),
  deepseekEnabled: settings?.deepseekEnabled ?? false,
  deepseekApiKeySet: settings?.deepseekApiKeySet ?? false,
 };
}

export function loadClientAiPromptSettings(): ClientAiPromptSettings {
 if (typeof window === "undefined") {
  return defaultClientAiPromptSettings;
 }

 try {
  const raw = window.localStorage.getItem(AI_PROMPT_SETTINGS_STORAGE_KEY);
  if (!raw) {
   return defaultClientAiPromptSettings;
  }

  return normalizeSettings(JSON.parse(raw) as Partial<ClientAiPromptSettings>);
 } catch {
  return defaultClientAiPromptSettings;
 }
}

export function saveClientAiPromptSettings(
 settings: ClientAiPromptSettings,
): ClientAiPromptSettings {
 const normalized = normalizeSettings(settings);

 if (typeof window !== "undefined") {
  window.localStorage.setItem(
   AI_PROMPT_SETTINGS_STORAGE_KEY,
   JSON.stringify(normalized),
  );
 }

 return normalized;
}

function hashString(input: string): string {
 let hash = 5381;

 for (let index = 0; index < input.length; index += 1) {
  hash = (hash * 33) ^ input.charCodeAt(index);
 }

 return (hash >>> 0).toString(36);
}

export function getClientAiPromptSettingsFingerprint(
 settings: ClientAiPromptSettings,
): string {
 return hashString(
  [
   settings.geminiModel,
   settings.wordLookupPrompt,
   settings.sentenceLookupPrompt,
  ].join("||"),
 );
}
