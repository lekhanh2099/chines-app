import { describe, expect, it } from "vitest";

import type { DailyReadingRun } from "./daily-reading.schemas";
import { scheduledRunBlocksDate } from "./daily-reading-storage.client";

function run(overrides: Partial<DailyReadingRun> = {}): DailyReadingRun {
 return {
  id: "run-1",
  date: "2026-08-18",
  kind: "scheduled",
  status: "pending",
  stage: "discovering",
  attemptedAt: "2026-08-18T03:00:00.000Z",
  completedAt: "",
  errorCode: "",
  errorDetail: "",
  readingId: "",
  ...overrides,
 };
}

describe("Daily Reading scheduled-run retry policy", () => {
 it("blocks a fresh pending run to prevent duplicate tabs", () => {
  expect(scheduledRunBlocksDate(run(), "2026-08-18", new Date("2026-08-18T03:10:00.000Z"))).toBe(
   true,
  );
  expect(scheduledRunBlocksDate(run(), "2026-08-18", new Date("2026-08-18T03:16:00.000Z"))).toBe(
   false,
  );
 });

 it("keeps a succeeded scheduled run authoritative for the day", () => {
  expect(
   scheduledRunBlocksDate(
    run({ status: "succeeded", completedAt: "2026-08-18T03:05:00.000Z" }),
    "2026-08-18",
    new Date("2026-08-18T20:00:00.000Z"),
   ),
  ).toBe(true);
 });

 it("allows immediate recovery after interrupted or offline failures", () => {
  expect(
   scheduledRunBlocksDate(
    run({ status: "failed", errorCode: "interrupted", completedAt: "2026-08-18T03:02:00.000Z" }),
    "2026-08-18",
    new Date("2026-08-18T03:03:00.000Z"),
   ),
  ).toBe(false);
  expect(
   scheduledRunBlocksDate(
    run({ status: "failed", errorCode: "offline", completedAt: "2026-08-18T03:02:00.000Z" }),
    "2026-08-18",
    new Date("2026-08-18T03:03:00.000Z"),
   ),
  ).toBe(false);
 });

 it("backs off a hard failure for thirty minutes", () => {
  const failed = run({
   status: "failed",
   errorCode: "provider-rejected",
   attemptedAt: "2026-08-18T03:00:00.000Z",
   completedAt: "2026-08-18T03:01:00.000Z",
  });
  expect(scheduledRunBlocksDate(failed, "2026-08-18", new Date("2026-08-18T03:29:00.000Z"))).toBe(
   true,
  );
  expect(scheduledRunBlocksDate(failed, "2026-08-18", new Date("2026-08-18T03:31:00.000Z"))).toBe(
   false,
  );
 });
});
