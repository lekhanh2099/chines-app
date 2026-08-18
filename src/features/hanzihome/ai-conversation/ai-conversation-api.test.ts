import { afterEach, describe, expect, it, vi } from "vitest";

import {
 fetchAiConversationSession,
 sendPersistedAiConversationMessage,
} from "./ai-conversation-api";
import { DEFAULT_AI_CONVERSATION_PROFILE } from "./ai-conversation.schemas";

const conversationId = "11111111-1111-4111-8111-111111111111";
const characterId = "22222222-2222-4222-8222-222222222222";
const clientMessageId = "33333333-3333-4333-8333-333333333333";

function persistedMessage({
 id,
 seq,
 role,
 content,
}: {
 id: string;
 seq: number;
 role: "user" | "assistant";
 content: string;
}) {
 return {
  id,
  seq,
  role,
  content,
  createdAt: `2026-08-18T03:00:0${seq}+00:00`,
 };
}

describe("AI conversation client transport", () => {
 afterEach(() => {
  vi.unstubAllGlobals();
 });

 it("loads persisted session through the registered POST route", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json({
    conversation: {
     id: conversationId,
     characterId,
     title: "",
     mode: "natural",
     correctionStyle: "balanced",
     replyMode: "adaptive",
     memoryPolicy: "inherit",
    },
    messages: [],
   }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await fetchAiConversationSession();

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(
   "/api/ai/conversation",
   expect.objectContaining({
    method: "POST",
    body: JSON.stringify({ action: "session" }),
   }),
  );
 });

 it("sends only the new turn command instead of transcript or local profile", async () => {
  const userMessage = persistedMessage({
   id: "44444444-4444-4444-8444-444444444444",
   seq: 1,
   role: "user",
   content: "你好",
  });
  const assistantMessage = persistedMessage({
   id: "55555555-5555-4555-8555-555555555555",
   seq: 2,
   role: "assistant",
   content: "你好，今天怎么样？",
  });
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json({
    conversationId,
    userMessage,
    assistantMessage,
    provider: "Groq",
    model: "openai/gpt-oss-20b",
    apiKeyId: null,
    usage: null,
   }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await sendPersistedAiConversationMessage(conversationId, {
   clientMessageId,
   content: "你好",
   profile: DEFAULT_AI_CONVERSATION_PROFILE,
  });

  const expectedBody = JSON.stringify({
   action: "message",
   conversationId,
   clientMessageId,
   content: "你好",
  });
  expect(fetchMock).toHaveBeenCalledWith(
   "/api/ai/conversation",
   expect.objectContaining({
    method: "POST",
    body: expectedBody,
   }),
  );
  expect(expectedBody).not.toContain('"messages"');
  expect(expectedBody).not.toContain('"profile"');
  expect(expectedBody).not.toContain(DEFAULT_AI_CONVERSATION_PROFILE.displayName);
 });
});
