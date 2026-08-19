import { afterEach, describe, expect, it, vi } from "vitest";

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";

import { checkPersonalConversationRuntime } from "./ai-conversation-health.server";

vi.mock("server-only", () => ({}));

const groqRuntime: ResolvedUserAiRuntime = {
 keyId: "11111111-1111-4111-8111-111111111111",
 provider: "groq",
 providerLabel: "Groq",
 label: "Groq Free",
 maskedKey: "gsk_****test",
 model: "qwen/qwen3.6-27b",
 priority: 0,
 apiKey: "gsk_test",
 capabilities: ["conversation", "structured-memory"],
};

afterEach(() => {
 vi.unstubAllGlobals();
});

describe("AI conversation runtime health", () => {
 it("reports a reachable personal provider as ready", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  const health = await checkPersonalConversationRuntime(groqRuntime);

  expect(health).toMatchObject({
   ready: true,
   code: "ready",
   provider: "Groq",
   model: "qwen/qwen3.6-27b",
   source: "personal",
  });
  expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.groq.com/openai/v1/models");
 });

 it("distinguishes an invalid personal key", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unauthorized", { status: 401 })));

  const health = await checkPersonalConversationRuntime(groqRuntime);

  expect(health).toMatchObject({ ready: false, code: "invalid-key", source: "personal" });
 });

 it("uses only the resolved personal credential", async () => {
  process.env.GEMINI_API_KEY = "system-key-that-must-not-be-used";
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  await checkPersonalConversationRuntime(groqRuntime);

  const init = fetchMock.mock.calls[0]?.[1];
  expect(init?.headers).toMatchObject({ Authorization: "Bearer gsk_test" });
  expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("system-key-that-must-not-be-used");
  delete process.env.GEMINI_API_KEY;
 });
});
