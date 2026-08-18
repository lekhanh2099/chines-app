import { describe, expect, it } from "vitest";

import {
 aiConversationSessionSchema,
 aiConversationTurnRequestSchema,
} from "./ai-conversation-session.schemas";

describe("AI conversation persisted session schemas", () => {
 it("accepts Postgres timestamptz values with offsets", () => {
  const parsed = aiConversationSessionSchema.parse({
   conversation: {
    id: "11111111-1111-4111-8111-111111111111",
    characterId: "22222222-2222-4222-8222-222222222222",
    title: "",
    mode: "natural",
    correctionStyle: "balanced",
    replyMode: "adaptive",
    memoryPolicy: "inherit",
   },
   messages: [
    {
     id: "33333333-3333-4333-8333-333333333333",
     seq: 1,
     role: "user",
     content: "你好",
     createdAt: "2026-08-18T03:00:00+00:00",
    },
   ],
  });

  expect(parsed.messages[0]?.createdAt).toBe("2026-08-18T03:00:00+00:00");
 });

 it("requires a stable client message id for persisted turns", () => {
  const parsed = aiConversationTurnRequestSchema.safeParse({
   content: "你好",
  });

  expect(parsed.success).toBe(false);
 });

 it("rejects an empty persisted message", () => {
  const parsed = aiConversationTurnRequestSchema.safeParse({
   clientMessageId: "44444444-4444-4444-8444-444444444444",
   content: "   ",
  });

  expect(parsed.success).toBe(false);
 });

 it("rejects legacy local profile data on persisted turn commands", () => {
  const parsed = aiConversationTurnRequestSchema.safeParse({
   clientMessageId: "44444444-4444-4444-8444-444444444444",
   content: "你好",
   profile: { displayName: "Injected identity" },
  });

  expect(parsed.success).toBe(false);
 });
});
