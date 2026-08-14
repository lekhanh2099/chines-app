import { describe, expect, it } from "vitest";

import { createDictationAttempt, dictationAttemptSchema } from "./dictation-session";

describe("HanziHome dictation session", () => {
 it("captures deterministic score, mistakes, and response time", () => {
  expect(createDictationAttempt("entry-1", "你好世界", "你好", 1_250)).toEqual({
   entryId: "entry-1",
   expectedText: "你好世界",
   answer: "你好",
   score: 50,
   mistakeCount: 2,
   responseMs: 1_250,
  });
 });

 it("rejects an invalid score or negative response time", () => {
  expect(() =>
   dictationAttemptSchema.parse({
    entryId: "entry-1",
    expectedText: "你好",
    answer: "你好",
    score: 101,
    mistakeCount: 0,
    responseMs: -1,
   }),
  ).toThrow();
 });
});
