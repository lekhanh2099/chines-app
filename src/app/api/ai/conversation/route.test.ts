import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AiConversationContextState } from "@/features/hanzihome/ai-conversation/ai-conversation-context.server";
import type {
 AiConversationPersistedMessage,
 AiConversationSession,
} from "@/features/hanzihome/ai-conversation/ai-conversation-session.schemas";
import {
 DEFAULT_AI_CONVERSATION_PROFILE,
 type AiConversationMessage,
} from "@/features/hanzihome/ai-conversation/ai-conversation.schemas";

const {
 PersistenceConfigurationError,
 PersistenceNotReadyError,
 PersistenceRequestError,
 appendAiConversationMessage,
 archiveAiConversation,
 createAiConversationSession,
 ensureAiConversationSession,
 findAssistantReplyForUserMessage,
 generateAiConversationReply,
 generatePersistedAiConversationTurn,
 generateSystemAiConversationReply,
 getActiveUserApiKeyCredentials,
 listAiConversationHistory,
 loadAiConversationContextState,
 loadAiConversationSession,
 loadLatestAiConversationSession,
 loadRecentAiConversationMessages,
 requireAuthenticatedRoute,
 updateAiConversationMemoryPolicy,
 updateAiConversationSettings,
} = vi.hoisted(() => {
 class PersistenceConfigurationError extends Error {}
 class PersistenceNotReadyError extends Error {}
 class PersistenceRequestError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, code: string | null) {
   super("persistence request failed");
   this.status = status;
   this.code = code;
  }
 }
 return {
  PersistenceConfigurationError,
  PersistenceNotReadyError,
  PersistenceRequestError,
  appendAiConversationMessage: vi.fn(),
  archiveAiConversation: vi.fn(),
  createAiConversationSession: vi.fn(),
  ensureAiConversationSession: vi.fn(),
  findAssistantReplyForUserMessage: vi.fn(),
  generateAiConversationReply: vi.fn(),
  generatePersistedAiConversationTurn: vi.fn(),
  generateSystemAiConversationReply: vi.fn(),
  getActiveUserApiKeyCredentials: vi.fn(),
  listAiConversationHistory: vi.fn(),
  loadAiConversationContextState: vi.fn(),
  loadAiConversationSession: vi.fn(),
  loadLatestAiConversationSession: vi.fn(),
  loadRecentAiConversationMessages: vi.fn(),
  requireAuthenticatedRoute: vi.fn(),
  updateAiConversationMemoryPolicy: vi.fn(),
  updateAiConversationSettings: vi.fn(),
 };
});

vi.mock("server-only", () => ({}));
vi.mock("@/services/user-api-keys.service", () => ({ getActiveUserApiKeyCredentials }));
vi.mock("@/services/ai.service", () => ({ generateAiConversationReply }));
vi.mock("@/features/hanzihome/ai-conversation/ai-conversation-system.server", () => ({
 generateSystemAiConversationReply,
 SYSTEM_AI_CONVERSATION_PROVIDER: "Google Gemini",
 SYSTEM_AI_CONVERSATION_MODEL: "models/gemini-3.1-flash-lite",
}));
vi.mock("@/features/hanzihome/ai-conversation/ai-conversation-persistence.server", () => ({
 AiConversationPersistenceConfigurationError: PersistenceConfigurationError,
 AiConversationPersistenceNotReadyError: PersistenceNotReadyError,
 AiConversationPersistenceRequestError: PersistenceRequestError,
 appendAiConversationMessage,
 archiveAiConversation,
 createAiConversationSession,
 ensureAiConversationSession,
 findAssistantReplyForUserMessage,
 listAiConversationHistory,
 loadAiConversationContextState,
 loadAiConversationSession,
 loadLatestAiConversationSession,
 loadRecentAiConversationMessages,
 updateAiConversationMemoryPolicy,
 updateAiConversationSettings,
}));
vi.mock("@/features/hanzihome/ai-conversation/ai-conversation-turn.server", () => ({
 generatePersistedAiConversationTurn,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { POST } from "./route";

const requestBody = (messages: AiConversationMessage[], apiKeyId?: string) => ({
 messages,
 profile: DEFAULT_AI_CONVERSATION_PROFILE,
 ...(apiKeyId ? { apiKeyId } : {}),
});

const userMessage: AiConversationPersistedMessage = {
 id: "11111111-1111-4111-8111-111111111111",
 seq: 1,
 role: "user",
 content: "你好",
 createdAt: "2026-08-18T03:00:00+00:00",
};
const assistantMessage: AiConversationPersistedMessage = {
 id: "22222222-2222-4222-8222-222222222222",
 seq: 2,
 role: "assistant",
 content: "你好，今天过得怎么样？",
 createdAt: "2026-08-18T03:00:01+00:00",
};
const conversationId = "33333333-3333-4333-8333-333333333333";
const characterId = "66666666-6666-4666-8666-666666666666";
const persistedSession: AiConversationSession = {
 conversation: {
  id: conversationId,
  characterId,
  title: "",
  mode: "natural",
  correctionStyle: "balanced",
  replyMode: "adaptive",
  memoryPolicy: "inherit",
 },
 character: {
  id: characterId,
  displayName: "小林",
  city: "上海",
  interests: ["电影"],
 },
 relationship: null,
 learnerLevel: "intermediate",
 memoryEnabled: true,
 messages: [],
};
const contextState: AiConversationContextState = {
 conversation: {
  id: conversationId,
  characterId,
  mode: "natural",
  correctionStyle: "balanced",
  replyMode: "adaptive",
  memoryPolicy: "inherit",
  summary: "",
  summaryUntilSeq: 0,
 },
 character: {
  id: characterId,
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

function post(body: JsonFieldValue) {
 return POST(
  new Request("https://app.example/api/ai/conversation", {
   method: "POST",
   body: JSON.stringify(body),
  }),
 );
}

describe("/api/ai/conversation", () => {
 beforeEach(() => {
  appendAiConversationMessage.mockReset();
  archiveAiConversation.mockReset();
  createAiConversationSession.mockReset();
  ensureAiConversationSession.mockReset();
  findAssistantReplyForUserMessage.mockReset();
  generateAiConversationReply.mockReset();
  generatePersistedAiConversationTurn.mockReset();
  generateSystemAiConversationReply.mockReset();
  getActiveUserApiKeyCredentials.mockReset();
  listAiConversationHistory.mockReset();
  loadAiConversationContextState.mockReset();
  loadAiConversationSession.mockReset();
  loadLatestAiConversationSession.mockReset();
  loadRecentAiConversationMessages.mockReset();
  requireAuthenticatedRoute.mockReset();
  updateAiConversationMemoryPolicy.mockReset();
  updateAiConversationSettings.mockReset();
  loadAiConversationContextState.mockResolvedValue(contextState);
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: {}, user: { id: "user-1" } },
  });
 });

 it("loads the backend-owned latest persisted session", async () => {
  loadLatestAiConversationSession.mockResolvedValue(persistedSession);

  const response = await post({ action: "session" });

  expect(response.status).toBe(200);
  expect(loadLatestAiConversationSession).toHaveBeenCalledWith("user-1");
  expect(await response.json()).toEqual(persistedSession);
  expect(getActiveUserApiKeyCredentials).not.toHaveBeenCalled();
 });

 it("loads one owned conversation by id for history navigation", async () => {
  loadAiConversationSession.mockResolvedValue(persistedSession);

  const response = await post({ action: "session", conversationId });

  expect(response.status).toBe(200);
  expect(loadAiConversationSession).toHaveBeenCalledWith({
   userId: "user-1",
   conversationId,
  });
  expect(loadLatestAiConversationSession).not.toHaveBeenCalled();
 });

 it("lists active conversation history without transcript payloads", async () => {
  const history = [
   {
    id: conversationId,
    characterId,
    title: "周末计划",
    mode: "natural",
    memoryPolicy: "inherit",
    lastMessageAt: "2026-08-18T03:30:00+00:00",
    createdAt: "2026-08-18T03:00:00+00:00",
    updatedAt: "2026-08-18T03:30:00+00:00",
   },
  ];
  listAiConversationHistory.mockResolvedValue(history);

  const response = await post({ action: "history" });

  expect(response.status).toBe(200);
  expect(listAiConversationHistory).toHaveBeenCalledWith("user-1");
  expect(await response.json()).toEqual(history);
 });

 it("creates a new backend-owned conversation", async () => {
  createAiConversationSession.mockResolvedValue(persistedSession);

  const response = await post({ action: "create-conversation" });

  expect(response.status).toBe(200);
  expect(createAiConversationSession).toHaveBeenCalledWith("user-1");
 });

 it("updates the current conversation memory policy", async () => {
  updateAiConversationMemoryPolicy.mockResolvedValue({
   conversationId,
   memoryPolicy: "disabled",
   memoryEnabled: false,
  });

  const response = await post({
   action: "update-memory-policy",
   conversationId,
   memoryPolicy: "disabled",
  });

  expect(response.status).toBe(200);
  expect(updateAiConversationMemoryPolicy).toHaveBeenCalledWith({
   userId: "user-1",
   conversationId,
   memoryPolicy: "disabled",
  });
  expect(await response.json()).toEqual({
   conversationId,
   memoryPolicy: "disabled",
   memoryEnabled: false,
  });
 });

 it("archives through the owned recoverable lifecycle action", async () => {
  archiveAiConversation.mockResolvedValue({ conversationId, archived: true });

  const response = await post({ action: "archive-conversation", conversationId });

  expect(response.status).toBe(200);
  expect(archiveAiConversation).toHaveBeenCalledWith({ userId: "user-1", conversationId });
  expect(await response.json()).toEqual({ conversationId, archived: true });
 });

 it("reports an unapplied persistence migration instead of a generic load failure", async () => {
  loadLatestAiConversationSession.mockRejectedValue(new PersistenceNotReadyError());

  const response = await post({ action: "session" });

  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ code: "AI_PERSISTENCE_NOT_READY" });
 });

 it("reports a missing persistence server secret separately", async () => {
  loadLatestAiConversationSession.mockRejectedValue(new PersistenceConfigurationError());

  const response = await post({ action: "session" });

  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ code: "AI_PERSISTENCE_CONFIG_MISSING" });
 });

 it("reports persistence credential access failures separately", async () => {
  loadLatestAiConversationSession.mockRejectedValue(new PersistenceRequestError(403, "42501"));

  const response = await post({ action: "session" });

  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ code: "AI_PERSISTENCE_ACCESS_FAILED" });
 });

 it("maps an unowned Phase 5 mutation to not found", async () => {
  archiveAiConversation.mockRejectedValue(
   new PersistenceRequestError(404, "AI_CONVERSATION_NOT_FOUND"),
  );

  const response = await post({ action: "archive-conversation", conversationId });

  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({ code: "AI_CONVERSATION_NOT_FOUND" });
 });

 it("persists behavior settings through the authenticated user owner", async () => {
  updateAiConversationSettings.mockResolvedValue({
   conversationId,
   characterId,
   mode: "grammar-coach",
   correctionStyle: "strict",
   replyMode: "chinese",
   learnerLevel: "advanced",
  });

  const response = await post({
   action: "update-settings",
   conversationId,
   mode: "grammar-coach",
   correctionStyle: "strict",
   replyMode: "chinese",
   learnerLevel: "advanced",
  });

  expect(response.status).toBe(200);
  expect(updateAiConversationSettings).toHaveBeenCalledWith({
   userId: "user-1",
   conversationId,
   settings: {
    mode: "grammar-coach",
    correctionStyle: "strict",
    replyMode: "chinese",
    learnerLevel: "advanced",
   },
  });
  expect(getActiveUserApiKeyCredentials).not.toHaveBeenCalled();
 });

 it("rejects legacy profile fields on persisted settings", async () => {
  const response = await post({
   action: "update-settings",
   conversationId,
   mode: "natural",
   correctionStyle: "balanced",
   replyMode: "adaptive",
   learnerLevel: "intermediate",
   profile: DEFAULT_AI_CONVERSATION_PROFILE,
  });

  expect(response.status).toBe(400);
  expect(updateAiConversationSettings).not.toHaveBeenCalled();
 });

 it("persists one user turn, loads trusted server context, then persists the reply", async () => {
  appendAiConversationMessage
   .mockResolvedValueOnce(userMessage)
   .mockResolvedValueOnce(assistantMessage);
  findAssistantReplyForUserMessage.mockResolvedValue(null);
  loadRecentAiConversationMessages.mockResolvedValue([userMessage]);
  generatePersistedAiConversationTurn.mockResolvedValue({
   ok: true,
   message: assistantMessage.content,
   provider: "Groq",
   model: "openai/gpt-oss-20b",
   apiKeyId: "44444444-4444-4444-8444-444444444444",
  });

  const response = await post({
   action: "message",
   conversationId,
   clientMessageId: "55555555-5555-4555-8555-555555555555",
   content: userMessage.content,
  });

  expect(response.status).toBe(200);
  expect(appendAiConversationMessage).toHaveBeenNthCalledWith(
   1,
   expect.objectContaining({
    userId: "user-1",
    conversationId,
    role: "user",
    clientMessageId: "55555555-5555-4555-8555-555555555555",
   }),
  );
  expect(loadAiConversationContextState).toHaveBeenCalledWith({
   userId: "user-1",
   conversationId,
  });
  expect(loadRecentAiConversationMessages).toHaveBeenCalledWith({
   userId: "user-1",
   conversationId,
   limit: 19,
  });
  expect(generatePersistedAiConversationTurn).toHaveBeenCalledWith(
   expect.objectContaining({ userId: "user-1", recentMessages: [userMessage], contextState }),
  );
  expect(appendAiConversationMessage).toHaveBeenNthCalledWith(
   2,
   expect.objectContaining({
    role: "assistant",
    replyToMessageId: userMessage.id,
    metadata: {
     provider: "Groq",
     model: "openai/gpt-oss-20b",
     apiKeyId: "44444444-4444-4444-8444-444444444444",
    },
   }),
  );
 });

 it("rejects legacy profile fields on the persisted turn action", async () => {
  const response = await post({
   action: "message",
   conversationId,
   clientMessageId: "55555555-5555-4555-8555-555555555555",
   content: userMessage.content,
   profile: DEFAULT_AI_CONVERSATION_PROFILE,
  });

  expect(response.status).toBe(400);
  expect(appendAiConversationMessage).not.toHaveBeenCalled();
  expect(loadAiConversationContextState).not.toHaveBeenCalled();
 });

 it("returns an already persisted assistant reply without rebuilding context or calling provider", async () => {
  appendAiConversationMessage.mockResolvedValue(userMessage);
  findAssistantReplyForUserMessage.mockResolvedValue({
   message: assistantMessage,
   provider: "Groq",
   model: "openai/gpt-oss-20b",
   apiKeyId: null,
  });

  const response = await post({
   action: "message",
   conversationId,
   clientMessageId: "55555555-5555-4555-8555-555555555555",
   content: userMessage.content,
  });

  expect(response.status).toBe(200);
  expect(loadAiConversationContextState).not.toHaveBeenCalled();
  expect(loadRecentAiConversationMessages).not.toHaveBeenCalled();
  expect(generatePersistedAiConversationTurn).not.toHaveBeenCalled();
  expect(appendAiConversationMessage).toHaveBeenCalledTimes(1);
 });

 it("uses the system Gemini runtime for the legacy compatibility path when no personal key is active", async () => {
  getActiveUserApiKeyCredentials.mockResolvedValue([]);
  generateSystemAiConversationReply.mockResolvedValue({ data: "你好，我们开始吧。", error: null });

  const response = await post(requestBody([{ role: "user", content: "你好" }]));

  expect(response.status).toBe(200);
  expect(generateAiConversationReply).not.toHaveBeenCalled();
  expect(generateSystemAiConversationReply).toHaveBeenCalledTimes(1);
  expect(await response.json()).toEqual({
   message: "你好，我们开始吧。",
   provider: "Google Gemini",
   model: "models/gemini-3.1-flash-lite",
   apiKeyId: null,
   usage: null,
  });
 });

 it("removes provider thinking on the legacy compatibility path", async () => {
  const credentials = [
   {
    id: "11111111-1111-4111-8111-111111111111",
    provider: "groq",
    defaultModel: "qwen/qwen3.6-27b",
    label: "Groq Free",
   },
  ];
  getActiveUserApiKeyCredentials.mockResolvedValue(credentials);
  generateAiConversationReply.mockResolvedValue({
   data: "<think>internal reasoning must stay hidden</think>\n\n你好！最近过得怎么样？",
   error: null,
  });

  const response = await post(requestBody([{ role: "user", content: "你好" }]));

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
   message: "你好！最近过得怎么样？",
   provider: "Groq",
   model: "qwen/qwen3.6-27b",
  });
 });

 it("uses the explicitly selected active key without silent fallback", async () => {
  const credentials = [
   {
    id: "11111111-1111-4111-8111-111111111111",
    provider: "groq",
    defaultModel: "openai/gpt-oss-20b",
    label: "Groq Free",
   },
   {
    id: "22222222-2222-4222-8222-222222222222",
    provider: "gemini",
    defaultModel: "models/gemini-3.5-flash",
    label: "Gemini",
   },
  ];
  getActiveUserApiKeyCredentials.mockResolvedValue(credentials);
  generateAiConversationReply.mockResolvedValue({ data: "我们开始吧。", error: null });

  const response = await post(
   requestBody([{ role: "user", content: "开始吧" }], "22222222-2222-4222-8222-222222222222"),
  );

  expect(response.status).toBe(200);
  const [, options] = generateAiConversationReply.mock.calls[0];
  expect(options.userApiKeys).toEqual([credentials[1]]);
  expect(generateSystemAiConversationReply).not.toHaveBeenCalled();
 });

 it("keeps the profile plus the latest 19 messages on the legacy compatibility path", async () => {
  const credentials = [
   {
    id: "11111111-1111-4111-8111-111111111111",
    provider: "groq",
    defaultModel: "openai/gpt-oss-20b",
    label: "Groq Free",
   },
  ];
  getActiveUserApiKeyCredentials.mockResolvedValue(credentials);
  generateAiConversationReply.mockResolvedValue({ data: "继续吧", error: null });
  const roles: AiConversationMessage["role"][] = ["user", "assistant"];
  const messages: AiConversationMessage[] = Array.from({ length: 24 }, (_, index) => ({
   role: roles[index % roles.length] ?? "user",
   content: `message-${index}`,
  }));

  await post(requestBody(messages));

  const [forwardedMessages] = generateAiConversationReply.mock.calls[0];
  expect(forwardedMessages).toHaveLength(20);
  expect(forwardedMessages[1].content).toBe("message-5");
  expect(forwardedMessages.at(-1)?.content).toBe("message-23");
 });
});
