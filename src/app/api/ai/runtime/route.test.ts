import { beforeEach, describe, expect, it, vi } from "vitest";

import { aiRuntimeReadinessResponseSchema } from "@/features/ai-runtime/ai-runtime.schema";

const mocks = vi.hoisted(() => ({
 requireAuthenticatedRoute: vi.fn(),
 getUserAiRuntimeReadiness: vi.fn(),
}));

vi.mock("@/lib/api/authenticated-route", () => ({
 requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
 privateNoStoreJson: (body: object, init?: ResponseInit) => Response.json(body, init),
}));

vi.mock("@/services/ai-runtime.service", () => ({
 getUserAiRuntimeReadiness: mocks.getUserAiRuntimeReadiness,
}));

import { GET } from "./route";

const ready = aiRuntimeReadinessResponseSchema.parse({
 status: "ready",
 reason: "ok",
 activeKeyCount: 2,
 usableKeyCount: 2,
 selectedKey: {
  keyId: "11111111-1111-4111-8111-111111111111",
  provider: "groq",
  providerLabel: "Groq",
  label: "Groq chính",
  maskedKey: "gsk_****1234",
  model: "openai/gpt-oss-20b",
  priority: 0,
  lastValidatedAt: "2026-08-19T05:00:00.000Z",
  capabilities: [
   "conversation",
   "daily-reading-translation",
   "daily-reading-learning",
   "lookup",
   "structured-memory",
  ],
 },
 capabilities: [
  "conversation",
  "daily-reading-translation",
  "daily-reading-learning",
  "lookup",
  "structured-memory",
  "semantic-memory",
 ],
});

describe("/api/ai/runtime", () => {
 beforeEach(() => {
  mocks.requireAuthenticatedRoute.mockReset();
  mocks.getUserAiRuntimeReadiness.mockReset();
 });

 it("rejects unauthenticated status requests before touching user key storage", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({ authenticated: false });

  const response = await GET();

  expect(response.status).toBe(401);
  expect(mocks.getUserAiRuntimeReadiness).not.toHaveBeenCalled();
 });

 it("returns safe runtime metadata without exposing decrypted credentials", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: { marker: "supabase" }, user: { id: "user-1" } },
  });
  mocks.getUserAiRuntimeReadiness.mockResolvedValue(ready);

  const response = await GET();
  const body = await response.json();
  const serialized = JSON.stringify(body);

  expect(response.status).toBe(200);
  expect(body).toEqual(ready);
  expect(serialized).not.toContain("apiKey");
  expect(serialized).not.toContain("runtime_secret");
 });

 it("represents a missing user key as readiness state rather than a server error", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: {}, user: { id: "user-1" } },
  });
  mocks.getUserAiRuntimeReadiness.mockResolvedValue({
   status: "missing-key",
   reason: "no-active-key",
   activeKeyCount: 0,
   usableKeyCount: 0,
   selectedKey: null,
   capabilities: [],
  });

  const response = await GET();
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toMatchObject({ status: "missing-key", reason: "no-active-key" });
 });

 it("keeps vault misconfiguration distinct from the user's missing-key state", async () => {
  mocks.requireAuthenticatedRoute.mockResolvedValue({
   authenticated: true,
   context: { supabase: {}, user: { id: "user-1" } },
  });
  mocks.getUserAiRuntimeReadiness.mockResolvedValue({
   status: "storage-unavailable",
   reason: "vault-unavailable",
   activeKeyCount: 0,
   usableKeyCount: 0,
   selectedKey: null,
   capabilities: [],
  });

  const response = await GET();
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toMatchObject({ status: "storage-unavailable", reason: "vault-unavailable" });
 });
});
