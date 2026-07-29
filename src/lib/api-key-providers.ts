import { z } from "zod";

export const AUTO_API_KEY_PROVIDER = "auto";

export const ApiKeyProviderSchema = z.enum(["groq", "deepseek", "gemini", "openai"]);
export type ApiKeyProvider = z.infer<typeof ApiKeyProviderSchema>;

export const API_KEY_PROVIDER_OPTIONS: {
 value: ApiKeyProvider;
 label: string;
 description: string;
 placeholder: string;
 docsUrl: string;
 runtimeSupported: boolean;
}[] = [
 {
  value: "groq",
  label: "Groq",
  description: "Phân tích chi tiết từ và câu tốc độ cao bằng Groq BYOK.",
  placeholder: "gsk_...",
  docsUrl: "https://console.groq.com/keys",
  runtimeSupported: true,
 },
 {
  value: "deepseek",
  label: "DeepSeek",
  description: "Dùng model DeepSeek đã chọn cho lookup và phân tích.",
  placeholder: "sk-xxxxxxxxxxxxxxxx",
  docsUrl: "https://platform.deepseek.com/api_keys",
  runtimeSupported: true,
 },
 {
  value: "gemini",
  label: "Google Gemini",
  description: "Dùng cho Google AI Studio / Gemini API.",
  placeholder: "AIza...",
  docsUrl: "https://aistudio.google.com/app/apikey",
  runtimeSupported: true,
 },
 {
  value: "openai",
  label: "OpenAI / ChatGPT",
  description: "Dùng model OpenAI đã chọn cho lookup và phân tích.",
  placeholder: "sk-... hoặc sk-proj-...",
  docsUrl: "https://platform.openai.com/api-keys",
  runtimeSupported: true,
 },
];

export function getApiKeyProviderLabel(
 provider?: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>,
): string {
 return API_KEY_PROVIDER_OPTIONS.find((option) => option.value === provider)?.label || "Unknown";
}

export function getApiKeyProviderDocsUrl(provider: ApiKeyProvider): string {
 return API_KEY_PROVIDER_OPTIONS.find((option) => option.value === provider)?.docsUrl || "#";
}

export function getMaskedApiKey(apiKey: string): string {
 const trimmed = apiKey.trim();
 if (trimmed.length <= 8) {
  return `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`;
 }

 return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
}
