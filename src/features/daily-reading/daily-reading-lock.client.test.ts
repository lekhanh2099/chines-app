import { afterEach, describe, expect, it, vi } from "vitest";

import {
 canAcquireDailyReadingLease,
 withDailyReadingGenerationLock,
} from "@/features/daily-reading/daily-reading-lock.client";

const currentLease = {
 name: "chines-app:daily-reading-generation",
 ownerId: "owner-a",
 expiresAt: 2_000,
};

describe("Daily Reading generation lock", () => {
 afterEach(() => {
  vi.unstubAllGlobals();
 });

 it("allows the same owner or an expired lease but blocks another active owner", () => {
  expect(canAcquireDailyReadingLease(null, "owner-b", 1_000)).toBe(true);
  expect(canAcquireDailyReadingLease(currentLease, "owner-a", 1_000)).toBe(true);
  expect(canAcquireDailyReadingLease(currentLease, "owner-b", 1_000)).toBe(false);
  expect(canAcquireDailyReadingLease(currentLease, "owner-b", 2_000)).toBe(true);
 });

 it("does not rerun a task failure through fallback lock backends", async () => {
  const task = vi.fn(async () => {
   throw new Error("source failed");
  });
  vi.stubGlobal("navigator", {
   locks: {
    request: async (
     _name: string,
     _options: LockOptions,
     callback: (lock: Lock) => Promise<never>,
    ) => callback({ name: "chines-app:daily-reading-generation", mode: "exclusive" }),
   },
  });

  await expect(withDailyReadingGenerationLock(task)).rejects.toThrow("source failed");
  expect(task).toHaveBeenCalledTimes(1);
 });
});
