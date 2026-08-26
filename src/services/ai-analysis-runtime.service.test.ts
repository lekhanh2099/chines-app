import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/supabase.generated";

const mocks = vi.hoisted(() => ({
 getActiveUserApiKeyCredentials: vi.fn(),
 resolveUserAiTaskRuntime: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/services/ai-runtime.service", () => ({
 resolveUserAiTaskRuntime: mocks.resolveUserAiTaskRuntime,
}));
vi.mock("@/services/user-api-keys.service", () => ({
 getActiveUserApiKeyCredentials: mocks.getActiveUserApiKeyCredentials,
}));

import { resolveAiCredentialRuntime } from "./ai-analysis-runtime.service";

const supabase = createClient<Database>("https://example.supabase.co", "test-key", {
 auth: { autoRefreshToken: false, persistSession: false },
});
const selectedCredential = {
 id: "11111111-1111-4111-8111-111111111111",
 userId: "user-1",
 provider: "groq",
 label: "Groq chính",
 maskedKey: "gsk_***",
 isActive: true,
 priority: 0,
 defaultModel: "openai/gpt-oss-20b",
 lastValidatedAt: null,
 createdAt: "2026-08-19T00:00:00.000Z",
 updatedAt: "2026-08-19T00:00:00.000Z",
 apiKey: "gsk-personal",
};
const selectedRuntime = {
 keyId: selectedCredential.id,
 provider: "groq",
 providerLabel: "Groq",
 label: selectedCredential.label,
 maskedKey: selectedCredential.maskedKey,
 model: selectedCredential.defaultModel,
 priority: 0,
 apiKey: selectedCredential.apiKey,
 capabilities: ["lookup", "daily-reading-learning"],
 taskId: "lookup.deep",
 resolutionSource: "auto",
};

describe("AI credential runtime compatibility bridge", () => {
 beforeEach(() => {
  mocks.resolveUserAiTaskRuntime.mockReset();
  mocks.getActiveUserApiKeyCredentials.mockReset();
  mocks.resolveUserAiTaskRuntime.mockResolvedValue({ ok: true, runtime: selectedRuntime });
  mocks.getActiveUserApiKeyCredentials.mockResolvedValue([
   { ...selectedCredential, id: "22222222-2222-4222-8222-222222222222", priority: 1 },
   selectedCredential,
  ]);
 });

 it("keeps shared runtime capability selection authoritative", async () => {
  const result = await resolveAiCredentialRuntime({
   supabase,
   userId: "user-1",
   taskId: "lookup.deep",
  });

  expect(mocks.resolveUserAiTaskRuntime).toHaveBeenCalledWith({
   supabase,
   userId: "user-1",
   taskId: "lookup.deep",
  });
  expect(result).toMatchObject({
   ok: true,
   runtime: selectedRuntime,
   credential: selectedCredential,
  });
 });

 it("does not decrypt credentials when runtime selection is blocked", async () => {
  mocks.resolveUserAiTaskRuntime.mockResolvedValue({
   ok: false,
   status: "missing-key",
   reason: "capability-unavailable",
  });

  const result = await resolveAiCredentialRuntime({
   supabase,
   userId: "user-1",
   taskId: "lookup.deep",
  });

  expect(result).toMatchObject({ ok: false, status: "missing-key" });
  expect(mocks.getActiveUserApiKeyCredentials).not.toHaveBeenCalled();
 });

 it("fails closed if the selected runtime credential cannot be recovered", async () => {
  mocks.getActiveUserApiKeyCredentials.mockResolvedValue([]);

  const result = await resolveAiCredentialRuntime({
   supabase,
   userId: "user-1",
   taskId: "lookup.deep",
  });

  expect(result).toEqual({
   ok: false,
   status: "storage-unavailable",
   reason: "credential-unreadable",
  });
 });
});
