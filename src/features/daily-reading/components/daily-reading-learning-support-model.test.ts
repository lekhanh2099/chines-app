import { describe, expect, it } from "vitest";

import {
 configForModule,
 moduleConfigs,
 needsKeyManagement,
 statusBadgeVariant,
 statusKey,
 taskIdForModule,
} from "@/features/daily-reading/components/daily-reading-learning-support-model";

describe("daily-reading-learning-support-model", () => {
 it("maps every module to its config and AI task", () => {
  expect(moduleConfigs.map((config) => config.module)).toEqual([
   "translation",
   "vocabulary",
   "grammar",
   "questions",
  ]);
  expect(configForModule("grammar")?.titleKey).toBe("enrichment.modules.grammar.title");
  expect(taskIdForModule("translation")).toBe("daily-reading.translation");
  expect(taskIdForModule("vocabulary")).toBe("daily-reading.vocabulary");
  expect(taskIdForModule("grammar")).toBe("daily-reading.grammar");
  expect(taskIdForModule("questions")).toBe("daily-reading.questions");
 });

 it("derives badge variants and status copy keys", () => {
  expect(statusBadgeVariant({ status: "idle" })).toBe("default");
  expect(statusBadgeVariant({ status: "running", startedAt: "2026-08-28T02:00:00.000Z" })).toBe(
   "info",
  );
  expect(statusBadgeVariant({ status: "blocked", reason: "quota-exhausted" })).toBe("warning");
  expect(statusKey({ status: "idle" })).toBe("enrichment.status.idle");
  expect(
   statusKey({ status: "failed", errorCode: "x", updatedAt: "2026-08-28T02:00:00.000Z" }),
  ).toBe("enrichment.status.failed");
  expect(statusKey({ status: "blocked", reason: "missing-ai-key" })).toBe(
   "enrichment.status.missingKey",
  );
  expect(statusKey({ status: "blocked", reason: "task-disabled" })).toBe(
   "enrichment.status.taskDisabled",
  );
 });

 it("requires key management only for invalid or exhausted keys", () => {
  expect(needsKeyManagement({ status: "blocked", reason: "invalid-ai-key" })).toBe(true);
  expect(needsKeyManagement({ status: "blocked", reason: "quota-exhausted" })).toBe(true);
  expect(needsKeyManagement({ status: "blocked", reason: "missing-ai-key" })).toBe(false);
  expect(needsKeyManagement({ status: "idle" })).toBe(false);
 });
});
