import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
 DEFAULT_AI_CONVERSATION_PROFILE,
 type AiConversationMessage,
} from "@/features/hanzihome/ai-conversation/ai-conversation.schemas";

const { getActiveUserApiKeyCredentials, generateAiConversationReply, requireAuthenticatedRoute } =
 vi.hoisted(() => ({
  getActiveUserApiKeyCredentials: vi.fn(),
  generateAiConversationReply: vi.fn(),
  requireAuthenticatedRoute: vi.fn(),
 }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/user-api-keys.service", () => ({ getActiveUserApiKeyCredentials }));
vi.mock("@/services/ai.service", () => ({ generateAiConversationReply }));
vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute,
 apiError: (message: string, status: number, code?: string) =>
  Response.json({ error: message, ...(code ? { code } : {}) }, { status }),
 privateNoStoreJson: (body: JsonFieldValue) =>
  Response.json(body, { headers: { "Cache-Control": "private, no-store" } }),
}));

import { POST } from "./route";

const requestBody = (messages: AiConversationMessage[]) => ({
 messages,
 profile: DEFAULT_AI_CONVERSATION_PROFILE,
});

describe("/api/ai/conversation", () => {
 beforeEach(() => {
  getActiveUserApiKeyCredentials.mockReset();
  generateAiConversationReply.mockReset();
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

 it("returns the observable setup state when no managed key is active", async () => {
  getActiveUserApiKeyCredentials.mockResolvedValue([]);

  const response = await POST(
   new Request("https://app.example/api/ai/conversation", {
    method: "POST",
    body: JSON.stringify(requestBody([{ role: "user", content: "你好" }])),
   }),
  );

  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ code: "AI_API_KEY_REQUIRED" });
  expect(generateAiConversationReply).not.toHaveBeenCalled();
 });

 it("prepends stable profile context and reports the selected runtime", async () => {
  const credentials = [
   {
    id: "key-1",
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
  });
 });

 it("keeps the profile plus the latest 19 conversation messages", async () => {
  const credentials = [
   {
    id: "key-1",
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
