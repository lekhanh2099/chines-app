import { afterEach, describe, expect, it, vi } from "vitest";

import { addManagedApiKey, fetchManagedApiKeys } from "./api-key-manager.client";

const managedKey = {
 id: "8ea90191-e57f-4aca-a602-5b172df86c93",
 provider: "gemini",
 providerLabel: "Google Gemini",
 label: "Gemini backup",
 maskedKey: "AIza****1234",
 isActive: true,
 priority: 0,
 defaultModel: "gemini-2.5-flash",
 lastValidatedAt: null,
 createdAt: "2026-07-16T00:00:00.000Z",
 updatedAt: "2026-07-16T00:00:00.000Z",
};

afterEach(() => {
 vi.unstubAllGlobals();
});

describe("api key manager client", () => {
 it("validates the list response at the transport boundary", async () => {
  vi.stubGlobal(
   "fetch",
   vi.fn().mockResolvedValue(
    new Response(
     JSON.stringify({
      schemaReady: true,
      schemaReason: "ok",
      schemaMessage: null,
      keys: [managedKey],
      summary: { total: 1, active: 1, deepseek: 0, gemini: 1, openai: 0 },
     }),
     { status: 200 },
    ),
   ),
  );

  await expect(fetchManagedApiKeys()).resolves.toMatchObject({
   schemaReady: true,
   keys: [{ id: managedKey.id, provider: "gemini" }],
  });
 });

 it("rejects a successful response with an invalid payload", async () => {
  vi.stubGlobal(
   "fetch",
   vi.fn().mockResolvedValue(new Response(JSON.stringify({ keys: "invalid" }), { status: 200 })),
  );

  await expect(fetchManagedApiKeys()).rejects.toThrow("Phản hồi API key không đúng định dạng.");
 });

 it("surfaces the API error message for a failed mutation", async () => {
  vi.stubGlobal(
   "fetch",
   vi
    .fn()
    .mockResolvedValue(
     new Response(JSON.stringify({ error: "Key không hợp lệ." }), { status: 400 }),
    ),
  );

  await expect(addManagedApiKey({ apiKey: "invalid", provider: "auto" })).rejects.toThrow(
   "Key không hợp lệ.",
  );
 });
});
