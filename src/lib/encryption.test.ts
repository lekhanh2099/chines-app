import { afterEach, describe, expect, it, vi } from "vitest";

import { decryptApiKey, encryptApiKey, isByokEncryptionConfigured } from "./encryption";

const DEDICATED_SECRET = "dedicated-byok-secret-0123456789abcdef";
const SUPABASE_SECRET = "sb_secret_local_test_0123456789abcdefghijklmnopqrstuvwxyz";

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

 it("uses a Supabase server secret when the dedicated secret is absent", () => {
  vi.stubEnv("BYOK_ENCRYPTION_SECRET", "");
  vi.stubEnv("SUPABASE_SECRET_KEY", SUPABASE_SECRET);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

  const encrypted = encryptApiKey("AIza-example-key");

  expect(isByokEncryptionConfigured()).toBe(true);
  expect(decryptApiKey(encrypted)).toBe("AIza-example-key");
 });

 it("keeps fallback-encrypted keys readable after adding a dedicated secret", () => {
  vi.stubEnv("BYOK_ENCRYPTION_SECRET", "");
  vi.stubEnv("SUPABASE_SECRET_KEY", SUPABASE_SECRET);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  const encrypted = encryptApiKey("sk-example-key");

  vi.stubEnv("BYOK_ENCRYPTION_SECRET", DEDICATED_SECRET);

  expect(decryptApiKey(encrypted)).toBe("sk-example-key");
 });

 it("fails closed without any server-side secret", () => {
  vi.stubEnv("BYOK_ENCRYPTION_SECRET", "");
  vi.stubEnv("SUPABASE_SECRET_KEY", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

  expect(isByokEncryptionConfigured()).toBe(false);
  expect(() => encryptApiKey("gsk_example_key")).toThrow(/BYOK encryption is not configured/);
 });
});
