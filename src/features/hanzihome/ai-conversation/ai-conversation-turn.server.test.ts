import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";
import type { Database } from "@/types/supabase.generated";

import type { AiConversationContextState } from "./ai-conversation-context.server";
import type { AiConversationRecalledMemory } from "./ai-conversation-memory.schemas";
import type { AiConversationPersistedMessage } from "./ai-conversation-session.schemas";

const {
 loadAiConversationContextState,
 loadAiConversationMemoryEnabledPreference,
 processDueAiConversationPostTurnJobs,
 resolveExplicitAiConversationForget,
 resolveUserAiRuntime,
 retrieveRelevantAiConversationMemories,
 streamAiConversationProviderReply,
} = vi.hoisted(() => ({
 loadAiConversationContextState: vi.fn(),
 loadAiConversationMemoryEnabledPreference: vi.fn(),
 processDueAiConversationPostTurnJobs: vi.fn(),
 resolveExplicitAiConversationForget: vi.fn(),
 resolveUserAiRuntime: vi.fn(),
 retrieveRelevantAiConversationMemories: vi.fn(),
 streamAiConversationProviderReply: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/services/ai-runtime.service", () => ({ resolveUserAiRuntime }));
vi.mock("./ai-conversation-stream-provider.server", () => ({
 AiConversationProviderStreamError: class AiConversationProviderStreamError extends Error {},
 streamAiConversationProviderReply,
}));
vi.mock("./ai-conversation-persistence.server", () => ({ loadAiConversationContextState }));
vi.mock("./ai-conversation-memory-persistence.server", () => ({
 loadAiConversationMemoryEnabledPreference,
}));
vi.mock("./ai-conversation-post-turn.server", () => ({ processDueAiConversationPostTurnJobs }));
vi.mock("./ai-conversation-memory-extraction.server", () => ({
 resolveExplicitAiConversationForget,
}));
vi.mock("./ai-conversation-memory.server", () => ({
 isAiConversationLongTermMemoryEnabled: ({
  conversationPolicy,
  userPreference,
 }: {
  conversationPolicy: "inherit" | "enabled" | "disabled";
  userPreference: boolean;
 }) => {
  if (conversationPolicy === "disabled") return false;
  if (conversationPolicy === "enabled") return true;
  return userPreference;
 },
 isExplicitAiConversationForgetIntent: (content: string) =>
  /(?:忘掉|别记|đừng nhớ|quên đi)/iu.test(content),
 retrieveRelevantAiConversationMemories,
}));

import {
 generatePersistedAiConversationTurn,
 preparePersistedAiConversationTurn,
} from "./ai-conversation-turn.server";

const supabase = createClient<Database>("https://example.supabase.co", "test-key", {
 auth: { autoRefreshToken: false, persistSession: false },
});

const contextState: AiConversationContextState = {
 conversation: {
  id: "11111111-1111-4111-8111-111111111111",
  characterId: "22222222-2222-4222-8222-222222222222",
  mode: "natural",
  correctionStyle: "balanced",
  replyMode: "adaptive",
  memoryPolicy: "inherit",
  summary: "",
  summaryUntilSeq: 0,
 },
 character: {
  id: "22222222-2222-4222-8222-222222222222",
  displayName: "小林",
  city: "上海",
  age: null,
  background: "在上海生活和工作。",
  personality: "自然、耐心。",
  speakingStyle: "自然普通话。",
  interests: ["电影"],
  identityNotes: "",
 },
 relationship: null,
 learnerLevel: "intermediate",
};

const recentMessages: AiConversationPersistedMessage[] = [
 {
  id: "33333333-3333-4333-8333-333333333333",
  seq: 1,
  role: "user",
  content: "你还记得我喜欢什么运动吗？",
  createdAt: "2026-08-18T03:00:00+00:00",
 },
];

const recalledMemory: AiConversationRecalledMemory = {
 id: "55555555-5555-4555-8555-555555555555",
 characterId: null,
 kind: "preference",
 memoryKey: "user.sport.badminton",
 content: "Người học thích chơi cầu lông.",
 importance: 0.8,
 confidence: 0.95,
 reinforcementCount: 2,
 updatedAt: "2026-08-18T02:00:00+00:00",
 similarity: 0.84,
};

const groqRuntime: ResolvedUserAiRuntime = {
 keyId: "44444444-4444-4444-8444-444444444444",
 provider: "groq",
 providerLabel: "Groq",
 label: "Groq",
 maskedKey: "gsk_***",
 model: "openai/gpt-oss-20b",
 priority: 0,
 apiKey: "gsk-test",
 capabilities: [
  "conversation",
  "daily-reading-translation",
  "daily-reading-learning",
  "lookup",
  "structured-memory",
 ],
};

async function* streamText(text: string) {
 yield text;
}

describe("persisted AI conversation turn", () => {
 beforeEach(() => {
  loadAiConversationContextState.mockReset();
  loadAiConversationMemoryEnabledPreference.mockReset();
  processDueAiConversationPostTurnJobs.mockReset();
  resolveExplicitAiConversationForget.mockReset();
  resolveUserAiRuntime.mockReset();
  retrieveRelevantAiConversationMemories.mockReset();
  streamAiConversationProviderReply.mockReset();

  resolveUserAiRuntime.mockResolvedValue({ ok: true, runtime: groqRuntime });
  processDueAiConversationPostTurnJobs.mockResolvedValue({ processed: 0, ready: true });
  loadAiConversationContextState.mockResolvedValue(contextState);
  loadAiConversationMemoryEnabledPreference.mockResolvedValue(true);
  retrieveRelevantAiConversationMemories.mockResolvedValue([recalledMemory]);
  resolveExplicitAiConversationForget.mockResolvedValue({ deleted: 0, resolvedIds: [] });
  streamAiConversationProviderReply.mockImplementation(() => streamText("当然，你喜欢打羽毛球。"));
 });

 it("injects relevant long-term memory into a strict personal BYOK turn", async () => {
  const result = await generatePersistedAiConversationTurn({
   supabase,
   userId: "user-1",
   recentMessages,
   contextState,
  });

  expect(result).toMatchObject({
   ok: true,
   provider: "Groq",
   model: "openai/gpt-oss-20b",
   apiKeyId: groqRuntime.keyId,
  });
  expect(resolveUserAiRuntime).toHaveBeenCalledWith(
   expect.objectContaining({ userId: "user-1", capability: "conversation" }),
  );
  expect(retrieveRelevantAiConversationMemories).toHaveBeenCalledWith(
   expect.objectContaining({
    userId: "user-1",
    characterId: contextState.character.id,
    query: recentMessages[0]?.content,
    enabled: true,
    suppressForForget: false,
   }),
  );
  const providerInput = streamAiConversationProviderReply.mock.calls[0]?.[0];
  expect(providerInput.runtime).toEqual(groqRuntime);
  expect(providerInput.messages).toEqual([{ role: "user", content: recentMessages[0]?.content }]);
  expect(providerInput.systemPrompt).toContain("<MEMORY_DATA>");
  expect(providerInput.systemPrompt).toContain("Người học thích chơi cầu lông");
  expect(providerInput.systemPrompt).toContain('"displayName":"小林"');
 });

 it("blocks the turn before memory/provider work when no personal key is available", async () => {
  resolveUserAiRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "no-active-key",
  });

  const result = await preparePersistedAiConversationTurn({
   supabase,
   userId: "user-1",
   recentMessages,
   contextState,
  });

  expect(result).toMatchObject({ ok: false, code: "AI_API_KEY_REQUIRED", status: 409 });
  expect(processDueAiConversationPostTurnJobs).not.toHaveBeenCalled();
  expect(retrieveRelevantAiConversationMemories).not.toHaveBeenCalled();
  expect(streamAiConversationProviderReply).not.toHaveBeenCalled();
 });

 it("reloads relationship and summary context after processing a due durable job", async () => {
  const refreshedContext: AiConversationContextState = {
   ...contextState,
   relationship: { nickname: "", familiarityScore: 0.25, revision: 1 },
   conversation: {
    ...contextState.conversation,
    summary: "已经聊过运动。",
    summaryUntilSeq: 2,
   },
  };
  processDueAiConversationPostTurnJobs.mockResolvedValue({ processed: 1, ready: true });
  loadAiConversationContextState.mockResolvedValue(refreshedContext);

  await generatePersistedAiConversationTurn({
   supabase,
   userId: "user-1",
   recentMessages,
   contextState,
  });

  expect(loadAiConversationContextState).toHaveBeenCalledWith({
   userId: "user-1",
   conversationId: contextState.conversation.id,
  });
  const providerInput = streamAiConversationProviderReply.mock.calls[0]?.[0];
  expect(providerInput.systemPrompt).toContain('"relationshipBand":"familiar"');
  expect(providerInput.systemPrompt).toContain("已经聊过运动。");
 });

 it("does not read or inject long-term memory when the conversation policy is disabled", async () => {
  const noMemoryState: AiConversationContextState = {
   ...contextState,
   conversation: { ...contextState.conversation, memoryPolicy: "disabled" },
  };

  await generatePersistedAiConversationTurn({
   supabase,
   userId: "user-1",
   recentMessages,
   contextState: noMemoryState,
  });

  expect(retrieveRelevantAiConversationMemories).not.toHaveBeenCalled();
  const providerInput = streamAiConversationProviderReply.mock.calls[0]?.[0];
  expect(providerInput.systemPrompt).toContain("<MEMORY_DATA>\n[]\n</MEMORY_DATA>");
 });

 it("suppresses recall on an explicit forget turn and resolves targets before reply generation", async () => {
  const forgetMessages: AiConversationPersistedMessage[] = [
   {
    ...recentMessages[0],
    content: "忘掉我喜欢打羽毛球这件事。",
   },
  ];

  await generatePersistedAiConversationTurn({
   supabase,
   userId: "user-1",
   recentMessages: forgetMessages,
   contextState,
  });

  expect(resolveExplicitAiConversationForget).toHaveBeenCalledWith(
   expect.objectContaining({
    userId: "user-1",
    conversationId: contextState.conversation.id,
    userMessage: forgetMessages[0]?.content,
   }),
  );
  expect(retrieveRelevantAiConversationMemories).not.toHaveBeenCalled();
  const providerInput = streamAiConversationProviderReply.mock.calls[0]?.[0];
  expect(providerInput.systemPrompt).toContain("<MEMORY_DATA>\n[]\n</MEMORY_DATA>");
 });
});
