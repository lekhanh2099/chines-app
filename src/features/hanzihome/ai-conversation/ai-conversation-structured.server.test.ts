import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";
import type { Database } from "@/types/supabase.generated";

const {
 recordUserAiRuntimeActivity,
 recordUserAiTaskBlockedActivity,
 resolveUserAiTaskRuntime,
 streamAiConversationProviderReply,
} = vi.hoisted(() => ({
 recordUserAiRuntimeActivity: vi.fn(),
 recordUserAiTaskBlockedActivity: vi.fn(),
 resolveUserAiTaskRuntime: vi.fn(),
 streamAiConversationProviderReply: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/services/ai-runtime.service", () => ({
 recordUserAiRuntimeActivity,
 recordUserAiTaskBlockedActivity,
 resolveUserAiTaskRuntime,
}));
vi.mock("./ai-conversation-stream-provider.server", () => ({
 AiConversationProviderStreamError: class AiConversationProviderStreamError extends Error {},
 streamAiConversationProviderReply,
}));

import { generateStructuredAiConversationData } from "./ai-conversation-structured.server";

const supabase = createClient<Database>("https://example.supabase.co", "test-key", {
 auth: { autoRefreshToken: false, persistSession: false },
});
const schema = z.strictObject({ value: z.string() });
const runtime: ResolvedUserAiRuntime = {
 taskId: "conversation.memory-extraction",
 resolutionSource: "auto",
 keyId: "11111111-1111-4111-8111-111111111111",
 provider: "groq",
 providerLabel: "Groq",
 label: "Groq",
 maskedKey: "gsk_***",
 model: "qwen/qwen3.6-27b",
 priority: 0,
 apiKey: "gsk-test",
 capabilities: ["structured-memory"],
};

async function* providerReply(value: string) {
 yield value;
}

describe("AI conversation structured adapter", () => {
 beforeEach(() => {
  recordUserAiRuntimeActivity.mockReset();
  recordUserAiTaskBlockedActivity.mockReset();
  resolveUserAiTaskRuntime.mockReset();
  streamAiConversationProviderReply.mockReset();
  resolveUserAiTaskRuntime.mockResolvedValue({ ok: true, runtime });
 });

 it("resolves only the shared structured-memory personal runtime", async () => {
  streamAiConversationProviderReply.mockImplementation(() => providerReply('{"value":"personal"}'));

  const result = await generateStructuredAiConversationData({
   supabase,
   userId: "user-1",
   taskId: "conversation.memory-extraction",
   systemPrompt: "Return JSON",
   prompt: "small prompt",
   schema,
  });

  expect(result).toEqual({ data: { value: "personal" }, error: null });
  expect(resolveUserAiTaskRuntime).toHaveBeenCalledWith({
   supabase,
   userId: "user-1",
   taskId: "conversation.memory-extraction",
  });
  expect(streamAiConversationProviderReply).toHaveBeenCalledWith(
   expect.objectContaining({ runtime, systemPrompt: "Return JSON" }),
  );
 });

 it("does not fall back to a system provider when no personal runtime exists", async () => {
  resolveUserAiTaskRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "no-active-key",
  });

  const result = await generateStructuredAiConversationData({
   supabase,
   userId: "user-1",
   taskId: "conversation.memory-extraction",
   systemPrompt: "Return JSON",
   prompt: "small prompt",
   schema,
  });

  expect(result.data).toBeNull();
  expect(result.error).toContain("personal API key");
  expect(streamAiConversationProviderReply).not.toHaveBeenCalled();
 });

 it("returns schema failure instead of switching providers", async () => {
  streamAiConversationProviderReply.mockImplementation(() => providerReply("not-json"));

  const result = await generateStructuredAiConversationData({
   supabase,
   userId: "user-1",
   taskId: "conversation.memory-extraction",
   systemPrompt: "Return JSON",
   prompt: "small prompt",
   schema,
  });

  expect(result.data).toBeNull();
  expect(result.error).toContain("outside the schema");
  expect(streamAiConversationProviderReply).toHaveBeenCalledTimes(1);
 });

 it("rejects an oversized structured prompt before resolving a runtime", async () => {
  const result = await generateStructuredAiConversationData({
   supabase,
   userId: "user-1",
   taskId: "conversation.memory-extraction",
   systemPrompt: "Return JSON",
   prompt: "x".repeat(6001),
   schema,
  });

  expect(result.data).toBeNull();
  expect(result.error).toContain("bounded prompt contract");
  expect(resolveUserAiTaskRuntime).not.toHaveBeenCalled();
  expect(streamAiConversationProviderReply).not.toHaveBeenCalled();
 });
});
