import "server-only";

import { z } from "zod";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";

import { forgetAiConversationMemories } from "./ai-conversation-forget.server";
import { loadActiveAiConversationMemories } from "./ai-conversation-memory-persistence.server";
import {
 aiConversationMemoryExtractionSchema,
 type AiConversationMemoryExtraction,
 type AiConversationStoredMemory,
} from "./ai-conversation-memory.schemas";
import { generateStructuredAiConversationData } from "./ai-conversation-structured.server";

const explicitForgetResolutionSchema = z.strictObject({
 memoryIds: z.array(z.uuid()).max(10),
});
const EXTRACTION_MEMORY_DIGEST_LIMIT = 8;
const EXTRACTION_MEMORY_CONTENT_LIMIT = 180;
const FORGET_MEMORY_DIGEST_LIMIT = 10;
const FORGET_MEMORY_CONTENT_LIMIT = 160;
const EXTRACTION_EVIDENCE_LIMIT = 1300;
const FORGET_REQUEST_LIMIT = 1200;

function clipEvidence(value: string, limit: number) {
 const normalized = value.normalize("NFC").trim();
 if (normalized.length <= limit) return normalized;
 const headSize = Math.ceil(limit * 0.6);
 const tailSize = Math.floor(limit * 0.4);
 return `${normalized.slice(0, headSize)}\n[…truncated…]\n${normalized.slice(-tailSize)}`;
}

function renderMemoryDigest({
 memories,
 limit,
 contentLimit,
}: {
 memories: AiConversationStoredMemory[];
 limit: number;
 contentLimit: number;
}) {
 if (memories.length === 0) return "[]";
 return JSON.stringify(
  memories.slice(0, limit).map((memory) => ({
   id: memory.id,
   scope: memory.characterId ? "character" : "global",
   kind: memory.kind,
   memoryKey: memory.memoryKey,
   content: clipEvidence(memory.content, contentLimit),
  })),
 );
}

const MEMORY_EXTRACTION_SYSTEM_PROMPT = `You are a conservative long-term-memory extraction engine for a Chinese conversation product.
Return valid JSON only and exactly match the requested schema.

The learner/user message is the only authoritative source of learner facts. The assistant reply is context for interpretation, not evidence of a new learner fact by itself.

Allowed lifecycle actions: ignore, add, reinforce, supersede, resolve, forget.
Allowed kinds: fact, preference, habit, goal, episode, open_loop, inside_joke.
Allowed scopes: global, character.

Store only information useful for future conversational continuity:
- durable facts the learner explicitly states;
- stable preferences/habits/goals;
- meaningful shared episodes or inside jokes;
- explicit plans/promises/questions that should remain open loops.

Do not store:
- credentials, API keys, tokens, secrets or private app internals;
- transient filler or ordinary one-off small talk;
- speculative sensitive attributes;
- facts invented or inferred only by the assistant;
- every correction or every sentence merely because it occurred.

Prefer ignore when uncertain. Keep at most a few high-value changes per turn.
For canonical facts/preferences/habits/goals/open loops, use a short stable lowercase dotted memoryKey such as user.location.current or preference.reply_language when practical.
For reinforce/supersede/resolve/forget, target an existing memory id whenever the digest contains the relevant row.
When the learner explicitly says not to remember or asks to forget something, that instruction has highest priority: output forget for matching existing memories and never add the rejected information.
Use global scope for learner facts/preferences that should follow the learner across characters. Use character scope for relationship-specific episodes, open loops and inside jokes.`;

export async function extractAiConversationMemoryChanges({
 supabase,
 userId,
 characterId,
 characterName,
 mode,
 userMessage,
 assistantMessage,
 activeMemories,
 signal,
}: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 characterId: string;
 characterName: string;
 mode: string;
 userMessage: string;
 assistantMessage: string;
 activeMemories: AiConversationStoredMemory[];
 signal?: AbortSignal;
}): Promise<{ data: AiConversationMemoryExtraction | null; error: string | null }> {
 const prompt = [
  `Current character id: ${characterId}`,
  `Current character name: ${characterName}`,
  `Conversation mode: ${mode}`,
  `Existing active memories: ${renderMemoryDigest({
   memories: activeMemories,
   limit: EXTRACTION_MEMORY_DIGEST_LIMIT,
   contentLimit: EXTRACTION_MEMORY_CONTENT_LIMIT,
  })}`,
  `Learner message: ${JSON.stringify(clipEvidence(userMessage, EXTRACTION_EVIDENCE_LIMIT))}`,
  `Assistant reply: ${JSON.stringify(clipEvidence(assistantMessage, EXTRACTION_EVIDENCE_LIMIT))}`,
  "Return: {\"changes\":[{\"action\":...,\"kind\":...|null,\"targetMemoryId\":...|null,\"memoryKey\":...|null,\"content\":...|null,\"importance\":0..1,\"confidence\":0..1,\"scope\":\"global\"|\"character\"}]}",
 ].join("\n\n");

 return generateStructuredAiConversationData({
  supabase,
  userId,
  systemPrompt: MEMORY_EXTRACTION_SYSTEM_PROMPT,
  prompt,
  schema: aiConversationMemoryExtractionSchema,
  signal,
 });
}

const EXPLICIT_FORGET_SYSTEM_PROMPT = `You resolve an explicit user request to forget long-term memories.
Return valid JSON only: {"memoryIds":[...]}.
Choose only ids that are clearly targeted by the current forget request.
Never invent ids. Never delete a memory merely because it is vaguely related.
If the request refers to information that has not been stored yet, or the target is ambiguous, return an empty array.`;

export async function resolveExplicitAiConversationForget({
 supabase,
 userId,
 conversationId,
 characterId,
 userMessage,
 signal,
}: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 conversationId: string;
 characterId: string;
 userMessage: string;
 signal?: AbortSignal;
}) {
 const memories = await loadActiveAiConversationMemories({ userId, characterId, limit: 40 });
 if (memories.length === 0) {
  const resolvedIds: string[] = [];
  return { deleted: 0, resolvedIds };
 }

 const visibleMemories = memories.slice(0, FORGET_MEMORY_DIGEST_LIMIT);
 const result = await generateStructuredAiConversationData({
  supabase,
  userId,
  systemPrompt: EXPLICIT_FORGET_SYSTEM_PROMPT,
  prompt: [
   `Forget request: ${JSON.stringify(clipEvidence(userMessage, FORGET_REQUEST_LIMIT))}`,
   `Active memories: ${renderMemoryDigest({
    memories: visibleMemories,
    limit: FORGET_MEMORY_DIGEST_LIMIT,
    contentLimit: FORGET_MEMORY_CONTENT_LIMIT,
   })}`,
  ].join("\n\n"),
  schema: explicitForgetResolutionSchema,
  signal,
 });

 if (!result.data || result.data.memoryIds.length === 0) {
  const resolvedIds: string[] = [];
  return { deleted: 0, resolvedIds };
 }

 const allowedIds = new Set(visibleMemories.map((memory) => memory.id));
 const resolvedIds = result.data.memoryIds.filter((id) => allowedIds.has(id));
 const deleted = await forgetAiConversationMemories({
  userId,
  conversationId,
  memoryIds: resolvedIds,
 });
 return { deleted, resolvedIds };
}
