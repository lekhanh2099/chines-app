import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({
 createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { POST } from "./route";

describe("/api/settings/api-keys/discover", () => {
 beforeEach(() => {
  vi.unstubAllGlobals();
  createClient.mockReset();
  createClient.mockResolvedValue({
   auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
   },
  });
 });

 it("detects Groq from the key and recommends the Chinese-focused live model", async () => {
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

  const response = await POST(
   new Request("https://app.example/api/settings/api-keys/discover", {
    method: "POST",
    body: JSON.stringify({ apiKey: "gsk_valid_test", provider: "auto" }),
   }),
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
   valid: true,
   provider: "groq",
   providerLabel: "Groq",
   models: ["openai/gpt-oss-20b", "qwen/qwen3.6-27b"],
   recommendedModel: "qwen/qwen3.6-27b",
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.groq.com/openai/v1/models");
 });

 it("returns the provider validation error before any key is saved", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid", { status: 401 })));

  const response = await POST(
   new Request("https://app.example/api/settings/api-keys/discover", {
    method: "POST",
    body: JSON.stringify({ apiKey: "gsk_invalid", provider: "auto" }),
   }),
  );

  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ error: expect.stringContaining("Groq") });
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

  const response = await POST(
   new Request("https://app.example/api/settings/api-keys/discover", {
    method: "POST",
    body: JSON.stringify({ apiKey: "AIza-valid", provider: "auto" }),
   }),
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
   provider: "gemini",
   models: ["models/gemini-3.5-flash", "models/gemini-2.5-pro"],
   recommendedModel: "models/gemini-3.5-flash",
  });
 });
});
