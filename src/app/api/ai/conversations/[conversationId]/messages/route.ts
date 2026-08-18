import type { JsonFieldValue } from "@/types/json";

import { z } from "zod";

import {
 AiConversationPersistenceNotReadyError,
 appendAiConversationMessage,
 findAssistantReplyForUserMessage,
 loadRecentAiConversationMessages,
} from "@/features/hanzihome/ai-conversation/ai-conversation-persistence.server";
import {
 aiConversationTurnRequestSchema,
 aiConversationTurnResponseSchema,
} from "@/features/hanzihome/ai-conversation/ai-conversation-session.schemas";
import { generatePersistedAiConversationTurn } from "@/features/hanzihome/ai-conversation/ai-conversation-turn.server";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
 params: Promise<{
  conversationId: string;
 }>;
};

function persistenceNotReadyResponse() {
 return apiError(
  "AI conversation persistence chưa sẵn sàng. Hãy apply migration AI conversation trước khi test flow này.",
  503,
  "AI_PERSISTENCE_NOT_READY",
 );
}

export async function POST(request: Request, context: RouteContext) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const { conversationId: rawConversationId } = await context.params;
 const conversationId = z.uuid().safeParse(rawConversationId);
 if (!conversationId.success) {
  return apiError("Conversation id không hợp lệ.", 400, "INVALID_CONVERSATION_ID");
 }

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = aiConversationTurnRequestSchema.safeParse(body);
 if (!parsed.success) {
  return apiError("Invalid AI conversation turn payload", 400, "INVALID_PAYLOAD");
 }

 const userId = auth.context.user.id;
 const payload = parsed.data;

 try {
  const userMessage = await appendAiConversationMessage({
   userId,
   conversationId: conversationId.data,
   role: "user",
   content: payload.content,
   clientMessageId: payload.clientMessageId,
  });

  const existingReply = await findAssistantReplyForUserMessage({
   userId,
   conversationId: conversationId.data,
   userMessageId: userMessage.id,
  });

  if (existingReply) {
   return privateNoStoreJson(
    aiConversationTurnResponseSchema.parse({
     conversationId: conversationId.data,
     userMessage,
     assistantMessage: existingReply.message,
     provider: existingReply.provider,
     model: existingReply.model,
     apiKeyId: existingReply.apiKeyId,
     usage: null,
    }),
   );
  }

  const recentMessages = await loadRecentAiConversationMessages({
   userId,
   conversationId: conversationId.data,
   limit: 19,
  });
  const generated = await generatePersistedAiConversationTurn({
   supabase: auth.context.supabase,
   userId,
   recentMessages,
   profile: payload.profile,
   ...(payload.apiKeyId ? { apiKeyId: payload.apiKeyId } : {}),
   signal: request.signal,
  });

  if (!generated.ok) {
   return apiError(generated.message, generated.status, generated.code);
  }

  const assistantMessage = await appendAiConversationMessage({
   userId,
   conversationId: conversationId.data,
   role: "assistant",
   content: generated.message,
   replyToMessageId: userMessage.id,
   metadata: {
    provider: generated.provider,
    model: generated.model,
    apiKeyId: generated.apiKeyId,
   },
  });

  return privateNoStoreJson(
   aiConversationTurnResponseSchema.parse({
    conversationId: conversationId.data,
    userMessage,
    assistantMessage,
    provider: generated.provider,
    model: generated.model,
    apiKeyId: generated.apiKeyId,
    usage: null,
   }),
  );
 } catch (error) {
  if (error instanceof AiConversationPersistenceNotReadyError) {
   return persistenceNotReadyResponse();
  }
  if (error instanceof z.ZodError) {
   return apiError(
    "AI conversation persistence trả về dữ liệu không đúng contract.",
    502,
    "AI_PERSISTENCE_INVALID_RESPONSE",
   );
  }
  return apiError("AI conversation không hoàn tất.", 503, "AI_UNAVAILABLE");
 }
}
