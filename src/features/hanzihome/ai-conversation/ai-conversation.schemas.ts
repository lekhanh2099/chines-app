import { z } from "zod";

export const aiConversationMessageSchema = z.strictObject({
 role: z.enum(["user", "assistant"]),
 content: z.string().trim().min(1).max(6000),
});

export const aiConversationRequestSchema = z.strictObject({
 messages: z.array(aiConversationMessageSchema).min(1).max(20),
});

export const aiConversationResponseSchema = z.strictObject({
 message: z.string().trim().min(1),
});

export type AiConversationMessage = z.output<typeof aiConversationMessageSchema>;
