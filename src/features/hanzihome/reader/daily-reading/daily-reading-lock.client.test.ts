import { describe, expect, it } from "vitest";

import { canAcquireDailyReadingLease, type DailyReadingLockRecord } from "./daily-reading-lock.client";

const currentLease: DailyReadingLockRecord = {
 name: "chines-app:daily-reading-generation",
 ownerId: "tab-a",
 expiresAt: 2_000,
};

describe("Daily Reading cross-tab lease", () => {
 it("allows a free lease or the current owner", () => {
  expect(canAcquireDailyReadingLease(null, "tab-b", 1_000)).toBe(true);
  expect(canAcquireDailyReadingLease(currentLease, "tab-a", 1_000)).toBe(true);
 });

 it("blocks another owner while the lease is fresh", () => {
  expect(canAcquireDailyReadingLease(currentLease, "tab-b", 1_999)).toBe(false);
 });

 it("allows takeover after the lease expires", () => {
  expect(canAcquireDailyReadingLease(currentLease, "tab-b", 2_000)).toBe(true);
  expect(canAcquireDailyReadingLease(currentLease, "tab-b", 2_500)).toBe(true);
 });
});
