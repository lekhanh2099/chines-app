import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";

import { requestDailyReadingV2EnrichmentProvider } from "./daily-reading-v2-enrichment-provider.server";

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

describe("Daily Reading V2 enrichment provider", () => {
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
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
   ),
  );

  const result = await requestDailyReadingV2EnrichmentProvider({
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

  expect(result).toMatchObject({ ok: true, model: geminiRuntime.model });
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
  fetchMock.mockResolvedValue(successfulResponse());

  await requestDailyReadingV2EnrichmentProvider({
   runtime: groqRuntime,
   prompt: "Create grammar support.",
   module: "grammar",
   schema: testResponseSchema,
  });

  const init = fetchMock.mock.calls[0]?.[1];
  expect(init?.headers).toMatchObject({ Authorization: "Bearer user-groq-key" });
 });

 it("retries a transient Groq 429 before surfacing a provider failure", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.mocked(fetch);
  fetchMock
   .mockResolvedValueOnce(rateLimitedResponse())
   .mockResolvedValueOnce(successfulResponse());

  const pending = requestDailyReadingV2EnrichmentProvider({
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

 it("reports repeated Groq 429 responses as a temporary provider limit without exposing the body", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.mocked(fetch);
  fetchMock.mockImplementation(async () => rateLimitedResponse());

  const pending = requestDailyReadingV2EnrichmentProvider({
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
});
