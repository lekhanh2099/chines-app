export const AUTO_API_KEY_PROVIDER = "auto";

export const API_KEY_PROVIDER_OPTIONS = [
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
] as const;

export type ApiKeyProvider = (typeof API_KEY_PROVIDER_OPTIONS)[number]["value"];

export function getApiKeyProviderLabel(provider?: string | null): string {
 return API_KEY_PROVIDER_OPTIONS.find((option) => option.value === provider)?.label || "Unknown";
}

export function isSupportedApiKeyProvider(provider?: string | null): provider is ApiKeyProvider {
 return API_KEY_PROVIDER_OPTIONS.some((option) => option.value === provider);
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
