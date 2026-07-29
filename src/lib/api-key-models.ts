import type { ApiKeyProvider } from "@/lib/api-key-providers";
import { GEMINI_DETAIL_MODEL_OPTIONS } from "@/lib/gemini-models";
import { z } from "zod";

export type ApiKeyModelOption = {
 value: string;
 label: string;
 description: string;
};

export const API_KEY_MODEL_OPTIONS: Record<ApiKeyProvider, readonly ApiKeyModelOption[]> = {
 groq: [
  {
   value: "openai/gpt-oss-20b",
   label: "GPT OSS 20B",
   description: "Nhanh cho lookup ngắn; có quota Groq Free Plan.",
  },
  {
   value: "openai/gpt-oss-120b",
   label: "GPT OSS 120B",
   description: "Chất lượng cao hơn; có quota Groq Free Plan.",
  },
  {
   value: "qwen/qwen3.6-27b",
   label: "Qwen 3.6 27B",
   description: "Tốt cho nội dung tiếng Trung; có quota Groq Free Plan.",
  },
 ],
 deepseek: [
  {
   value: "deepseek-v4-flash",
   label: "DeepSeek V4 Flash",
   description: "Model mới, ưu tiên tốc độ và lookup thường xuyên.",
  },
  {
   value: "deepseek-v4-pro",
   label: "DeepSeek V4 Pro",
   description: "Model mới cho tác vụ cần chất lượng cao hơn.",
  },
 ],
 gemini: GEMINI_DETAIL_MODEL_OPTIONS,
 openai: [
  {
   value: "gpt-5-mini",
   label: "GPT-5 mini",
   description: "Nhanh và phù hợp cho lookup có cấu trúc.",
  },
  {
   value: "gpt-5-nano",
   label: "GPT-5 nano",
   description: "Nhẹ nhất cho tác vụ ngắn.",
  },
  {
   value: "gpt-4.1-mini",
   label: "GPT-4.1 mini",
   description: "Model ổn định cho JSON và instruction following.",
  },
  {
   value: "gpt-4.1-nano",
   label: "GPT-4.1 nano",
   description: "Model 4.1 nhỏ và nhanh.",
  },
 ],
};

export function getApiKeyModelOptions(provider: ApiKeyProvider) {
 return API_KEY_MODEL_OPTIONS[provider];
}

export function getDefaultApiKeyModel(provider: ApiKeyProvider): string {
 return API_KEY_MODEL_OPTIONS[provider][0].value;
}

export function isApiKeyModelSupported(provider: ApiKeyProvider, model: string): boolean {
 return API_KEY_MODEL_OPTIONS[provider].some((option) => option.value === model);
}

export function getApiKeyModelDescription(
 provider: ApiKeyProvider,
 model?: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>,
): string {
 return (
  API_KEY_MODEL_OPTIONS[provider].find((option) => option.value === model)?.description ||
  "Model đã lưu từ phiên bản trước. Chọn model mới để cập nhật."
 );
}
