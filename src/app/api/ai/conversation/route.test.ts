import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
 DEFAULT_AI_CONVERSATION_PROFILE,
 type AiConversationMessage,
} from "@/features/hanzihome/ai-conversation/ai-conversation.schemas";

const {
 getActiveUserApiKeyCredentials,
 generateAiConversationReply,
 generateSystemAiConversationReply,
 requireAuthenticatedRoute,
} = vi.hoisted(() => ({
 getActiveUserApiKeyCredentials: vi.fn(),
 generateAiConversationReply: vi.fn(),
 generateSystemAiConversationReply: vi.fn(),
 requireAuthenticatedRoute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/services/user-api-keys.service", () => ({ getActiveUserApiKeyCredentials }));
vi.mock("@/services/ai.service", () => ({ generateAiConversationReply }));
vi.mock("@/features/hanzihome/ai-conversation/ai-conversation-system.server", () => ({
 generateSystemAiConversationReply,
 SYSTEM_AI_CONVERSATION_PROVIDER: "Google Gemini",
 SYSTEM_AI_CONVERSATION_MODEL: "models/gemini-3.1-flash-lite",
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

describe("/api/ai/conversation", () => {
 beforeEach(() => {
  getActiveUserApiKeyCredentials.mockReset();
  generateAiConversationReply.mockReset();
  generateSystemAiConversationReply.mockReset();
  requireAuthenticatedRoute.mockReset();
  requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: {}, user: { id: "user-1" } },
  });
 });

 it("rejects malformed messages before provider access", async () => {
  const response = await POST(
   new Request("https://app.example/api/ai/conversation", {
    method: "POST",
    body: JSON.stringify({
     messages: [{ role: "user" }],
     profile: DEFAULT_AI_CONVERSATION_PROFILE,
    }),
   }),
  );

  expect(response.status).toBe(400);
  expect(getActiveUserApiKeyCredentials).not.toHaveBeenCalled();
 });

 it("requires a validated conversation profile", async () => {
  const response = await POST(
   new Request("https://app.example/api/ai/conversation", {
    method: "POST",
    body: JSON.stringify({ messages: [{ role: "user", content: "你好" }] }),
   }),
  );

  expect(response.status).toBe(400);
  expect(getActiveUserApiKeyCredentials).not.toHaveBeenCalled();
 });

 it("uses the system Gemini runtime when no personal key is active", async () => {
  getActiveUserApiKeyCredentials.mockResolvedValue([]);
  generateSystemAiConversationReply.mockResolvedValue({
   data: "你好，我们开始吧。",
   error: null,
  });

  const response = await POST(
   new Request("https://app.example/api/ai/conversation", {
    method: "POST",
    body: JSON.stringify(requestBody([{ role: "user", content: "你好" }])),
   }),
  );

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

 it("prepends stable profile context and reports the selected personal runtime", async () => {
  const credentials = [
   {
    id: "11111111-1111-4111-8111-111111111111",
    provider: "groq",
    defaultModel: "openai/gpt-oss-20b",
    label: "Groq Free",
   },
  ];
  getActiveUserApiKeyCredentials.mockResolvedValue(credentials);
  generateAiConversationReply.mockResolvedValue({ data: "你好，今天学习什么？", error: null });

  const response = await POST(
   new Request("https://app.example/api/ai/conversation", {
    method: "POST",
    body: JSON.stringify(requestBody([{ role: "user", content: "你好" }])),
   }),
  );

  expect(response.status).toBe(200);
  expect(generateAiConversationReply).toHaveBeenCalledTimes(1);
  expect(generateSystemAiConversationReply).not.toHaveBeenCalled();
  const [messages, options] = generateAiConversationReply.mock.calls[0];
  expect(messages).toHaveLength(2);
  expect(messages[0]).toMatchObject({ role: "user" });
  expect(messages[0].content).toContain(DEFAULT_AI_CONVERSATION_PROFILE.displayName);
  expect(messages[0].content).toContain("Chủ đề người học quan tâm");
  expect(messages[1]).toEqual({ role: "user", content: "你好" });
  expect(options).toEqual(expect.objectContaining({ userApiKeys: credentials }));
  expect(await response.json()).toEqual({
   message: "你好，今天学习什么？",
   provider: "Groq",
   model: "openai/gpt-oss-20b",
   apiKeyId: "11111111-1111-4111-8111-111111111111",
   usage: null,
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

  const response = await POST(
   new Request("https://app.example/api/ai/conversation", {
    method: "POST",
    body: JSON.stringify(
     requestBody(
      [{ role: "user", content: "开始吧" }],
      "22222222-2222-4222-8222-222222222222",
     ),
   }),
  );

  expect(response.status).toBe(200);
  const [, options] = generateAiConversationReply.mock.calls[0];
  expect(options.userApiKeys).toEqual([credentials[1]]);
  expect(generateSystemAiConversationReply).not.toHaveBeenCalled();
  expect(await response.json()).toMatchObject({
   provider: "Google Gemini",
   apiKeyId: "22222222-2222-4222-8222-222222222222",
  });
 });

 it("rejects a selected key that is no longer active instead of using the system runtime", async () => {
  getActiveUserApiKeyCredentials.mockResolvedValue([
   {
    id: "11111111-1111-4111-8111-111111111111",
    provider: "groq",
    defaultModel: "openai/gpt-oss-20b",
    label: "Groq Free",
   },
  ]);

  const response = await POST(
   new Request("https://app.example/api/ai/conversation", {
    method: "POST",
    body: JSON.stringify(
     requestBody(
      [{ role: "user", content: "你好" }],
      "22222222-2222-4222-8222-222222222222",
     ),
   }),
  );

  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ code: "AI_API_KEY_UNAVAILABLE" });
  expect(generateAiConversationReply).not.toHaveBeenCalled();
  expect(generateSystemAiConversationReply).not.toHaveBeenCalled();
 });

 it("keeps the profile plus the latest 19 conversation messages", async () => {
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

  await POST(
   new Request("https://app.example/api/ai/conversation", {
    method: "POST",
    body: JSON.stringify(requestBody(messages)),
   }),
  );

  const [forwardedMessages] = generateAiConversationReply.mock.calls[0];
  expect(forwardedMessages).toHaveLength(20);
  expect(forwardedMessages[1].content).toBe("message-5");
  expect(forwardedMessages.at(-1)?.content).toBe("message-23");
 });
});
