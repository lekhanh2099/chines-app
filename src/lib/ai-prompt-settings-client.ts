import {
 DEFAULT_SENTENCE_LOOKUP_PROMPT,
 DEFAULT_WORD_LOOKUP_PROMPT,
 getSentenceLookupPromptTemplate,
 getWordLookupPromptTemplate,
} from "@/lib/ai-prompts";
import {
 DEFAULT_GEMINI_MODEL,
 GEMINI_TEXT_MODEL_OPTIONS,
 normalizeGeminiModel,
 type GeminiModelId,
} from "@/lib/gemini-models";
import {
 getBrowserStorage,
 readVersionedStorage,
 writeVersionedStorage,
} from "@/lib/versioned-storage";
import { z } from "zod";

const AI_PROMPT_SETTINGS_STORAGE_KEY = "ai-prompt-settings";
const AI_PROMPT_SETTINGS_STORAGE_VERSION = 1;

export type ClientAiPromptSettings = {
 wordLookupPrompt: string;
 sentenceLookupPrompt: string;
 geminiModel: GeminiModelId;
};

export const defaultClientAiPromptSettings: ClientAiPromptSettings = {
 wordLookupPrompt: DEFAULT_WORD_LOOKUP_PROMPT,
 sentenceLookupPrompt: DEFAULT_SENTENCE_LOOKUP_PROMPT,
 geminiModel: DEFAULT_GEMINI_MODEL,
};

const clientAiPromptSettingsSchema = z.object({
 wordLookupPrompt: z.string(),
 sentenceLookupPrompt: z.string(),
 geminiModel: z.enum(GEMINI_TEXT_MODEL_OPTIONS.map((option) => option.value)),
});

const aiPromptSettingsStorageConfig = {
 key: AI_PROMPT_SETTINGS_STORAGE_KEY,
 version: AI_PROMPT_SETTINGS_STORAGE_VERSION,
 schema: clientAiPromptSettingsSchema,
 fallback: defaultClientAiPromptSettings,
 migrateLegacy: (value: unknown) => {
  const legacy = z
   .object({
    wordLookupPrompt: z.string().optional(),
    sentenceLookupPrompt: z.string().optional(),
    geminiModel: z.string().optional(),
   })
   .safeParse(value);
  return legacy.success ? normalizeSettings(legacy.data) : null;
 },
};

function normalizeSettings(
 settings?: {
  wordLookupPrompt?: string;
  sentenceLookupPrompt?: string;
  geminiModel?: string;
 } | null,
): ClientAiPromptSettings {
 return {
  wordLookupPrompt: getWordLookupPromptTemplate(settings?.wordLookupPrompt),
  sentenceLookupPrompt: getSentenceLookupPromptTemplate(settings?.sentenceLookupPrompt),
  geminiModel: normalizeGeminiModel(settings?.geminiModel),
 };
}

export function loadClientAiPromptSettings(): ClientAiPromptSettings {
 return readVersionedStorage(getBrowserStorage(), aiPromptSettingsStorageConfig);
}

export function saveClientAiPromptSettings(
 settings: ClientAiPromptSettings,
): ClientAiPromptSettings {
 const normalized = normalizeSettings(settings);

 writeVersionedStorage(getBrowserStorage(), aiPromptSettingsStorageConfig, normalized);

 return normalized;
}

function hashString(input: string): string {
 let hash = 5381;

 for (let index = 0; index < input.length; index += 1) {
  hash = (hash * 33) ^ input.charCodeAt(index);
 }

 return (hash >>> 0).toString(36);
}

export function getClientAiPromptSettingsFingerprint(settings: ClientAiPromptSettings): string {
 return hashString(
  [settings.geminiModel, settings.wordLookupPrompt, settings.sentenceLookupPrompt].join("||"),
 );
}
