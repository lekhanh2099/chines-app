import { aiTaskSessionOverrideSchema } from "@/lib/ai/ai-task-contract";

const RUNTIME_OVERRIDE_STORAGE_PREFIX = "hanzihome.ai-conversation.runtime-override.v2";
const SESSION_QUERY_ROOT = ["hanzihome", "ai-conversation", "session"];
export const HISTORY_QUERY_KEY = ["hanzihome", "ai-conversation", "history"];
export const SESSION_STALE_TIME_MS = 30_000;

export type RetryTurn = { clientMessageId: string; content: string };
export type ArchiveTarget = { id: string; title: string };
export type RuntimeSelection = {
 conversationId: string | null;
 keyId: string;
 model: string | null;
};

export function conversationSessionQueryKey(conversationId: string | null) {
 return [...SESSION_QUERY_ROOT, conversationId ?? "latest"];
}

export function runtimeOverrideStorageKey(conversationId: string) {
 return `${RUNTIME_OVERRIDE_STORAGE_PREFIX}:${conversationId}`;
}

export function readRuntimeOverride(value: string | null) {
 if (!value) return null;
 try {
  const parsed = aiTaskSessionOverrideSchema.safeParse(JSON.parse(value));
  return parsed.success ? parsed.data : null;
 } catch {
  return null;
 }
}
