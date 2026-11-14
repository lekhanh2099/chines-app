import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";

vi.mock("server-only", () => ({}));

import {
 resolveMemoryEnabled,
 toHistoryItem,
 toPersistedMessage,
 toSession,
} from "./ai-conversation-persistence-model.server";
import type {
 conversationRowSchema,
 messageRowSchema,
 preferenceContextRowSchema,
} from "./ai-conversation-persistence-schemas.server";

const conversation: z.output<typeof conversationRowSchema> = {
 id: "11111111-1111-4111-8111-111111111111",
 character_id: "22222222-2222-4222-8222-222222222222",
 title: "Chat",
 mode: "natural",
 correction_style: "balanced",
 reply_mode: "adaptive",
 memory_policy: "disabled",
};

const message: z.output<typeof messageRowSchema> = {
 id: "33333333-3333-4333-8333-333333333333",
 seq: 1,
 role: "assistant",
 content: "你好",
 created_at: "2026-01-01T00:00:00.000Z",
};

const preferences: z.output<typeof preferenceContextRowSchema> = {
 default_mode: "natural",
 default_correction_style: "balanced",
 default_reply_mode: "adaptive",
 learner_level: "intermediate",
 memory_enabled: true,
};

describe("AI conversation persistence model", () => {
 it("resolves the memory policy against the account default", () => {
  expect(resolveMemoryEnabled("disabled", true)).toBe(false);
  expect(resolveMemoryEnabled("enabled", false)).toBe(true);
  expect(resolveMemoryEnabled("inherit", false)).toBe(false);
  expect(resolveMemoryEnabled("inherit", true)).toBe(true);
 });

 it("maps a message row and only attaches a runtime receipt when metadata is complete", () => {
  expect(toPersistedMessage(message)).toEqual({
   id: message.id,
   seq: 1,
   role: "assistant",
   content: "你好",
   createdAt: message.created_at,
  });

  const withReceipt = toPersistedMessage({
   ...message,
   metadata: {
    provider: "openai",
    model: "gpt",
    apiKeyId: "44444444-4444-4444-8444-444444444444",
    taskId: "conversation.reply",
    keyLabel: "Main",
    resolutionSource: "assigned",
   },
  });
  expect(withReceipt.runtimeReceipt).toEqual({
   taskId: "conversation.reply",
   provider: "openai",
   model: "gpt",
   keyId: "44444444-4444-4444-8444-444444444444",
   keyLabel: "Main",
   resolutionSource: "assigned",
  });

  expect(
   toPersistedMessage({ ...message, metadata: { provider: "openai", model: "gpt" } }),
  ).not.toHaveProperty("runtimeReceipt");
 });

 it("maps a history row to the camel-case history item", () => {
  expect(
   toHistoryItem({
    ...conversation,
    last_message_at: null,
    created_at: message.created_at,
    updated_at: message.created_at,
   }),
  ).toEqual({
   id: conversation.id,
   characterId: conversation.character_id,
   title: "Chat",
   mode: "natural",
   memoryPolicy: "disabled",
   lastMessageAt: null,
   createdAt: message.created_at,
   updatedAt: message.created_at,
  });
 });

 it("builds an empty session from preferences when no conversation exists", () => {
  expect(toSession(null, null, null, preferences, [])).toEqual({
   conversation: null,
   character: null,
   relationship: null,
   learnerLevel: "intermediate",
   memoryEnabled: true,
   messages: [],
  });
 });

 it("applies the conversation memory policy when a conversation exists", () => {
  const session = toSession(conversation, null, null, preferences, [message]);
  expect(session.memoryEnabled).toBe(false);
  expect(session.conversation?.correctionStyle).toBe("balanced");
  expect(session.messages).toHaveLength(1);
 });
});
