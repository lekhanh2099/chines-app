export const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

export const DEEPSEEK_MODEL_OPTIONS = [
 {
  value: "deepseek-chat",
  label: "DeepSeek-V3",
  description: "Model đa năng, phù hợp tra từ và dịch thuật",
 },
 {
  value: "deepseek-reasoner",
  label: "DeepSeek-R1",
  description: "Model suy luận mạnh, chậm hơn nhưng chính xác hơn",
 },
] as const;

export type DeepSeekModelId = (typeof DEEPSEEK_MODEL_OPTIONS)[number]["value"];

export function normalizeDeepSeekModel(model?: string | null): DeepSeekModelId {
 const matched = DEEPSEEK_MODEL_OPTIONS.find(
  (option) => option.value === model,
 );
 return matched?.value || DEFAULT_DEEPSEEK_MODEL;
}

export function getDeepSeekModelLabel(model?: string | null): string {
 return (
  DEEPSEEK_MODEL_OPTIONS.find((option) => option.value === model)?.label ||
  DEEPSEEK_MODEL_OPTIONS.find(
   (option) => option.value === DEFAULT_DEEPSEEK_MODEL,
  )?.label ||
  DEFAULT_DEEPSEEK_MODEL
 );
}
