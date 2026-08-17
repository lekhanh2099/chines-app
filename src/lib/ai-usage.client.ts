"use client";

import { z } from "zod";

const AI_USAGE_STORAGE_KEY = "hanzihome.ai-usage.v1";
const AI_USAGE_EVENT = "hanzihome:ai-usage-updated";

export const aiProviderUsageSchema = z.strictObject({
 inputTokens: z.number().int().nonnegative(),
 outputTokens: z.number().int().nonnegative(),
 totalTokens: z.number().int().nonnegative(),
});

const aiKeyUsageSchema = z.strictObject({
 requests: z.number().int().nonnegative(),
 inputTokens: z.number().int().nonnegative(),
 outputTokens: z.number().int().nonnegative(),
 totalTokens: z.number().int().nonnegative(),
 provider: z.string(),
 model: z.string(),
 lastUsedAt: z.string().nullable(),
});

const aiUsageSnapshotSchema = z.strictObject({
 requests: z.number().int().nonnegative(),
 inputTokens: z.number().int().nonnegative(),
 outputTokens: z.number().int().nonnegative(),
 totalTokens: z.number().int().nonnegative(),
 lastUsedAt: z.string().nullable(),
 byKey: z.record(z.string(), aiKeyUsageSchema),
});

export type AiProviderUsage = z.output<typeof aiProviderUsageSchema>;
export type AiUsageSnapshot = z.output<typeof aiUsageSnapshotSchema>;

export const EMPTY_AI_USAGE_SNAPSHOT: AiUsageSnapshot = {
 requests: 0,
 inputTokens: 0,
 outputTokens: 0,
 totalTokens: 0,
 lastUsedAt: null,
 byKey: {},
};

function readStoredSnapshot(): AiUsageSnapshot {
 if (typeof window === "undefined") return EMPTY_AI_USAGE_SNAPSHOT;

 try {
  const raw = window.localStorage.getItem(AI_USAGE_STORAGE_KEY);
  if (!raw) return EMPTY_AI_USAGE_SNAPSHOT;
  const parsed = aiUsageSnapshotSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : EMPTY_AI_USAGE_SNAPSHOT;
 } catch {
  return EMPTY_AI_USAGE_SNAPSHOT;
 }
}

export function getAiUsageSnapshot(): AiUsageSnapshot {
 return readStoredSnapshot();
}

export function recordAiUsageEvent(input: {
 apiKeyId: string;
 provider: string;
 model: string;
 usage: AiProviderUsage | null;
}) {
 if (typeof window === "undefined") return;

 const current = readStoredSnapshot();
 const usage = input.usage ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
 const timestamp = new Date().toISOString();
 const currentKey = current.byKey[input.apiKeyId] ?? {
  requests: 0,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  provider: input.provider,
  model: input.model,
  lastUsedAt: null,
 };
 const next: AiUsageSnapshot = {
  requests: current.requests + 1,
  inputTokens: current.inputTokens + usage.inputTokens,
  outputTokens: current.outputTokens + usage.outputTokens,
  totalTokens: current.totalTokens + usage.totalTokens,
  lastUsedAt: timestamp,
  byKey: {
   ...current.byKey,
   [input.apiKeyId]: {
    requests: currentKey.requests + 1,
    inputTokens: currentKey.inputTokens + usage.inputTokens,
    outputTokens: currentKey.outputTokens + usage.outputTokens,
    totalTokens: currentKey.totalTokens + usage.totalTokens,
    provider: input.provider,
    model: input.model,
    lastUsedAt: timestamp,
   },
  },
 };

 try {
  window.localStorage.setItem(AI_USAGE_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(AI_USAGE_EVENT));
 } catch {
  // Usage telemetry is best-effort and must never block the learning request.
 }
}

export function subscribeAiUsage(listener: () => void) {
 if (typeof window === "undefined") return () => undefined;

 const onStorage = (event: StorageEvent) => {
  if (event.key === AI_USAGE_STORAGE_KEY) listener();
 };
 window.addEventListener("storage", onStorage);
 window.addEventListener(AI_USAGE_EVENT, listener);
 return () => {
  window.removeEventListener("storage", onStorage);
  window.removeEventListener(AI_USAGE_EVENT, listener);
 };
}
