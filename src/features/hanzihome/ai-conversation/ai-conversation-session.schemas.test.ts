import { describe, expect, it } from "vitest";

import {
 aiConversationHistorySchema,
 aiConversationMemoryPolicyStateSchema,
 aiConversationSessionSchema,
 aiConversationSettingsUpdateSchema,
 aiConversationTurnRequestSchema,
} from "./ai-conversation-session.schemas";

describe("AI conversation persisted session schemas", () => {
 it("accepts Postgres timestamptz values with offsets and relationship presentation", () => {
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
   character: {
    id: "22222222-2222-4222-8222-222222222222",
    displayName: "小林",
    city: "上海",
    interests: ["电影"],
   },
   relationship: {
    nickname: "",
    familiarityScore: 0.52,
   },
   learnerLevel: "intermediate",
   memoryEnabled: true,
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
  expect(parsed.character?.displayName).toBe("小林");
  expect(parsed.relationship?.familiarityScore).toBe(0.52);
  expect(parsed.memoryEnabled).toBe(true);
 });

 it("validates a bounded active conversation history contract", () => {
  const parsed = aiConversationHistorySchema.parse([
   {
    id: "11111111-1111-4111-8111-111111111111",
    characterId: "22222222-2222-4222-8222-222222222222",
    title: "周末计划",
    mode: "natural",
    memoryPolicy: "disabled",
    lastMessageAt: "2026-08-18T03:30:00+00:00",
    createdAt: "2026-08-18T03:00:00+00:00",
    updatedAt: "2026-08-18T03:30:00+00:00",
   },
  ]);

  expect(parsed[0]?.title).toBe("周末计划");
  expect(parsed[0]?.memoryPolicy).toBe("disabled");
 });

 it("keeps effective memory state separate from the persisted policy", () => {
  expect(
   aiConversationMemoryPolicyStateSchema.parse({
    conversationId: "11111111-1111-4111-8111-111111111111",
    memoryPolicy: "inherit",
    memoryEnabled: false,
   }),
  ).toEqual({
   conversationId: "11111111-1111-4111-8111-111111111111",
   memoryPolicy: "inherit",
   memoryEnabled: false,
  });
 });

 it("validates persisted conversation behavior settings", () => {
  const parsed = aiConversationSettingsUpdateSchema.parse({
   mode: "grammar-coach",
   correctionStyle: "strict",
   replyMode: "chinese",
   learnerLevel: "advanced",
  });

  expect(parsed).toEqual({
   mode: "grammar-coach",
   correctionStyle: "strict",
   replyMode: "chinese",
   learnerLevel: "advanced",
  });
 });

 it("rejects legacy persona fields in persisted settings", () => {
  const parsed = aiConversationSettingsUpdateSchema.safeParse({
   mode: "natural",
   correctionStyle: "balanced",
   replyMode: "adaptive",
   learnerLevel: "intermediate",
   persona: "friend",
  });

  expect(parsed.success).toBe(false);
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
