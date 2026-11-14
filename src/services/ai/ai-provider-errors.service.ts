import { z } from "zod";

type Provider = z.infer<z.ZodEnum<{ Gemini: "Gemini"; DeepSeek: "DeepSeek"; OpenAI: "OpenAI" }>>;
type ManagedProvider = z.infer<
 z.ZodUnion<
  [z.ZodEnum<{ Gemini: "Gemini"; DeepSeek: "DeepSeek"; OpenAI: "OpenAI" }>, z.ZodLiteral<"Groq">]
 >
>;

export function formatProviderError(provider: Provider, status: number, errorBody: string): string {
 const body = errorBody.toLowerCase();

 if (provider === "Gemini") {
  if (status === 429 && body.includes("quota")) {
   return "Gemini đã hết quota hoặc đang bị rate limit.";
  }

  if (status === 401 || status === 403) {
   return "Gemini API key không hợp lệ hoặc bị từ chối.";
  }
 }

 if (provider === "DeepSeek") {
  if (status === 402 || body.includes("insufficient balance")) {
   return "DeepSeek đã hết số dư.";
  }

  if (status === 401 || status === 403) {
   return "DeepSeek API key không hợp lệ hoặc bị từ chối.";
  }
 }

 if (provider === "OpenAI") {
  if (status === 429 || body.includes("insufficient_quota") || body.includes("rate limit")) {
   return "OpenAI đã hết quota hoặc đang bị rate limit.";
  }

  if (status === 401 || status === 403) {
   return "OpenAI API key không hợp lệ hoặc bị từ chối.";
  }
 }

 return `${provider} lỗi HTTP ${status}.`;
}

export function formatManagedKeyError(
 provider: ManagedProvider,
 status: number,
 errorBody: string,
): string {
 const body = errorBody.toLowerCase();

 if (provider === "Groq") {
  if (status === 401 || status === 403) return "Groq key không hợp lệ hoặc đã bị thu hồi.";
  if (status === 429) return "Groq key đang bị rate limit.";
  return `Groq key trả về HTTP ${status}.`;
 }

 if (provider === "DeepSeek") {
  if (status === 401 || status === 403) {
   return "DeepSeek key không hợp lệ hoặc đã bị thu hồi.";
  }

  if (
   status === 402 ||
   body.includes("insufficient balance") ||
   body.includes("insufficient_quota")
  ) {
   return "DeepSeek key đã hết tín dụng.";
  }

  if (status === 429) {
   return "DeepSeek key đang bị rate limit.";
  }

  return `DeepSeek key trả về HTTP ${status}.`;
 }

 if (provider === "Gemini") {
  if (status === 400 || status === 401 || status === 403) {
   return "Gemini key không hợp lệ hoặc không có quyền truy cập model hiện tại.";
  }

  if (status === 429 || body.includes("quota")) {
   return "Gemini key đã hết quota hoặc đang bị rate limit.";
  }

  return `Gemini key trả về HTTP ${status}.`;
 }

 if (status === 401 || status === 403) {
  return "OpenAI key không hợp lệ hoặc đã bị thu hồi.";
 }

 if (status === 429 || body.includes("insufficient_quota") || body.includes("rate limit")) {
  return "OpenAI key đã hết quota hoặc đang bị rate limit.";
 }

 return `OpenAI key trả về HTTP ${status}.`;
}
