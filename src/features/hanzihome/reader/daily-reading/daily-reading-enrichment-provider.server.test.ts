import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";

import { requestDailyReadingEnrichmentProvider } from "./daily-reading-enrichment-provider.server";

const geminiRuntime: ResolvedUserAiRuntime = {
 keyId: "11111111-1111-4111-8111-111111111111",
 provider: "gemini",
 providerLabel: "Google Gemini",
 label: "Gemini cá nhân",
 maskedKey: "AIza****1234",
 model: "models/gemini-2.5-flash",
 priority: 0,
 apiKey: "user-gemini-key",
 capabilities: [
  "conversation",
  "daily-reading-translation",
  "daily-reading-learning",
  "lookup",
  "structured-memory",
  "semantic-memory",
 ],
};

const groqRuntime: ResolvedUserAiRuntime = {
 ...geminiRuntime,
 provider: "groq",
 providerLabel: "Groq",
 label: "Groq cá nhân",
 maskedKey: "gsk_****1234",
 model: "openai/gpt-oss-20b",
 apiKey: "user-groq-key",
 capabilities: [
  "conversation",
  "daily-reading-translation",
  "daily-reading-learning",
  "lookup",
  "structured-memory",
 ],
};
const deepSeekRuntime: ResolvedUserAiRuntime = {
 ...groqRuntime,
 provider: "deepseek",
 providerLabel: "DeepSeek",
 label: "DeepSeek cá nhân",
 maskedKey: "sk-****1234",
 model: "deepseek-v4-flash",
 apiKey: "user-deepseek-key",
};

const testResponseSchema = z.strictObject({ ok: z.boolean() });

function rateLimitedResponse() {
 return new Response('{"error":"rate limit internal detail"}', {
  status: 429,
  headers: {
   "Content-Type": "application/json",
   "retry-after": "0",
   "x-ratelimit-reset-tokens": "0",
  },
 });
}

function successfulResponse() {
 return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
 });
}

describe("Daily Reading enrichment provider", () => {
 beforeEach(() => {
  process.env.GEMINI_API_KEY = "system-gemini-key-that-must-not-be-used";
  vi.stubGlobal("fetch", vi.fn());
 });

 afterEach(() => {
  delete process.env.GEMINI_API_KEY;
  vi.useRealTimers();
  vi.unstubAllGlobals();
 });

 it("uses only the resolved user Gemini key even when a system env key exists", async () => {
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockResolvedValue(
   new Response(
    JSON.stringify({
     candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
     usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 24 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
   ),
  );

  const result = await requestDailyReadingEnrichmentProvider({
   runtime: geminiRuntime,
   prompt: "Translate source.",
   module: "translation",
   schema: z.strictObject({
    paragraphs: z
     .array(
      z.strictObject({
       paragraphId: z.string().trim().min(1).max(80),
       vi: z.string().trim().min(1).max(5_000),
       roleVi: z.string().max(500),
      }),
     )
     .length(3),
   }),
  });

  expect(result).toMatchObject({
   ok: true,
   model: geminiRuntime.model,
   metrics: { inputTokens: 120, outputTokens: 24 },
  });
  const url = String(fetchMock.mock.calls[0]?.[0] ?? "");
  const init = fetchMock.mock.calls[0]?.[1];
  expect(url).not.toContain("user-gemini-key");
  expect(url).not.toContain("system-gemini-key-that-must-not-be-used");
  expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("user-gemini-key");
  expect(init?.body).toEqual(expect.stringContaining('"responseJsonSchema"'));
  expect(init?.body).toEqual(expect.stringContaining('"minItems":3'));
  expect(init?.body).toEqual(expect.stringContaining('"maxItems":3'));
  expect(init?.body).not.toEqual(expect.stringContaining('"minLength"'));
  expect(init?.body).not.toEqual(expect.stringContaining('"maxLength"'));
 });

 it("sends the resolved user key in the Groq authorization header", async () => {
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockResolvedValue(
   new Response(
    JSON.stringify({
     choices: [{ message: { content: '{"ok":true}' } }],
     usage: { prompt_tokens: 80, completion_tokens: 16 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
   ),
  );

  const result = await requestDailyReadingEnrichmentProvider({
   runtime: groqRuntime,
   prompt: "Create grammar support.",
   module: "grammar",
   schema: testResponseSchema,
  });

  const init = fetchMock.mock.calls[0]?.[1];
  expect(init?.headers).toMatchObject({ Authorization: "Bearer user-groq-key" });
  expect(result).toMatchObject({
   ok: true,
   metrics: { inputTokens: 80, outputTokens: 16 },
  });
 });

 it("reads DeepSeek input and output token usage from the OpenAI-compatible envelope", async () => {
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockResolvedValue(
   new Response(
    JSON.stringify({
     choices: [{ message: { content: '{"ok":true}' } }],
     usage: { prompt_tokens: 90, completion_tokens: 18 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
   ),
  );

  const result = await requestDailyReadingEnrichmentProvider({
   runtime: deepSeekRuntime,
   prompt: "Create vocabulary support.",
   module: "vocabulary",
   schema: testResponseSchema,
  });

  expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://api.deepseek.com/chat/completions");
  expect(result).toMatchObject({
   ok: true,
   metrics: { inputTokens: 90, outputTokens: 18 },
  });
 });

 it("retries a transient Groq 429 before surfacing a provider failure", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.mocked(fetch);
  fetchMock
   .mockResolvedValueOnce(rateLimitedResponse())
   .mockResolvedValueOnce(successfulResponse());

  const pending = requestDailyReadingEnrichmentProvider({
   runtime: groqRuntime,
   prompt: "Create vocabulary support.",
   module: "vocabulary",
   schema: testResponseSchema,
  });
  await vi.runAllTimersAsync();
  const result = await pending;

  expect(result).toMatchObject({ ok: true });
  expect(fetchMock).toHaveBeenCalledTimes(2);
 });

 it("keeps provider usage when a paid response envelope is invalid", async () => {
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockResolvedValue(
   new Response(
    JSON.stringify({
     candidates: [],
     usageMetadata: { promptTokenCount: 55, candidatesTokenCount: 7 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
   ),
  );

  const result = await requestDailyReadingEnrichmentProvider({
   runtime: geminiRuntime,
   prompt: "Translate source.",
   module: "translation",
   schema: testResponseSchema,
  });

  expect(result).toMatchObject({
   ok: false,
   errorCode: "invalid-response",
   metrics: { inputTokens: 55, outputTokens: 7 },
  });
 });

 it("reports repeated Groq 429 responses as a temporary provider limit without exposing the body", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockImplementation(async () => rateLimitedResponse());

  const pending = requestDailyReadingEnrichmentProvider({
   runtime: groqRuntime,
   prompt: "Create vocabulary support.",
   module: "vocabulary",
   schema: testResponseSchema,
  });
  await vi.runAllTimersAsync();
  const result = await pending;

  expect(result).toMatchObject({
   ok: false,
   errorCode: "provider-unavailable",
  });
  expect(result.ok ? "" : result.errorDetail).toContain("HTTP 429");
  expect(result.ok ? "" : result.errorDetail).toContain("rate limit");
  expect(JSON.stringify(result)).not.toContain("internal detail");
  expect(fetchMock).toHaveBeenCalledTimes(4);
 });

 it("retries provider timeouts instead of reporting them as user cancellation", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockRejectedValue(
   new DOMException("The operation was aborted due to timeout", "TimeoutError"),
  );

  const pending = requestDailyReadingEnrichmentProvider({
   runtime: groqRuntime,
   prompt: "Create grammar support.",
   module: "grammar",
   schema: testResponseSchema,
  });
  await vi.runAllTimersAsync();
  const result = await pending;

  expect(result).toMatchObject({ ok: false, errorCode: "network-error" });
  expect(fetchMock).toHaveBeenCalledTimes(4);
 });
});
