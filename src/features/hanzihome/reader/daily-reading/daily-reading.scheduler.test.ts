import { describe, expect, it } from "vitest";

import {
 formatDailyReadingCountdown,
 resolveDailyReadingReleaseState,
 vietnamDailyReadingDateKey,
} from "./daily-reading.scheduler";

describe("Daily Reading scheduler", () => {
 it("uses the Vietnam calendar date around UTC boundaries", () => {
  expect(vietnamDailyReadingDateKey(new Date("2026-08-17T17:30:00.000Z"))).toBe("2026-08-18");
 });

 it("becomes due at 10:00 Asia/Ho_Chi_Minh", () => {
  const before = resolveDailyReadingReleaseState(new Date("2026-08-18T02:59:59.000Z"));
  const atRelease = resolveDailyReadingReleaseState(new Date("2026-08-18T03:00:00.000Z"));

  expect(before.dateKey).toBe("2026-08-18");
  expect(before.isDue).toBe(false);
  expect(before.remainingMilliseconds).toBe(1000);
  expect(atRelease.isDue).toBe(true);
  expect(atRelease.remainingMilliseconds).toBe(0);
  expect(atRelease.releaseAt.toISOString()).toBe("2026-08-18T03:00:00.000Z");
 });

 it("formats the remaining release time without dropping a partial minute", () => {
  expect(formatDailyReadingCountdown(3_600_001)).toBe("01:01");
  expect(formatDailyReadingCountdown(0)).toBe("00:00");
 });
});
