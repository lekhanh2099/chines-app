import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/supabase.generated";

import type { AiConversationContextState } from "./ai-conversation-context.server";
import type { AiConversationRecalledMemory } from "./ai-conversation-memory.schemas";
import type { AiConversationPersistedMessage } from "./ai-conversation-session.schemas";

const {
 generateAiConversationReply,
 generateSystemAiConversationReply,
 getActiveUserApiKeyCredentials,
 loadAiConversationContextState,
 loadAiConversationMemoryEnabledPreference,
 processDueAiConversationPostTurnJobs,
 resolveExplicitAiConversationForget,
 retrieveRelevantAiConversationMemories,
} = vi.hoisted(() => ({
 generateAiConversationReply: vi.fn(),
 generateSystemAiConversationReply: vi.fn(),
 getActiveUserApiKeyCredentials: vi.fn(),
 loadAiConversationContextState: vi.fn(),
 loadAiConversationMemoryEnabledPreference: vi.fn(),
 processDueAiConversationPostTurnJobs: vi.fn(),
 resolveExplicitAiConversationForget: vi.fn(),
 retrieveRelevantAiConversationMemories: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/services/ai.service", () => ({ generateAiConversationReply }));
vi.mock("@/services/user-api-keys.service", () => ({ getActiveUserApiKeyCredentials }));
vi.mock("./ai-conversation-system.server", () => ({
 generateSystemAiConversationReply,
 SYSTEM_AI_CONVERSATION_PROVIDER: "Google Gemini",
 SYSTEM_AI_CONVERSATION_MODEL: "models/gemini-3.1-flash-lite",
}));
vi.mock("./ai-conversation-persistence.server", () => ({ loadAiConversationContextState }));
vi.mock("./ai-conversation-memory-persistence.server", () => ({
 loadAiConversationMemoryEnabledPreference,
}));
vi.mock("./ai-conversation-post-turn.server", () => ({ processDueAiConversationPostTurnJobs }));
vi.mock("./ai-conversation-memory-extraction.server", () => ({ resolveExplicitAiConversationForget }));
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

import { generatePersistedAiConversationTurn } from "./ai-conversation-turn.server";

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

const groqKey = {
 id: "44444444-4444-4444-8444-444444444444",
 userId: "user-1",
 provider: "groq",
 label: "Groq",
 maskedKey: "gsk_***",
 isActive: true,
 priority: 0,
 defaultModel: "openai/gpt-oss-20b",
 lastValidatedAt: null,
 createdAt: "2026-08-18T00:00:00.000Z",
 updatedAt: "2026-08-18T00:00:00.000Z",
 apiKey: "gsk-test",
};

describe("persisted AI conversation turn", () => {
 beforeEach(() => {
  generateAiConversationReply.mockReset();
  generateSystemAiConversationReply.mockReset();
  getActiveUserApiKeyCredentials.mockReset();
  loadAiConversationContextState.mockReset();
  loadAiConversationMemoryEnabledPreference.mockReset();
  processDueAiConversationPostTurnJobs.mockReset();
  resolveExplicitAiConversationForget.mockReset();
  retrieveRelevantAiConversationMemories.mockReset();

  processDueAiConversationPostTurnJobs.mockResolvedValue({ processed: 0, ready: true });
  loadAiConversationContextState.mockResolvedValue(contextState);
  loadAiConversationMemoryEnabledPreference.mockResolvedValue(true);
  retrieveRelevantAiConversationMemories.mockResolvedValue([recalledMemory]);
  resolveExplicitAiConversationForget.mockResolvedValue({ deleted: 0, resolvedIds: [] });
 });

 it("injects relevant long-term memory under system data authority for BYOK", async () => {
  getActiveUserApiKeyCredentials.mockResolvedValue([groqKey]);
  generateAiConversationReply.mockResolvedValue({ data: "当然，你喜欢打羽毛球。", error: null });

  const result = await generatePersistedAiConversationTurn({
   supabase,
   userId: "user-1",
   recentMessages,
   contextState,
  });

  expect(result).toMatchObject({ ok: true, provider: "Groq", model: "openai/gpt-oss-20b" });
  expect(retrieveRelevantAiConversationMemories).toHaveBeenCalledWith(
   expect.objectContaining({
    userId: "user-1",
    characterId: contextState.character.id,
    query: recentMessages[0]?.content,
    enabled: true,
    suppressForForget: false,
   }),
  );
  const [messages, options] = generateAiConversationReply.mock.calls[0];
  expect(messages).toEqual([{ role: "user", content: recentMessages[0]?.content }]);
  expect(options.systemContext).toContain("<MEMORY_DATA>");
  expect(options.systemContext).toContain("Người học thích chơi cầu lông");
  expect(options.systemContext).toContain('"displayName":"小林"');
  expect(generateSystemAiConversationReply).not.toHaveBeenCalled();
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
  getActiveUserApiKeyCredentials.mockResolvedValue([]);
  generateSystemAiConversationReply.mockResolvedValue({ data: "记得。", error: null });

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
  const [, , systemContext] = generateSystemAiConversationReply.mock.calls[0];
  expect(systemContext).toContain('"relationshipBand":"familiar"');
  expect(systemContext).toContain("已经聊过运动。");
 });

 it("does not read or inject long-term memory when the conversation memory policy is disabled", async () => {
  const noMemoryState: AiConversationContextState = {
   ...contextState,
   conversation: { ...contextState.conversation, memoryPolicy: "disabled" },
  };
  getActiveUserApiKeyCredentials.mockResolvedValue([]);
  generateSystemAiConversationReply.mockResolvedValue({ data: "我们聊聊现在的话题吧。", error: null });

  await generatePersistedAiConversationTurn({
   supabase,
   userId: "user-1",
   recentMessages,
   contextState: noMemoryState,
  });

  expect(retrieveRelevantAiConversationMemories).not.toHaveBeenCalled();
  const [, , systemContext] = generateSystemAiConversationReply.mock.calls[0];
  expect(systemContext).toContain("<MEMORY_DATA>\n[]\n</MEMORY_DATA>");
 });

 it("suppresses recall on an explicit forget turn and resolves stored targets before the reply", async () => {
  const forgetMessages: AiConversationPersistedMessage[] = [
   {
    ...recentMessages[0],
    content: "忘掉我喜欢打羽毛球这件事。",
   },
  ];
  getActiveUserApiKeyCredentials.mockResolvedValue([]);
  generateSystemAiConversationReply.mockResolvedValue({ data: "好，我们不再用这个信息。", error: null });

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
  const [, , systemContext] = generateSystemAiConversationReply.mock.calls[0];
  expect(systemContext).toContain("<MEMORY_DATA>\n[]\n</MEMORY_DATA>");
 });
});
