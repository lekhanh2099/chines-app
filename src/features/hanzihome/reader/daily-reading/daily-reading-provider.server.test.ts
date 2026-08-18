import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserApiKeyCredential } from "@/services/user-api-keys.service";

vi.mock("server-only", () => ({}));

import { requestDailyReadingProvider } from "./daily-reading-provider.server";

const baseCredential: UserApiKeyCredential = {
 id: "groq-key",
 userId: "user-1",
 provider: "groq",
 label: "Groq",
 maskedKey: "gsk_****test",
 isActive: true,
 priority: 0,
 defaultModel: "openai/gpt-oss-20b",
 lastValidatedAt: null,
 createdAt: "2026-08-18T00:00:00.000Z",
 updatedAt: "2026-08-18T00:00:00.000Z",
 apiKey: "gsk_test",
};

afterEach(() => {
 vi.useRealTimers();
 vi.unstubAllGlobals();
});

describe("Daily Reading provider transport", () => {
 it("uses Groq JSON mode with hidden reasoning for GPT OSS", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   new Response(
    JSON.stringify({
     choices: [{ message: { content: JSON.stringify({ titleZh: "测试" }) } }],
    }),
    { status: 200 },
   ),
  );
  vi.stubGlobal("fetch", fetchMock);

  const result = await requestDailyReadingProvider({
   credential: baseCredential,
   prompt: "Return JSON for a Daily Reading core.",
   phase: "core",
  });

  expect(result.content).toContain("titleZh");
  expect(result.model).toBe("openai/gpt-oss-20b");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  expect(body).toMatchObject({
   model: "openai/gpt-oss-20b",
   reasoning_effort: "low",
   reasoning_format: "hidden",
   response_format: { type: "json_object" },
  });
  expect(body.max_completion_tokens).toBe(3600);
  expect(body.messages).toHaveLength(1);
  expect(body.messages[0].role).toBe("user");
  expect(body.messages[0].content).toContain("Return one valid JSON object only");
 });

 it("disables Qwen reasoning while keeping JSON mode", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   new Response(
    JSON.stringify({
     choices: [{ message: { content: JSON.stringify({ vocabulary: [] }) } }],
    }),
    { status: 200 },
   ),
  );
  vi.stubGlobal("fetch", fetchMock);

  await requestDailyReadingProvider({
   credential: { ...baseCredential, defaultModel: "qwen/qwen3.6-27b" },
   prompt: "Return JSON for Daily Reading learning material.",
   phase: "learning",
  });

  const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  expect(body).toMatchObject({
   model: "qwen/qwen3.6-27b",
   reasoning_effort: "none",
   reasoning_format: "hidden",
   response_format: { type: "json_object" },
  });
  expect(body.max_completion_tokens).toBe(4800);
 });

 it("waits for Groq retry-after and retries the same structured request", async () => {
  vi.useFakeTimers();
  const fetchMock = vi
   .fn()
   .mockResolvedValueOnce(
    new Response(JSON.stringify({ error: { message: "Please try again in 600ms." } }), {
     status: 429,
     headers: { "retry-after": "0.6" },
    }),
   )
   .mockResolvedValueOnce(
    new Response(
     JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ titleZh: "重试成功" }) } }],
     }),
     { status: 200 },
    ),
   );
  vi.stubGlobal("fetch", fetchMock);

  const resultPromise = requestDailyReadingProvider({
   credential: baseCredential,
   prompt: "Return JSON after rate limiting.",
   phase: "core",
  });
  await vi.advanceTimersByTimeAsync(1_000);
  const result = await resultPromise;

  expect(result.content).toContain("重试成功");
  expect(fetchMock).toHaveBeenCalledTimes(2);
 });

 it("keeps the provider HTTP detail so the failed stage is diagnosable", async () => {
  vi.stubGlobal(
   "fetch",
   vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: { message: "response_format is invalid" } }), {
     status: 400,
    }),
   ),
  );

  const result = await requestDailyReadingProvider({
   credential: baseCredential,
   prompt: "Return JSON.",
   phase: "core",
  });

  expect(result.content).toBeNull();
  expect(result.error).toContain("Groq HTTP 400");
  expect(result.error).toContain("response_format is invalid");
 });

 it("normalizes a legacy null Groq model to the current default", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   new Response(
    JSON.stringify({
     choices: [{ message: { content: JSON.stringify({ ok: true }) } }],
    }),
    { status: 200 },
   ),
  );
  vi.stubGlobal("fetch", fetchMock);

  const result = await requestDailyReadingProvider({
   credential: { ...baseCredential, defaultModel: null },
   prompt: "Return JSON.",
   phase: "core",
  });

  expect(result.model).toBe("openai/gpt-oss-20b");
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).model).toBe("openai/gpt-oss-20b");
 });
});
