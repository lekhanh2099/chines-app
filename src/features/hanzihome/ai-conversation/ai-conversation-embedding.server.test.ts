import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";
import type { Database } from "@/types/supabase.generated";

const { recordUserAiRuntimeActivity, recordUserAiTaskBlockedActivity, resolveUserAiTaskRuntime } =
 vi.hoisted(() => ({
  recordUserAiRuntimeActivity: vi.fn(),
  recordUserAiTaskBlockedActivity: vi.fn(),
  resolveUserAiTaskRuntime: vi.fn(),
 }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/ai-runtime.service", () => ({
 recordUserAiRuntimeActivity,
 recordUserAiTaskBlockedActivity,
 resolveUserAiTaskRuntime,
}));

import {
 AI_CONVERSATION_MEMORY_EMBEDDING_DIMENSIONS,
 AI_CONVERSATION_MEMORY_EMBEDDING_MODEL,
 generateAiConversationMemoryEmbedding,
} from "./ai-conversation-embedding.server";

const supabase = createClient<Database>("https://example.supabase.co", "test-key", {
 auth: { autoRefreshToken: false, persistSession: false },
});
const runtime: ResolvedUserAiRuntime = {
 taskId: "conversation.semantic-memory",
 resolutionSource: "auto",
 keyId: "11111111-1111-4111-8111-111111111111",
 provider: "gemini",
 providerLabel: "Google Gemini",
 label: "Gemini cá nhân",
 maskedKey: "AIza***",
 model: "models/gemini-2.5-flash",
 priority: 0,
 apiKey: "personal-gemini-key",
 capabilities: ["semantic-memory"],
};

describe("AI conversation memory embedding adapter", () => {
 beforeEach(() => {
  recordUserAiRuntimeActivity.mockReset();
  recordUserAiTaskBlockedActivity.mockReset();
  resolveUserAiTaskRuntime.mockReset();
  resolveUserAiTaskRuntime.mockResolvedValue({ ok: true, runtime });
 });

 afterEach(() => {
  delete process.env.GEMINI_API_KEY;
  vi.unstubAllGlobals();
 });

 it("uses a personal Gemini key with the stable 768-dimensional embedding contract", async () => {
  const values = Array.from(
   { length: AI_CONVERSATION_MEMORY_EMBEDDING_DIMENSIONS },
   (_, index) => index / AI_CONVERSATION_MEMORY_EMBEDDING_DIMENSIONS,
  );
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ embedding: { values } }));
  vi.stubGlobal("fetch", fetchMock);

  const result = await generateAiConversationMemoryEmbedding({
   supabase,
   userId: "user-1",
   text: "我喜欢打羽毛球。",
   task: "RETRIEVAL_DOCUMENT",
  });

  expect(result).toMatchObject({ available: true });
  expect(resolveUserAiTaskRuntime).toHaveBeenCalledWith({
   supabase,
   userId: "user-1",
   taskId: "conversation.semantic-memory",
  });
  const url = String(fetchMock.mock.calls[0]?.[0] ?? "");
  const init = fetchMock.mock.calls[0]?.[1];
  expect(url).toContain(`models/${AI_CONVERSATION_MEMORY_EMBEDDING_MODEL}:embedContent`);
  expect(url).not.toContain("personal-gemini-key");
  expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("personal-gemini-key");
  const body = JSON.parse(String(init?.body ?? "{}"));
  expect(body).toMatchObject({
   model: `models/${AI_CONVERSATION_MEMORY_EMBEDDING_MODEL}`,
   embedContentConfig: {
    taskType: "RETRIEVAL_DOCUMENT",
    outputDimensionality: 768,
    autoTruncate: true,
   },
  });
 });

 it("falls back cleanly when no compatible personal embedding runtime exists", async () => {
  resolveUserAiTaskRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "capability-unavailable",
  });
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  await expect(
   generateAiConversationMemoryEmbedding({
    supabase,
    userId: "user-1",
    text: "羽毛球",
    task: "RETRIEVAL_QUERY",
   }),
  ).resolves.toEqual({ available: false, reason: "missing-key" });
  expect(fetchMock).not.toHaveBeenCalled();
 });

 it("does not read a system Gemini environment key", async () => {
  process.env.GEMINI_API_KEY = "system-key-that-must-not-be-used";
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json({
    embedding: {
     values: Array.from({ length: AI_CONVERSATION_MEMORY_EMBEDDING_DIMENSIONS }, () => 0.1),
    },
   }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await generateAiConversationMemoryEmbedding({
   supabase,
   userId: "user-1",
   text: "羽毛球",
   task: "RETRIEVAL_QUERY",
  });

  const url = String(fetchMock.mock.calls[0]?.[0] ?? "");
  const init = fetchMock.mock.calls[0]?.[1];
  expect(url).not.toContain("personal-gemini-key");
  expect(url).not.toContain("system-key-that-must-not-be-used");
  expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("personal-gemini-key");
 });
});
