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
import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";

const mocks = vi.hoisted(() => {
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
  checkPersonalConversationRuntime: vi.fn(),
  createAiConversationSession: vi.fn(),
  ensureAiConversationSession: vi.fn(),
  findAssistantReplyForUserMessage: vi.fn(),
  generatePersistedAiConversationTurn: vi.fn(),
  listAiConversationHistory: vi.fn(),
  loadAiConversationContextState: vi.fn(),
  loadAiConversationSession: vi.fn(),
  loadLatestAiConversationSession: vi.fn(),
  loadRecentAiConversationMessages: vi.fn(),
  requireAuthenticatedRoute: vi.fn(),
  resolveUserAiRuntime: vi.fn(),
  streamAiConversationProviderReply: vi.fn(),
  updateAiConversationMemoryPolicy: vi.fn(),
  updateAiConversationSettings: vi.fn(),
 };
});

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/ai-conversation/ai-conversation-health.server", () => ({
 checkPersonalConversationRuntime: mocks.checkPersonalConversationRuntime,
}));
vi.mock("@/features/hanzihome/ai-conversation/ai-conversation-persistence.server", () => ({
 AiConversationPersistenceConfigurationError: mocks.PersistenceConfigurationError,
 AiConversationPersistenceNotReadyError: mocks.PersistenceNotReadyError,
 AiConversationPersistenceRequestError: mocks.PersistenceRequestError,
 appendAiConversationMessage: mocks.appendAiConversationMessage,
 archiveAiConversation: mocks.archiveAiConversation,
 createAiConversationSession: mocks.createAiConversationSession,
 ensureAiConversationSession: mocks.ensureAiConversationSession,
 findAssistantReplyForUserMessage: mocks.findAssistantReplyForUserMessage,
 listAiConversationHistory: mocks.listAiConversationHistory,
 loadAiConversationContextState: mocks.loadAiConversationContextState,
 loadAiConversationSession: mocks.loadAiConversationSession,
 loadLatestAiConversationSession: mocks.loadLatestAiConversationSession,
 loadRecentAiConversationMessages: mocks.loadRecentAiConversationMessages,
 updateAiConversationMemoryPolicy: mocks.updateAiConversationMemoryPolicy,
 updateAiConversationSettings: mocks.updateAiConversationSettings,
}));
vi.mock("@/features/hanzihome/ai-conversation/ai-conversation-stream-provider.server", () => ({
 streamAiConversationProviderReply: mocks.streamAiConversationProviderReply,
}));
vi.mock("@/features/hanzihome/ai-conversation/ai-conversation-turn.server", () => ({
 generatePersistedAiConversationTurn: mocks.generatePersistedAiConversationTurn,
}));
vi.mock("@/services/ai-runtime.service", () => ({
 resolveUserAiRuntime: mocks.resolveUserAiRuntime,
}));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { POST } from "./route";

const conversationId = "33333333-3333-4333-8333-333333333333";
const characterId = "66666666-6666-4666-8666-666666666666";
const runtime: ResolvedUserAiRuntime = {
 keyId: "44444444-4444-4444-8444-444444444444",
 provider: "groq",
 providerLabel: "Groq",
 label: "Groq chính",
 maskedKey: "gsk_***",
 model: "openai/gpt-oss-20b",
 priority: 0,
 apiKey: "gsk-personal",
 capabilities: ["conversation", "structured-memory"],
};
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

function requestBody(messages: AiConversationMessage[], apiKeyId?: string) {
 return {
  messages,
  profile: DEFAULT_AI_CONVERSATION_PROFILE,
  ...(apiKeyId ? { apiKeyId } : {}),
 };
}

async function* providerReply(...parts: string[]) {
 for (const part of parts) yield part;
}

describe("/api/ai/conversation", () => {
 beforeEach(() => {
  for (const mock of [
   mocks.appendAiConversationMessage,
   mocks.archiveAiConversation,
   mocks.checkPersonalConversationRuntime,
   mocks.createAiConversationSession,
   mocks.ensureAiConversationSession,
   mocks.findAssistantReplyForUserMessage,
   mocks.generatePersistedAiConversationTurn,
   mocks.listAiConversationHistory,
   mocks.loadAiConversationContextState,
   mocks.loadAiConversationSession,
   mocks.loadLatestAiConversationSession,
   mocks.loadRecentAiConversationMessages,
   mocks.requireAuthenticatedRoute,
   mocks.resolveUserAiRuntime,
   mocks.streamAiConversationProviderReply,
   mocks.updateAiConversationMemoryPolicy,
   mocks.updateAiConversationSettings,
  ]) {
   mock.mockReset();
  }
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: { marker: "supabase" }, user: { id: "user-1" } },
  });
  mocks.resolveUserAiRuntime.mockResolvedValue({ ok: true, runtime });
  mocks.loadAiConversationContextState.mockResolvedValue(contextState);
 });

 it("rejects unauthenticated requests before touching runtime or persistence", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const response = await post({ action: "session" });

  expect(response.status).toBe(401);
  expect(mocks.resolveUserAiRuntime).not.toHaveBeenCalled();
  expect(mocks.loadLatestAiConversationSession).not.toHaveBeenCalled();
 });

 it("loads persisted history without requiring an AI key", async () => {
  mocks.loadLatestAiConversationSession.mockResolvedValue(persistedSession);

  const response = await post({ action: "session" });

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(persistedSession);
  expect(mocks.resolveUserAiRuntime).not.toHaveBeenCalled();
 });

 it("keeps persistence configuration errors distinct", async () => {
  mocks.loadLatestAiConversationSession.mockRejectedValue(
   new mocks.PersistenceConfigurationError(),
  );

  const response = await post({ action: "session" });

  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ code: "AI_PERSISTENCE_CONFIG_MISSING" });
 });

 it("keeps non-AI settings updates independent from runtime readiness", async () => {
  mocks.updateAiConversationSettings.mockResolvedValue({
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
  expect(mocks.resolveUserAiRuntime).not.toHaveBeenCalled();
 });

 it("persists one backend-owned turn through the strict persisted generator", async () => {
  mocks.appendAiConversationMessage
   .mockResolvedValueOnce(userMessage)
   .mockResolvedValueOnce(assistantMessage);
  mocks.findAssistantReplyForUserMessage.mockResolvedValue(null);
  mocks.loadRecentAiConversationMessages.mockResolvedValue([userMessage]);
  mocks.generatePersistedAiConversationTurn.mockResolvedValue({
   ok: true,
   message: assistantMessage.content,
   provider: runtime.providerLabel,
   model: runtime.model,
   apiKeyId: runtime.keyId,
  });

  const response = await post({
   action: "message",
   conversationId,
   clientMessageId: "55555555-5555-4555-8555-555555555555",
   content: userMessage.content,
  });

  expect(response.status).toBe(200);
  expect(mocks.generatePersistedAiConversationTurn).toHaveBeenCalledWith(
   expect.objectContaining({
    userId: "user-1",
    recentMessages: [userMessage],
    contextState,
   }),
  );
  expect(mocks.appendAiConversationMessage).toHaveBeenNthCalledWith(
   2,
   expect.objectContaining({
    role: "assistant",
    replyToMessageId: userMessage.id,
    metadata: {
     provider: runtime.providerLabel,
     model: runtime.model,
     apiKeyId: runtime.keyId,
    },
   }),
  );
 });

 it("replays an already persisted assistant without another provider turn", async () => {
  mocks.appendAiConversationMessage.mockResolvedValue(userMessage);
  mocks.findAssistantReplyForUserMessage.mockResolvedValue({
   message: assistantMessage,
   provider: runtime.providerLabel,
   model: runtime.model,
   apiKeyId: runtime.keyId,
  });

  const response = await post({
   action: "message",
   conversationId,
   clientMessageId: "55555555-5555-4555-8555-555555555555",
   content: userMessage.content,
  });

  expect(response.status).toBe(200);
  expect(mocks.generatePersistedAiConversationTurn).not.toHaveBeenCalled();
  expect(mocks.appendAiConversationMessage).toHaveBeenCalledTimes(1);
 });

 it("reports Auto health as unavailable when no personal conversation runtime exists", async () => {
  mocks.resolveUserAiRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "no-active-key",
  });

  const response = await post({ action: "health" });

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
   ready: false,
   code: "key-unavailable",
   source: "personal",
  });
  expect(mocks.checkPersonalConversationRuntime).not.toHaveBeenCalled();
 });

 it("checks only the resolved personal runtime for health", async () => {
  mocks.checkPersonalConversationRuntime.mockResolvedValue({
   ready: true,
   code: "ready",
   provider: runtime.providerLabel,
   model: runtime.model,
   source: "personal",
  });

  const response = await post({ action: "health" });

  expect(response.status).toBe(200);
  expect(mocks.resolveUserAiRuntime).toHaveBeenCalledWith(
   expect.objectContaining({ capability: "conversation" }),
  );
  expect(mocks.checkPersonalConversationRuntime).toHaveBeenCalledWith(
   runtime,
   expect.any(AbortSignal),
  );
 });

 it("blocks the legacy compatibility path instead of using a system provider", async () => {
  mocks.resolveUserAiRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "no-active-key",
  });

  const response = await post(requestBody([{ role: "user", content: "你好" }]));

  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ code: "AI_API_KEY_REQUIRED" });
  expect(mocks.streamAiConversationProviderReply).not.toHaveBeenCalled();
 });

 it("sanitizes the personal provider response on the legacy compatibility path", async () => {
  mocks.streamAiConversationProviderReply.mockImplementation(() =>
   providerReply(
    "<think>internal reasoning must stay hidden</think>",
    "\n\n你好！最近过得怎么样？",
   ),
  );

  const response = await post(requestBody([{ role: "user", content: "你好" }]));

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
   message: "你好！最近过得怎么样？",
   provider: runtime.providerLabel,
   model: runtime.model,
   apiKeyId: runtime.keyId,
  });
  expect(mocks.streamAiConversationProviderReply).toHaveBeenCalledWith(
   expect.objectContaining({ runtime }),
  );
 });

 it("preserves explicit personal key selection without fallback", async () => {
  mocks.streamAiConversationProviderReply.mockImplementation(() => providerReply("我们开始吧。"));
  const selectedId = "77777777-7777-4777-8777-777777777777";

  const response = await post(requestBody([{ role: "user", content: "开始吧" }], selectedId));

  expect(response.status).toBe(200);
  expect(mocks.resolveUserAiRuntime).toHaveBeenCalledWith(
   expect.objectContaining({ capability: "conversation", apiKeyId: selectedId }),
  );
 });
});
