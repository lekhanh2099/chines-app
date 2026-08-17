import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { discoverApiKeyModels } from "./api-key-discovery.server";

afterEach(() => {
 vi.unstubAllGlobals();
});

describe("API key model discovery", () => {
 it("detects Groq and recommends the Chinese-focused compatible model", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json({
    data: [
     { id: "openai/gpt-oss-20b" },
     { id: "qwen/qwen3.6-27b" },
     { id: "whisper-large-v3" },
    ],
   }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const result = await discoverApiKeyModels("gsk_valid_test", "auto");

  expect(result).toEqual({
   ok: true,
   value: {
    provider: "groq",
    providerLabel: "Groq",
    models: ["openai/gpt-oss-20b", "qwen/qwen3.6-27b"],
    recommendedModel: "qwen/qwen3.6-27b",
   },
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
 });

 it("rejects an invalid provider key before persistence", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid", { status: 401 })));

  const result = await discoverApiKeyModels("gsk_invalid", "auto");

  expect(result).toMatchObject({ ok: false, error: expect.stringContaining("Groq") });
 });

 it("filters Gemini to generateContent models supported by the app", async () => {
  vi.stubGlobal(
   "fetch",
   vi.fn().mockResolvedValue(
    Response.json({
     models: [
      {
       name: "models/gemini-3.5-flash",
       supportedGenerationMethods: ["generateContent"],
      },
      {
       name: "models/gemini-2.5-pro",
       supportedGenerationMethods: ["generateContent"],
      },
      {
       name: "models/gemini-embedding-001",
       supportedGenerationMethods: ["embedContent"],
      },
     ],
    }),
   ),
  );

  const result = await discoverApiKeyModels("AIza-valid", "auto");

  expect(result).toMatchObject({
   ok: true,
   value: {
    provider: "gemini",
    models: ["models/gemini-3.5-flash", "models/gemini-2.5-pro"],
    recommendedModel: "models/gemini-3.5-flash",
   },
  });
 });
});
