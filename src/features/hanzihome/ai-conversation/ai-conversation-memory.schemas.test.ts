import { describe, expect, it } from "vitest";

import { aiConversationMemoryExtractionSchema } from "./ai-conversation-memory.schemas";

describe("AI conversation memory lifecycle schema", () => {
 it("accepts a canonical add candidate", () => {
  expect(
   aiConversationMemoryExtractionSchema.safeParse({
    changes: [
     {
      action: "add",
      kind: "preference",
      targetMemoryId: null,
      memoryKey: "user.sport.badminton",
      content: "Người học thích chơi cầu lông.",
      importance: 0.8,
      confidence: 0.95,
      scope: "global",
     },
    ],
   }).success,
  ).toBe(true);
 });

 it("rejects add without durable memory content", () => {
  expect(
   aiConversationMemoryExtractionSchema.safeParse({
    changes: [
     {
      action: "add",
      kind: "fact",
      targetMemoryId: null,
      memoryKey: "user.location.current",
      content: null,
      importance: 0.8,
      confidence: 0.9,
      scope: "global",
     },
    ],
   }).success,
  ).toBe(false);
 });

 it("requires a target id or canonical key for lifecycle mutations", () => {
  expect(
   aiConversationMemoryExtractionSchema.safeParse({
    changes: [
     {
      action: "resolve",
      kind: "open_loop",
      targetMemoryId: null,
      memoryKey: null,
      content: null,
      importance: 0.5,
      confidence: 0.9,
      scope: "character",
     },
    ],
   }).success,
  ).toBe(false);
 });

 it("keeps extraction bounded to prevent memory spam", () => {
  const candidate = {
   action: "ignore",
   kind: null,
   targetMemoryId: null,
   memoryKey: null,
   content: null,
   importance: 0,
   confidence: 0,
   scope: "global",
  };
  expect(
   aiConversationMemoryExtractionSchema.safeParse({ changes: Array.from({ length: 7 }, () => candidate) })
    .success,
  ).toBe(false);
 });
});
