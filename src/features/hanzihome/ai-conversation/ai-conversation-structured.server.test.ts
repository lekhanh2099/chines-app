import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { Database } from "@/types/supabase.generated";

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
vi.mock("./ai-conversation-system.server", () => ({ generateSystemAiConversationReply }));

import { generateStructuredAiConversationData } from "./ai-conversation-structured.server";

const supabase = createClient<Database>("https://example.supabase.co", "test-key", {
 auth: { autoRefreshToken: false, persistSession: false },
});
const schema = z.strictObject({ value: z.string() });
const personalKey = {
 id: "11111111-1111-4111-8111-111111111111",
 userId: "user-1",
 provider: "groq",
 label: "Groq",
 maskedKey: "gsk_***",
 isActive: true,
 priority: 0,
 defaultModel: "qwen/qwen3.6-27b",
 lastValidatedAt: null,
 createdAt: "2026-08-18T00:00:00.000Z",
 updatedAt: "2026-08-18T00:00:00.000Z",
 apiKey: "gsk-test",
};

describe("AI conversation structured adapter", () => {
 beforeEach(() => {
  generateAiConversationReply.mockReset();
  generateSystemAiConversationReply.mockReset();
  getActiveUserApiKeyCredentials.mockReset();
 });

 it("uses a valid personal-key structured response directly", async () => {
  getActiveUserApiKeyCredentials.mockResolvedValue([personalKey]);
  generateAiConversationReply.mockResolvedValue({ data: '{"value":"personal"}', error: null });

  const result = await generateStructuredAiConversationData({
   supabase,
   userId: "user-1",
   systemPrompt: "Return JSON",
   prompt: "small prompt",
   schema,
  });

  expect(result).toEqual({ data: { value: "personal" }, error: null });
  expect(generateSystemAiConversationReply).not.toHaveBeenCalled();
 });

 it("falls back to system Gemini when the personal runtime cannot produce valid structured data", async () => {
  getActiveUserApiKeyCredentials.mockResolvedValue([personalKey]);
  generateAiConversationReply.mockResolvedValue({ data: "not-json", error: null });
  generateSystemAiConversationReply.mockResolvedValue({ data: '{"value":"system"}', error: null });

  const result = await generateStructuredAiConversationData({
   supabase,
   userId: "user-1",
   systemPrompt: "Return JSON",
   prompt: "small prompt",
   schema,
  });

  expect(result).toEqual({ data: { value: "system" }, error: null });
  expect(generateSystemAiConversationReply).toHaveBeenCalledTimes(1);
 });

 it("rejects an oversized structured prompt before calling a provider", async () => {
  getActiveUserApiKeyCredentials.mockResolvedValue([personalKey]);

  const result = await generateStructuredAiConversationData({
   supabase,
   userId: "user-1",
   systemPrompt: "Return JSON",
   prompt: "x".repeat(6001),
   schema,
  });

  expect(result.data).toBeNull();
  expect(result.error).toContain("bounded prompt contract");
  expect(generateAiConversationReply).not.toHaveBeenCalled();
  expect(generateSystemAiConversationReply).not.toHaveBeenCalled();
 });
});
