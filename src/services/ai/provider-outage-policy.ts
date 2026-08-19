import { DEFAULT_GEMINI_MODEL, type GeminiModelId } from "@/lib/gemini-models";
import { z } from "zod";

export const ProviderNameSchema = z.enum(["Gemini", "DeepSeek", "OpenAI"]);
export type ProviderName = z.infer<typeof ProviderNameSchema>;

type ProviderOutageState = {
 unavailableUntil: number;
 reason: string;
};

const providerOutages = new Map<string, ProviderOutageState>();

function getProviderOutageKey(provider: ProviderName, geminiModel?: GeminiModelId): string {
 return provider === "Gemini" ? `${provider}:${geminiModel || DEFAULT_GEMINI_MODEL}` : provider;
}

export function getProviderSkipReason(
 provider: ProviderName,
 geminiModel?: GeminiModelId,
): z.infer<z.ZodNullable<z.ZodString>> {
 const key = getProviderOutageKey(provider, geminiModel);
 const outage = providerOutages.get(key);
 if (!outage) return null;

 if (Date.now() >= outage.unavailableUntil) {
  providerOutages.delete(key);
  return null;
 }

 return outage.reason;
}

export function markProviderUnavailable(
 provider: ProviderName,
 cooldownMs: number,
 reason: string,
 geminiModel?: GeminiModelId,
) {
 providerOutages.set(getProviderOutageKey(provider, geminiModel), {
  unavailableUntil: Date.now() + cooldownMs,
  reason,
 });
}

export function getProviderCooldownMs(
 provider: ProviderName,
 status: number,
 errorBody: string,
): number {
 const retryMatch = errorBody.match(/"retryDelay"\s*:\s*"([\d.]+)s"/i);
 const retrySeconds = retryMatch ? Number(retryMatch[1]) : NaN;

 if (provider === "Gemini" && status === 429) {
  if (Number.isFinite(retrySeconds) && retrySeconds > 0) {
   return Math.ceil(retrySeconds * 1000);
  }
  return 60_000;
 }

 if (provider === "DeepSeek" && status === 402) return 10 * 60_000;
 if (status === 401 || status === 403) return 10 * 60_000;
 return 0;
}
