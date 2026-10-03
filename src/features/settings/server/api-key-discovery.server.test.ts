import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { discoverApiKeyModels, probeApiKeyModel } from "./api-key-discovery.server";

afterEach(() => {
 vi.unstubAllGlobals();
});

describe("API key model discovery", () => {
 it("detects Groq and recommends the Chinese-focused compatible model", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json({
    data: [{ id: "openai/gpt-oss-20b" }, { id: "qwen/qwen3.6-27b" }, { id: "whisper-large-v3" }],
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

 it("probes real generation with the selected Gemini model before persistence", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
   Response.json({
    candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
   }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await expect(
   probeApiKeyModel("AIza-valid", "gemini", "models/gemini-3.5-flash"),
  ).resolves.toEqual({ ok: true });
  expect(fetchMock).toHaveBeenCalledWith(
   "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
   expect.objectContaining({
    method: "POST",
    headers: expect.objectContaining({ "x-goog-api-key": "AIza-valid" }),
   }),
  );
 });

 it("rejects a selected model when the generation probe fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("quota", { status: 429 })));

  await expect(probeApiKeyModel("gsk_valid_test", "groq", "openai/gpt-oss-20b")).resolves.toEqual({
   ok: false,
  });
 });

 it("rejects an empty successful generation response", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ choices: [] })));

  await expect(probeApiKeyModel("sk-valid", "deepseek", "deepseek-v4-flash")).resolves.toEqual({
   ok: false,
  });
 });
});
