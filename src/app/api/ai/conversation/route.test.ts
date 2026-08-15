import type { JsonFieldValue } from "@/types/json";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    body: JSON.stringify({ messages: [{ role: "user" }] }),
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
    body: JSON.stringify({ messages: [{ role: "user", content: "你好" }] }),
   }),
  );

  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ code: "AI_API_KEY_REQUIRED" });
  expect(generateAiConversationReply).not.toHaveBeenCalled();
 });

 it("uses the authenticated user's managed credentials and validates the response", async () => {
  const supabase = {};
  const user = { id: "user-1" };
  const credentials = [{ id: "key-1" }];
  getActiveUserApiKeyCredentials.mockResolvedValue(credentials);
  generateAiConversationReply.mockResolvedValue({ data: "你好，今天学习什么？", error: null });

  const response = await POST(
   new Request("https://app.example/api/ai/conversation", {
    method: "POST",
    body: JSON.stringify({ messages: [{ role: "user", content: "你好" }] }),
   }),
  );

  expect(response.status).toBe(200);
  expect(generateAiConversationReply).toHaveBeenCalledWith(
   [{ role: "user", content: "你好" }],
   expect.objectContaining({ userApiKeys: credentials }),
  );
  expect(await response.json()).toEqual({ message: "你好，今天学习什么？" });
  expect(user.id).toBe("user-1");
  expect(supabase).toEqual({});
 });
});
