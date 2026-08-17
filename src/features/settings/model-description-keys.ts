import type { ApiKeyProvider } from "@/lib/api-key-providers";

export function getApiKeyProviderDescriptionKey(provider: ApiKeyProvider) {
 switch (provider) {
  case "groq":
   return "apiKeys.providers.groq";
  case "deepseek":
   return "apiKeys.providers.deepseek";
  case "gemini":
   return "apiKeys.providers.gemini";
  case "openai":
   return "apiKeys.providers.openai";
 }
}

export function getApiKeyModelDescriptionKey(provider: ApiKeyProvider, model?: string | null) {
 switch (provider) {
  case "groq":
   switch (model) {
    case "openai/gpt-oss-20b":
     return "apiKeys.models.gptOss20b";
    case "openai/gpt-oss-120b":
     return "apiKeys.models.gptOss120b";
    case "qwen/qwen3.6-27b":
     return "apiKeys.models.qwen36";
    default:
     return "apiKeys.models.legacy";
   }
  case "deepseek":
   switch (model) {
    case "deepseek-v4-flash":
     return "apiKeys.models.deepseekFlash";
    case "deepseek-v4-pro":
     return "apiKeys.models.deepseekPro";
    default:
     return "apiKeys.models.legacy";
   }
  case "gemini":
   switch (model) {
    case "models/gemini-3.5-flash":
     return "apiKeys.models.gemini35Flash";
    case "models/gemini-3.1-pro-preview":
     return "apiKeys.models.gemini31Pro";
    case "models/gemini-2.5-flash":
     return "apiKeys.models.gemini25Flash";
    case "models/gemini-2.5-pro":
     return "apiKeys.models.gemini25Pro";
    default:
     return "apiKeys.models.legacy";
   }
  case "openai":
   switch (model) {
    case "gpt-5-mini":
     return "apiKeys.models.gpt5Mini";
    case "gpt-5-nano":
     return "apiKeys.models.gpt5Nano";
    case "gpt-4.1-mini":
     return "apiKeys.models.gpt41Mini";
    case "gpt-4.1-nano":
     return "apiKeys.models.gpt41Nano";
    default:
     return "apiKeys.models.legacy";
   }
 }
}
