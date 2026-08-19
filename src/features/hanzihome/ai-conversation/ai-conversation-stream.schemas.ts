import { z } from "zod";

import {
 aiConversationPersistedMessageSchema,
 aiConversationTurnResponseSchema,
} from "./ai-conversation-session.schemas";

export const aiConversationStreamStartEventSchema = z.strictObject({
 type: z.literal("start"),
 conversationId: z.uuid(),
 userMessage: aiConversationPersistedMessageSchema,
});

export const aiConversationStreamDeltaEventSchema = z.strictObject({
 type: z.literal("delta"),
 text: z.string().min(1).max(8_000),
});

export const aiConversationStreamHeartbeatEventSchema = z.strictObject({
 type: z.literal("heartbeat"),
});

export const aiConversationStreamFinalEventSchema = z.strictObject({
 type: z.literal("final"),
 turn: aiConversationTurnResponseSchema,
});

export const aiConversationStreamErrorEventSchema = z.strictObject({
 type: z.literal("error"),
 code: z.string().trim().min(1).max(80),
 message: z.string().trim().min(1).max(600),
});

export const aiConversationStreamEventSchema = z.discriminatedUnion("type", [
 aiConversationStreamStartEventSchema,
 aiConversationStreamDeltaEventSchema,
 aiConversationStreamHeartbeatEventSchema,
 aiConversationStreamFinalEventSchema,
 aiConversationStreamErrorEventSchema,
]);

export type AiConversationStreamStartEvent = z.output<typeof aiConversationStreamStartEventSchema>;
export type AiConversationStreamEvent = z.output<typeof aiConversationStreamEventSchema>;
