import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";
import type { Database } from "@/types/supabase.generated";

import type { AiConversationPersistedMessage } from "./ai-conversation-session.schemas";
import type { PreparedPersistedAiConversationTurn } from "./ai-conversation-turn.server";

const {
 appendAiConversationMessage,
 dispatchAiConversationPostTurnWorkflow,
 findAssistantReplyForUserMessage,
 loadAiConversationContextState,
 loadRecentAiConversationMessages,
 preparePersistedAiConversationTurn,
 recordUserAiRuntimeActivity,
 streamAiConversationProviderReply,
} = vi.hoisted(() => ({
 appendAiConversationMessage: vi.fn(),
 dispatchAiConversationPostTurnWorkflow: vi.fn(),
 findAssistantReplyForUserMessage: vi.fn(),
 loadAiConversationContextState: vi.fn(),
 loadRecentAiConversationMessages: vi.fn(),
 preparePersistedAiConversationTurn: vi.fn(),
 recordUserAiRuntimeActivity: vi.fn(),
 streamAiConversationProviderReply: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./ai-conversation-persistence.server", () => ({
 appendAiConversationMessage,
 findAssistantReplyForUserMessage,
 loadAiConversationContextState,
 loadRecentAiConversationMessages,
}));
vi.mock("./ai-conversation-turn.server", () => ({ preparePersistedAiConversationTurn }));
vi.mock("./ai-conversation-post-turn.workflow", () => ({
 dispatchAiConversationPostTurnWorkflow,
}));
vi.mock("@/services/ai-runtime.service", () => ({ recordUserAiRuntimeActivity }));
vi.mock("./ai-conversation-stream-provider.server", () => ({
 AiConversationProviderStreamError: class AiConversationProviderStreamError extends Error {
  readonly code = "provider-unavailable";
  readonly status = 503;
 },
 streamAiConversationProviderReply,
}));

import { createPersistedAiConversationTurnStream } from "./ai-conversation-stream-turn.server";

const supabase = createClient<Database>("https://example.supabase.co", "test-key", {
 auth: { autoRefreshToken: false, persistSession: false },
});
const conversationId = "11111111-1111-4111-8111-111111111111";
const userMessage: AiConversationPersistedMessage = {
 id: "22222222-2222-4222-8222-222222222222",
 seq: 1,
 role: "user",
 content: "你好",
 createdAt: "2026-08-19T08:00:00+00:00",
};
const assistantMessage: AiConversationPersistedMessage = {
 id: "33333333-3333-4333-8333-333333333333",
 seq: 2,
 role: "assistant",
 content: "你好，今天怎么样？",
 createdAt: "2026-08-19T08:00:01+00:00",
};
const runtime: ResolvedUserAiRuntime = {
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

type SuccessfulPreparation = Extract<PreparedPersistedAiConversationTurn, { ok: true }>;

function successfulPreparation(): SuccessfulPreparation {
 return {
  ok: true,
  runtime: { ...runtime, taskId: "conversation.reply", resolutionSource: "auto" },
  conversationMessages: [{ role: "user", content: "你好" }],
  systemPrompt: "Stay natural.",
 };
}

async function* completedProviderStream() {
 yield "你好，";
 yield "今天怎么样？";
}

function parseEvents(text: string) {
 return text
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));
}

describe("persisted AI conversation turn stream", () => {
 beforeEach(() => {
  appendAiConversationMessage.mockReset();
  dispatchAiConversationPostTurnWorkflow.mockReset();
  findAssistantReplyForUserMessage.mockReset();
  loadAiConversationContextState.mockReset();
  loadRecentAiConversationMessages.mockReset();
  preparePersistedAiConversationTurn.mockReset();
  recordUserAiRuntimeActivity.mockReset();
  streamAiConversationProviderReply.mockReset();

  appendAiConversationMessage
   .mockResolvedValueOnce(userMessage)
   .mockResolvedValueOnce(assistantMessage);
  findAssistantReplyForUserMessage.mockResolvedValue(null);
  loadAiConversationContextState.mockResolvedValue({});
  loadRecentAiConversationMessages.mockResolvedValue([userMessage]);
  preparePersistedAiConversationTurn.mockResolvedValue(successfulPreparation());
  streamAiConversationProviderReply.mockImplementation(() => completedProviderStream());
 });

 it("persists the user before streaming and the assistant only after the provider completes", async () => {
  const result = await createPersistedAiConversationTurnStream({
   supabase,
   userId: "user-1",
   conversationId,
   clientMessageId: "55555555-5555-4555-8555-555555555555",
   content: "你好",
   requestSignal: new AbortController().signal,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const events = parseEvents(await result.response.text());

  expect(appendAiConversationMessage).toHaveBeenNthCalledWith(
   1,
   expect.objectContaining({
    role: "user",
    clientMessageId: "55555555-5555-4555-8555-555555555555",
   }),
  );
  expect(appendAiConversationMessage).toHaveBeenNthCalledWith(
   2,
   expect.objectContaining({
    role: "assistant",
    content: "你好，今天怎么样？",
    replyToMessageId: userMessage.id,
    metadata: expect.objectContaining({ provider: "groq" }),
   }),
  );
  expect(events.map((event) => event.type)).toEqual(["start", "delta", "delta", "final"]);
 });

 it("replays an already persisted assistant response without calling the provider again", async () => {
  appendAiConversationMessage.mockReset();
  appendAiConversationMessage.mockResolvedValue(userMessage);
  findAssistantReplyForUserMessage.mockResolvedValue({
   message: assistantMessage,
   provider: "Groq",
   model: runtime.model,
   apiKeyId: runtime.keyId,
   runtimeReceipt: null,
  });

  const result = await createPersistedAiConversationTurnStream({
   supabase,
   userId: "user-1",
   conversationId,
   clientMessageId: "55555555-5555-4555-8555-555555555555",
   content: "你好",
   requestSignal: new AbortController().signal,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const events = parseEvents(await result.response.text());
  expect(events.map((event) => event.type)).toEqual(["start", "final"]);
  expect(preparePersistedAiConversationTurn).not.toHaveBeenCalled();
  expect(streamAiConversationProviderReply).not.toHaveBeenCalled();
  expect(appendAiConversationMessage).toHaveBeenCalledTimes(1);
 });

 it("keeps a cancelled partial assistant reply out of persistence", async () => {
  async function* abortableProviderStream(input: { signal?: AbortSignal }) {
   yield "partial reply";
   await new Promise<void>((resolve) => {
    if (input.signal?.aborted) {
     resolve();
     return;
    }
    input.signal?.addEventListener("abort", () => resolve(), { once: true });
   });
  }
  streamAiConversationProviderReply.mockImplementation((input) => abortableProviderStream(input));

  const result = await createPersistedAiConversationTurnStream({
   supabase,
   userId: "user-1",
   conversationId,
   clientMessageId: "55555555-5555-4555-8555-555555555555",
   content: "你好",
   requestSignal: new AbortController().signal,
  });

  expect(result.ok).toBe(true);
  if (!result.ok || result.response.body === null) return;
  const reader = result.response.body.getReader();
  await reader.read();
  await reader.cancel();
  await Promise.resolve();
  await Promise.resolve();

  expect(appendAiConversationMessage).toHaveBeenCalledTimes(1);
  expect(appendAiConversationMessage).toHaveBeenCalledWith(
   expect.objectContaining({ role: "user" }),
  );
 });
});
