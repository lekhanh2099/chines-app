export const DEFAULT_GEMINI_MODEL = "models/gemini-2.5-flash";

export const GEMINI_TEXT_MODEL_OPTIONS = [
 {
  value: "models/gemini-2.5-flash",
  label: "Gemini 2.5 Flash",
  description: "Mặc định cân bằng giữa tốc độ và chất lượng",
 },
 {
  value: "models/gemini-2.5-flash-lite",
  label: "Gemini 2.5 Flash-Lite",
  description: "Nhẹ hơn, phù hợp khi cần tốc độ",
 },
 {
  value: "models/gemini-2.5-pro",
  label: "Gemini 2.5 Pro",
  description: "Model mạnh hơn, có thể chậm hơn",
 },
 {
  value: "models/gemini-flash-latest",
  label: "Gemini Flash Latest",
  description: "Alias latest cho nhánh Flash",
 },
 {
  value: "models/gemini-flash-lite-latest",
  label: "Gemini Flash-Lite Latest",
  description: "Alias latest cho nhánh Flash-Lite",
 },
 {
  value: "models/gemini-pro-latest",
  label: "Gemini Pro Latest",
  description: "Alias latest cho nhánh Pro",
 },
 {
  value: "models/gemini-2.0-flash",
  label: "Gemini 2.0 Flash",
  description: "Model cũ hơn, giữ để fallback thủ công",
 },
 {
  value: "models/gemini-2.0-flash-lite",
  label: "Gemini 2.0 Flash-Lite",
  description: "Bản lite của 2.0 Flash",
 },
 {
  value: "models/gemma-3-4b-it",
  label: "Gemma 3 4B",
  description: "Model text nhỏ, có thể dùng thử khi Gemini rate limit",
 },
 {
  value: "models/gemma-3-12b-it",
  label: "Gemma 3 12B",
  description: "Model text trung bình, thiên về fallback",
 },
 {
  value: "models/gemma-3-27b-it",
  label: "Gemma 3 27B",
  description: "Model text lớn hơn trong dòng Gemma",
 },
] as const;

export type GeminiModelId = (typeof GEMINI_TEXT_MODEL_OPTIONS)[number]["value"];

export function normalizeGeminiModel(model?: string | null): GeminiModelId {
 const matched = GEMINI_TEXT_MODEL_OPTIONS.find(
  (option) => option.value === model,
 );
 return matched?.value || DEFAULT_GEMINI_MODEL;
}

export function getGeminiModelLabel(model?: string | null): string {
 return (
  GEMINI_TEXT_MODEL_OPTIONS.find((option) => option.value === model)?.label ||
  GEMINI_TEXT_MODEL_OPTIONS.find(
   (option) => option.value === DEFAULT_GEMINI_MODEL,
  )?.label ||
  DEFAULT_GEMINI_MODEL
 );
}
