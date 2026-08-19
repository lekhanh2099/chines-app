import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 requireAuthenticatedRoute: vi.fn(),
 createPersistedAiConversationTurnStream: vi.fn(),
}));

vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 apiError: (message: string, status: number, code: string) =>
  Response.json({ error: message, code }, { status }),
}));
vi.mock("@/features/hanzihome/ai-conversation/ai-conversation-persistence.server", () => ({
 AiConversationPersistenceConfigurationError: class AiConversationPersistenceConfigurationError extends Error {},
 AiConversationPersistenceNotReadyError: class AiConversationPersistenceNotReadyError extends Error {},
 AiConversationPersistenceRequestError: class AiConversationPersistenceRequestError extends Error {
  readonly status = 500;
  readonly code = "PERSISTENCE_ERROR";
 },
}));
vi.mock("@/features/hanzihome/ai-conversation/ai-conversation-stream-turn.server", () => ({
 createPersistedAiConversationTurnStream: mocks.createPersistedAiConversationTurnStream,
}));

import { POST } from "./route";

const conversationId = "11111111-1111-4111-8111-111111111111";
const clientMessageId = "22222222-2222-4222-8222-222222222222";

function request(body: object) {
 return new Request("http://localhost/api/ai/conversation/stream", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });
}

describe("AI conversation stream route", () => {
 beforeEach(() => {
  mocks.requireAuthenticatedRoute.mockReset();
  mocks.createPersistedAiConversationTurnStream.mockReset();
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: { marker: "supabase" }, user: { id: "user-1" } },
  });
 });

 it("rejects unauthenticated requests before touching persistence", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: false,
   response: Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const response = await POST(
   request({ conversationId, clientMessageId, content: "你好" }),
  );

  expect(response.status).toBe(401);
  expect(mocks.createPersistedAiConversationTurnStream).not.toHaveBeenCalled();
 });

 it("rejects invalid stream payloads at the route boundary", async () => {
  const response = await POST(request({ conversationId: "bad", content: "你好" }));

  expect(response.status).toBe(400);
  expect(mocks.createPersistedAiConversationTurnStream).not.toHaveBeenCalled();
 });

 it("passes only the validated new turn to the persisted stream owner", async () => {
  const streamResponse = new Response('{"type":"heartbeat"}\n', {
   status: 200,
   headers: { "Content-Type": "application/x-ndjson" },
  });
  mocks.createPersistedAiConversationTurnStream.mockResolvedValue({
   ok: true,
   response: streamResponse,
  });

  const response = await POST(
   request({ conversationId, clientMessageId, content: "你好" }),
  );

  expect(response).toBe(streamResponse);
  expect(mocks.createPersistedAiConversationTurnStream).toHaveBeenCalledWith(
   expect.objectContaining({
    userId: "user-1",
    conversationId,
    clientMessageId,
    content: "你好",
   }),
  );
 });

 it("returns a normal API error when BYOK stream setup is blocked", async () => {
  mocks.createPersistedAiConversationTurnStream.mockResolvedValue({
   ok: false,
   status: 409,
   code: "AI_API_KEY_REQUIRED",
   message: "Chưa có API key AI đang hoạt động.",
  });

  const response = await POST(
   request({ conversationId, clientMessageId, content: "你好" }),
  );
  const body = await response.json();

  expect(response.status).toBe(409);
  expect(body).toMatchObject({ code: "AI_API_KEY_REQUIRED" });
 });
});
