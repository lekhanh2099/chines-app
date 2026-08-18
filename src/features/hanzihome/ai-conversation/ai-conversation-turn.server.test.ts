import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/supabase.generated";

import type { AiConversationContextState } from "./ai-conversation-context.server";
import type { AiConversationPersistedMessage } from "./ai-conversation-session.schemas";

const {
 generateAiConversationReply,
 generateSystemAiConversationReply,
 getActiveUserApiKeyCredentials,
} = vi.hoisted(() => ({
 generateAiConversationReply: vi.fn(),
 generateSystemAiConversationReply: vi.fn(),
 getActiveUserApiKeyCredentials: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/services/ai.service", () => ({ generateAiConversationReply }));
vi.mock("@/services/user-api-keys.service", () => ({ getActiveUserApiKeyCredentials }));
vi.mock("./ai-conversation-system.server", () => ({
 generateSystemAiConversationReply,
 SYSTEM_AI_CONVERSATION_PROVIDER: "Google Gemini",
 SYSTEM_AI_CONVERSATION_MODEL: "models/gemini-3.1-flash-lite",
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
  content: "你好",
  createdAt: "2026-08-18T03:00:00+00:00",
 },
];

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
 });

 it("passes server-owned character mode and learner preference as system authority to BYOK", async () => {
  getActiveUserApiKeyCredentials.mockResolvedValue([groqKey]);
  generateAiConversationReply.mockResolvedValue({ data: "你好，最近怎么样？", error: null });

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
  });
  expect(generateAiConversationReply).toHaveBeenCalledTimes(1);
  const [messages, options] = generateAiConversationReply.mock.calls[0];
  expect(messages).toEqual([{ role: "user", content: "你好" }]);
  expect(options.systemContext).toContain("[PRODUCT POLICY — HIGHEST PRIORITY]");
  expect(options.systemContext).toContain('"displayName":"小林"');
  expect(options.systemContext).toContain("Conversation mode: natural");
  expect(options.systemContext).toContain("Learner level: intermediate");
  expect(generateSystemAiConversationReply).not.toHaveBeenCalled();
 });

 it("passes the same trusted context to the system runtime when no personal key exists", async () => {
  getActiveUserApiKeyCredentials.mockResolvedValue([]);
  generateSystemAiConversationReply.mockResolvedValue({ data: "你好，最近怎么样？", error: null });

  const result = await generatePersistedAiConversationTurn({
   supabase,
   userId: "user-1",
   recentMessages,
   contextState,
  });

  expect(result).toMatchObject({
   ok: true,
   provider: "Google Gemini",
   model: "models/gemini-3.1-flash-lite",
  });
  expect(generateSystemAiConversationReply).toHaveBeenCalledTimes(1);
  const [messages, signal, systemContext] = generateSystemAiConversationReply.mock.calls[0];
  expect(messages).toEqual([{ role: "user", content: "你好" }]);
  expect(signal).toBeUndefined();
  expect(systemContext).toContain('"displayName":"小林"');
  expect(systemContext).toContain("Conversation mode: natural");
  expect(systemContext).toContain("Learner level: intermediate");
  expect(generateAiConversationReply).not.toHaveBeenCalled();
 });
});
