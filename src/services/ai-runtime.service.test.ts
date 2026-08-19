import { describe, expect, it } from "vitest";

import type { UserApiKey, UserApiKeyCredential } from "@/services/user-api-keys.service";

import {
 classifyAiRuntimeOperationFailure,
 getAiRuntimeReadinessFromInventory,
 resolveAiRuntimeFromInventory,
 type AiRuntimeInventory,
} from "./ai-runtime.service";

const groqKey: UserApiKey = {
 id: "11111111-1111-4111-8111-111111111111",
 userId: "user-1",
 provider: "groq",
 label: "Groq chính",
 maskedKey: "gsk_****1234",
 isActive: true,
 priority: 0,
 defaultModel: "openai/gpt-oss-20b",
 lastValidatedAt: "2026-08-19T05:00:00.000Z",
 createdAt: "2026-08-19T04:00:00.000Z",
 updatedAt: "2026-08-19T05:00:00.000Z",
};

const geminiKey: UserApiKey = {
 id: "22222222-2222-4222-8222-222222222222",
 userId: "user-1",
 provider: "gemini",
 label: "Gemini semantic",
 maskedKey: "AIza****5678",
 isActive: true,
 priority: 1,
 defaultModel: "models/gemini-2.5-flash",
 lastValidatedAt: "2026-08-19T05:00:00.000Z",
 createdAt: "2026-08-19T04:10:00.000Z",
 updatedAt: "2026-08-19T05:00:00.000Z",
};

const groqCredential: UserApiKeyCredential = {
 ...groqKey,
 apiKey: "gsk_runtime_secret",
};

const geminiCredential: UserApiKeyCredential = {
 ...geminiKey,
 apiKey: "AIza-runtime-secret",
};

function inventory(overrides: Partial<AiRuntimeInventory> = {}): AiRuntimeInventory {
 return {
  storageIssue: null,
  activeKeys: [groqKey, geminiKey],
  credentials: [groqCredential, geminiCredential],
  ...overrides,
 };
}

describe("shared AI runtime resolver", () => {
 it("keeps schema and vault failures distinct from a missing user key", () => {
  expect(
   getAiRuntimeReadinessFromInventory(
    inventory({ storageIssue: "schema-unavailable", activeKeys: [], credentials: [] }),
   ),
  ).toMatchObject({ status: "storage-unavailable", reason: "schema-unavailable" });

  expect(
   getAiRuntimeReadinessFromInventory(
    inventory({ storageIssue: "vault-unavailable", activeKeys: [], credentials: [] }),
   ),
  ).toMatchObject({ status: "storage-unavailable", reason: "vault-unavailable" });

  expect(
   getAiRuntimeReadinessFromInventory(
    inventory({ activeKeys: [], credentials: [] }),
   ),
  ).toMatchObject({ status: "missing-key", reason: "no-active-key" });
 });

 it("reports encrypted active keys that cannot be decrypted as storage unavailable", () => {
  const readiness = getAiRuntimeReadinessFromInventory(
   inventory({ activeKeys: [groqKey], credentials: [] }),
  );

  expect(readiness).toMatchObject({
   status: "storage-unavailable",
   reason: "credential-unreadable",
   activeKeyCount: 1,
   usableKeyCount: 0,
  });
 });

 it("returns safe metadata only and aggregates capabilities across usable user keys", () => {
  const readiness = getAiRuntimeReadinessFromInventory(inventory());

  expect(readiness.status).toBe("ready");
  expect(readiness.selectedKey?.keyId).toBe(groqKey.id);
  expect(readiness.selectedKey?.model).toBe(groqKey.defaultModel);
  expect(readiness.capabilities).toContain("conversation");
  expect(readiness.capabilities).toContain("semantic-memory");
  expect(JSON.stringify(readiness)).not.toContain(groqCredential.apiKey);
  expect(JSON.stringify(readiness)).not.toContain(geminiCredential.apiKey);
 });

 it("uses priority order for normal capabilities and a compatible user key for semantic memory", () => {
  const conversation = resolveAiRuntimeFromInventory({
   inventory: inventory(),
   capability: "conversation",
  });
  const semantic = resolveAiRuntimeFromInventory({
   inventory: inventory(),
   capability: "semantic-memory",
  });

  expect(conversation.ok && conversation.runtime.keyId).toBe(groqKey.id);
  expect(semantic.ok && semantic.runtime.keyId).toBe(geminiKey.id);
  expect(semantic.ok && semantic.runtime.apiKey).toBe(geminiCredential.apiKey);
 });

 it("does not silently substitute another key when an explicit key lacks the requested capability", () => {
  const resolved = resolveAiRuntimeFromInventory({
   inventory: inventory(),
   capability: "semantic-memory",
   apiKeyId: groqKey.id,
  });

  expect(resolved).toEqual({
   ok: false,
   status: "missing-key",
   reason: "capability-unavailable",
  });
 });

 it("classifies operational provider failures without conflating them with vault readiness", () => {
  expect(classifyAiRuntimeOperationFailure({ status: 401 })).toBe("invalid-key");
  expect(classifyAiRuntimeOperationFailure({ status: 429, message: "rate limit" })).toBe(
   "quota-exhausted",
  );
  expect(classifyAiRuntimeOperationFailure({ errorName: "TimeoutError" })).toBe("network-error");
  expect(classifyAiRuntimeOperationFailure({ message: "JSON schema mismatch" })).toBe(
   "invalid-response",
  );
  expect(classifyAiRuntimeOperationFailure({ errorName: "AbortError" })).toBe("cancelled");
  expect(classifyAiRuntimeOperationFailure({ status: 503 })).toBe("provider-unavailable");
 });
});
