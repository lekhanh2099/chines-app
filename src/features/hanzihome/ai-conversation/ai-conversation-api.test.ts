import { afterEach, describe, expect, it, vi } from "vitest";

import {
 archiveAiConversation,
 createAiConversation,
 fetchAiConversationHistory,
 fetchAiConversationRuntimeHealth,
 fetchAiConversationSession,
 sendPersistedAiConversationMessage,
 updateAiConversationMemoryPolicy,
 updateAiConversationSettings,
} from "./ai-conversation-api";

const conversationId = "11111111-1111-4111-8111-111111111111";
const characterId = "22222222-2222-4222-8222-222222222222";
const clientMessageId = "33333333-3333-4333-8333-333333333333";
const apiKeyId = "66666666-6666-4666-8666-666666666666";

const sessionResponse = {
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

function ndjsonResponse(events: readonly object[]) {
 return new Response(events.map((event) => JSON.stringify(event)).join("\n") + "\n", {
  status: 200,
  headers: { "Content-Type": "application/x-ndjson" },
 });
}

describe("AI conversation client transport", () => {
 afterEach(() => {
  vi.unstubAllGlobals();
 });

 it("loads a specific persisted session without sending transcript state", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(sessionResponse));
  vi.stubGlobal("fetch", fetchMock);

  await fetchAiConversationSession({ conversationId });

  const expectedBody = JSON.stringify({ action: "session", conversationId });
  expect(fetchMock).toHaveBeenCalledWith(
   "/api/ai/conversation",
   expect.objectContaining({ method: "POST", body: expectedBody }),
  );
  expect(expectedBody).not.toContain('"messages"');
  expect(expectedBody).not.toContain('"profile"');
 });

 it("lists bounded conversation metadata through a dedicated command", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json([
    {
     id: conversationId,
     characterId,
     title: "周末计划",
     mode: "natural",
     memoryPolicy: "inherit",
     lastMessageAt: null,
     createdAt: "2026-08-18T03:00:00+00:00",
     updatedAt: "2026-08-18T03:00:00+00:00",
    },
   ]),
  );
  vi.stubGlobal("fetch", fetchMock);

  await fetchAiConversationHistory();

  expect(fetchMock).toHaveBeenCalledWith(
   "/api/ai/conversation",
   expect.objectContaining({ body: JSON.stringify({ action: "history" }) }),
  );
 });

 it("creates a new backend-owned conversation without client character identity", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(sessionResponse));
  vi.stubGlobal("fetch", fetchMock);

  await createAiConversation();

  const expectedBody = JSON.stringify({ action: "create-conversation" });
  expect(fetchMock).toHaveBeenCalledWith(
   "/api/ai/conversation",
   expect.objectContaining({ body: expectedBody }),
  );
  expect(expectedBody).not.toContain("characterId");
  expect(expectedBody).not.toContain("profile");
 });

 it("updates no-memory policy without claiming temporary transcript semantics", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json({
    conversationId,
    memoryPolicy: "disabled",
    memoryEnabled: false,
   }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await updateAiConversationMemoryPolicy(conversationId, "disabled");

  expect(fetchMock).toHaveBeenCalledWith(
   "/api/ai/conversation",
   expect.objectContaining({
    body: JSON.stringify({
     action: "update-memory-policy",
     conversationId,
     memoryPolicy: "disabled",
    }),
   }),
  );
 });

 it("archives through a recoverable lifecycle command instead of a browser delete", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ conversationId, archived: true }));
  vi.stubGlobal("fetch", fetchMock);

  await archiveAiConversation(conversationId);

  expect(fetchMock).toHaveBeenCalledWith(
   "/api/ai/conversation",
   expect.objectContaining({
    method: "POST",
    body: JSON.stringify({ action: "archive-conversation", conversationId }),
   }),
  );
 });

 it("persists conversation behavior without legacy browser profile fields", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json({
    conversationId,
    characterId,
    mode: "grammar-coach",
    correctionStyle: "strict",
    replyMode: "chinese",
    learnerLevel: "advanced",
   }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await updateAiConversationSettings(conversationId, {
   mode: "grammar-coach",
   correctionStyle: "strict",
   replyMode: "chinese",
   learnerLevel: "advanced",
  });

  const expectedBody = JSON.stringify({
   action: "update-settings",
   conversationId,
   mode: "grammar-coach",
   correctionStyle: "strict",
   replyMode: "chinese",
   learnerLevel: "advanced",
  });
  expect(fetchMock).toHaveBeenCalledWith(
   "/api/ai/conversation",
   expect.objectContaining({
    method: "POST",
    body: expectedBody,
   }),
  );
  expect(expectedBody).not.toContain('"profile"');
  expect(expectedBody).not.toContain('"persona"');
 });

 it("streams only the new persisted turn command and returns the final saved turn", async () => {
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
  const turn = {
   conversationId,
   userMessage,
   assistantMessage,
   provider: "Groq",
   model: "openai/gpt-oss-20b",
   apiKeyId,
   usage: null,
  };
  const fetchMock = vi
   .fn()
   .mockResolvedValue(
    ndjsonResponse([
     { type: "start", conversationId, userMessage },
     { type: "delta", text: "你好，" },
     { type: "heartbeat" },
     { type: "delta", text: "今天怎么样？" },
     { type: "final", turn },
    ]),
   );
  vi.stubGlobal("fetch", fetchMock);

  const result = await sendPersistedAiConversationMessage(conversationId, {
   clientMessageId,
   content: "你好",
  });

  const expectedBody = JSON.stringify({ conversationId, clientMessageId, content: "你好" });
  expect(result).toEqual(turn);
  expect(fetchMock).toHaveBeenCalledWith(
   "/api/ai/conversation/stream",
   expect.objectContaining({
    method: "POST",
    body: expectedBody,
    headers: expect.objectContaining({ Accept: "application/x-ndjson" }),
   }),
  );
  expect(expectedBody).not.toContain('"messages"');
  expect(expectedBody).not.toContain('"profile"');
  expect(expectedBody).not.toContain('"action"');
 });

 it("treats automatic runtime as personal-BYOK-only when no active key exists", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json({
    status: "missing-key",
    reason: "no-active-key",
    activeKeyCount: 0,
    usableKeyCount: 0,
    selectedKey: null,
    capabilities: [],
   }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const health = await fetchAiConversationRuntimeHealth();

  expect(health).toEqual({
   ready: false,
   code: "key-unavailable",
   provider: null,
   model: null,
   source: "personal",
  });
  expect(fetchMock).toHaveBeenCalledWith(
   "/api/ai/runtime",
   expect.objectContaining({ method: "GET" }),
  );
  expect(fetchMock).not.toHaveBeenCalledWith(
   "/api/ai/conversation",
   expect.objectContaining({ body: expect.stringContaining('"action":"health"') }),
  );
 });
});
