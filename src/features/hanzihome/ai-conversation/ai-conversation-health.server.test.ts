import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserApiKeyCredential } from "@/services/user-api-keys.service";

import {
 checkPersonalConversationRuntime,
 checkSystemConversationRuntime,
} from "./ai-conversation-health.server";

vi.mock("server-only", () => ({}));

const groqCredential: UserApiKeyCredential = {
 id: "11111111-1111-4111-8111-111111111111",
 userId: "user-1",
 provider: "groq",
 label: "Groq Free",
 maskedKey: "gsk_****test",
 isActive: true,
 priority: 0,
 defaultModel: "qwen/qwen3.6-27b",
 lastValidatedAt: null,
 createdAt: "2026-08-17T00:00:00.000Z",
 updatedAt: "2026-08-17T00:00:00.000Z",
 apiKey: "gsk_test",
};

afterEach(() => {
 vi.unstubAllGlobals();
 vi.unstubAllEnvs();
});

describe("AI conversation runtime health", () => {
 it("reports a reachable personal provider as ready", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  const health = await checkPersonalConversationRuntime(groqCredential);

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

  const health = await checkPersonalConversationRuntime(groqCredential);

  expect(health).toMatchObject({ ready: false, code: "invalid-key", source: "personal" });
 });

 it("reports missing system configuration before attempting a request", async () => {
  vi.stubEnv("GEMINI_API_KEY", "");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  const health = await checkSystemConversationRuntime();

  expect(health).toMatchObject({
   ready: false,
   code: "missing-system-key",
   provider: "Google Gemini",
   source: "system",
  });
  expect(fetchMock).not.toHaveBeenCalled();
 });

 it("checks the configured system Gemini key", async () => {
  vi.stubEnv("GEMINI_API_KEY", "gemini-system-key");
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  const health = await checkSystemConversationRuntime();

  expect(health).toMatchObject({ ready: true, code: "ready", source: "system" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
 });
});
