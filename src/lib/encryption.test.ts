import { createCipheriv, createHash, randomBytes } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { decryptApiKey, encryptApiKey, isByokEncryptionConfigured } from "./encryption";

const DEDICATED_SECRET = "dedicated-byok-secret-0123456789abcdef";
const SUPABASE_SECRET = "sb_secret_local_test_0123456789abcdefghijklmnopqrstuvwxyz";
const FALLBACK_KEY_CONTEXT = "chines-app/byok/supabase-secret/v1";

function encryptLegacyFallbackValue(plaintext: string): string {
 const key = createHash("sha256")
  .update(`${FALLBACK_KEY_CONTEXT}\0${SUPABASE_SECRET}`, "utf8")
  .digest();
 const iv = randomBytes(12);
 const cipher = createCipheriv("aes-256-gcm", key, iv);
 const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

 return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

afterEach(() => {
 vi.unstubAllEnvs();
});

describe("BYOK encryption", () => {
 it("round-trips with the dedicated BYOK secret", () => {
  vi.stubEnv("BYOK_ENCRYPTION_SECRET", DEDICATED_SECRET);
  vi.stubEnv("SUPABASE_SECRET_KEY", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

  const encrypted = encryptApiKey("gsk_example_key");

  expect(isByokEncryptionConfigured()).toBe(true);
  expect(decryptApiKey(encrypted)).toBe("gsk_example_key");
 });

 it("requires the dedicated secret to encrypt a new key", () => {
  vi.stubEnv("BYOK_ENCRYPTION_SECRET", "");
  vi.stubEnv("SUPABASE_SECRET_KEY", SUPABASE_SECRET);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

  expect(isByokEncryptionConfigured()).toBe(false);
  expect(() => encryptApiKey("AIza-example-key")).toThrow(/BYOK_ENCRYPTION_SECRET is required/);
 });

 it("keeps fallback-encrypted keys readable after adding a dedicated secret", () => {
  vi.stubEnv("BYOK_ENCRYPTION_SECRET", "");
  vi.stubEnv("SUPABASE_SECRET_KEY", SUPABASE_SECRET);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  const encrypted = encryptLegacyFallbackValue("sk-example-key");

  vi.stubEnv("BYOK_ENCRYPTION_SECRET", DEDICATED_SECRET);

  expect(decryptApiKey(encrypted)).toBe("sk-example-key");
 });

 it("fails closed without any server-side secret", () => {
  vi.stubEnv("BYOK_ENCRYPTION_SECRET", "");
  vi.stubEnv("SUPABASE_SECRET_KEY", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

  expect(isByokEncryptionConfigured()).toBe(false);
  expect(() => encryptApiKey("gsk_example_key")).toThrow(/BYOK_ENCRYPTION_SECRET is required/);
 });
});
