import "server-only";

import { z } from "zod";

import {
 apiError,
 privateNoStoreJson,
 type AuthenticatedRouteContext,
} from "@/lib/api/authenticated-route";
import { logger } from "@/lib/logger";

import {
 aiConversationTurnRequestSchema,
 aiConversationTurnResponseSchema,
} from "../model/ai-conversation-session.schemas";
import {
 appendAiConversationMessage,
 findAssistantReplyForUserMessage,
 loadAiConversationContextState,
 loadRecentAiConversationMessages,
} from "./ai-conversation-persistence.server";
import { dispatchAiConversationPostTurnWorkflow } from "./ai-conversation-post-turn.workflow";
import {
 invalidPersistenceResponse,
 persistenceBoundaryErrorResponse,
} from "./ai-conversation-route-errors.server";
import { generatePersistedAiConversationTurn } from "./ai-conversation-turn.server";

export const persistedTurnRequestSchema = aiConversationTurnRequestSchema.extend({
 action: z.literal("message"),
 conversationId: z.uuid(),
});

export async function respondWithPersistedAiConversationTurn({
 context,
 request,
 payload,
}: {
 context: AuthenticatedRouteContext;
 request: Request;
 payload: z.output<typeof persistedTurnRequestSchema>;
}) {
 const userId = context.user.id;

 try {
  const userMessage = await appendAiConversationMessage({
   userId,
   conversationId: payload.conversationId,
   role: "user",
   content: payload.content,
   clientMessageId: payload.clientMessageId,
  });

  const existingReply = await findAssistantReplyForUserMessage({
   userId,
   conversationId: payload.conversationId,
   userMessageId: userMessage.id,
  });

  if (existingReply) {
   await dispatchAiConversationPostTurnWorkflow({
    userId,
    conversationId: payload.conversationId,
   });
   return privateNoStoreJson(
    aiConversationTurnResponseSchema.parse({
     conversationId: payload.conversationId,
     userMessage,
     assistantMessage: existingReply.message,
     provider: existingReply.provider,
     model: existingReply.model,
     apiKeyId: existingReply.apiKeyId,
     runtimeReceipt: existingReply.runtimeReceipt,
     usage: null,
    }),
   );
  }

  const [contextState, recentMessages] = await Promise.all([
   loadAiConversationContextState({ userId, conversationId: payload.conversationId }),
   loadRecentAiConversationMessages({
    userId,
    conversationId: payload.conversationId,
    limit: 19,
   }),
  ]);
  const generated = await generatePersistedAiConversationTurn({
   supabase: context.supabase,
   userId,
   recentMessages,
   contextState,
   ...(payload.apiKeyId ? { apiKeyId: payload.apiKeyId } : {}),
   ...(payload.model ? { model: payload.model } : {}),
   signal: request.signal,
  });

  if (!generated.ok) {
   return apiError(generated.message, generated.status, generated.code);
  }

  const assistantMessage = await appendAiConversationMessage({
   userId,
   conversationId: payload.conversationId,
   role: "assistant",
   content: generated.message,
   replyToMessageId: userMessage.id,
   metadata: {
    provider: generated.provider,
    model: generated.model,
    apiKeyId: generated.apiKeyId,
    taskId: generated.runtimeReceipt.taskId,
    keyLabel: generated.runtimeReceipt.keyLabel,
    resolutionSource: generated.runtimeReceipt.resolutionSource,
   },
  });
  await dispatchAiConversationPostTurnWorkflow({
   userId,
   conversationId: payload.conversationId,
  });

  return privateNoStoreJson(
   aiConversationTurnResponseSchema.parse({
    conversationId: payload.conversationId,
    userMessage,
    assistantMessage,
    provider: generated.provider,
    model: generated.model,
    apiKeyId: generated.apiKeyId,
    runtimeReceipt: generated.runtimeReceipt,
    usage: null,
   }),
  );
 } catch (error) {
  const persistenceResponse = persistenceBoundaryErrorResponse(error);
  if (persistenceResponse) return persistenceResponse;
  if (error instanceof z.ZodError) {
   return invalidPersistenceResponse(
    "AI conversation persistence trả về dữ liệu không đúng contract.",
   );
  }
  logger.error("[AI Conversation] persisted turn failed", error);
  return apiError("AI conversation không hoàn tất.", 503, "AI_UNAVAILABLE");
 }
}
