import { afterEach, describe, expect, it, vi } from "vitest";

import {
 getProviderCooldownMs,
 getProviderSkipReason,
 markProviderUnavailable,
} from "./provider-outage-policy";

describe("AI provider outage policy", () => {
 afterEach(() => vi.useRealTimers());

 it("uses provider-specific retry windows", () => {
  expect(getProviderCooldownMs("Gemini", 429, '{"retryDelay":"2.5s"}')).toBe(2500);
  expect(getProviderCooldownMs("DeepSeek", 402, "balance")).toBe(600_000);
  expect(getProviderCooldownMs("OpenAI", 500, "server error")).toBe(0);
 });

 it("expires a provider outage without affecting other providers", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-14T00:00:00.000Z"));
  markProviderUnavailable("Gemini", 1000, "quota", "models/gemini-2.0-flash");

  expect(getProviderSkipReason("Gemini", "models/gemini-2.0-flash")).toBe("quota");
  expect(getProviderSkipReason("DeepSeek")).toBeNull();

  vi.advanceTimersByTime(1000);
  expect(getProviderSkipReason("Gemini", "models/gemini-2.0-flash")).toBeNull();
 });
});
