import { z } from "zod";

import {
 AiConversationPersistenceConfigurationError,
 AiConversationPersistenceNotReadyError,
 AiConversationPersistenceRequestError,
} from "@/features/hanzihome/ai-conversation/ai-conversation-persistence.server";
import { aiConversationTurnRequestSchema } from "@/features/hanzihome/ai-conversation/ai-conversation-session.schemas";
import { createPersistedAiConversationTurnStream } from "@/features/hanzihome/ai-conversation/ai-conversation-stream-turn.server";
import { apiError, requireAuthenticatedRoute } from "@/lib/api/authenticated-route";
import { logger } from "@/lib/logger";
import type { JsonFieldValue } from "@/types/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 180;

const streamTurnRequestSchema = aiConversationTurnRequestSchema.extend({
 conversationId: z.uuid(),
});

function persistenceBoundaryErrorResponse(error: unknown) {
 if (error instanceof AiConversationPersistenceNotReadyError) {
  return apiError(
   "Database chưa có schema hội thoại AI. Hãy apply migration AI conversation trước khi test flow persisted.",
   503,
   "AI_PERSISTENCE_NOT_READY",
  );
 }
 if (error instanceof AiConversationPersistenceConfigurationError) {
  return apiError(
   "Server chưa cấu hình Supabase secret cho AI persistence.",
   503,
   "AI_PERSISTENCE_CONFIG_MISSING",
  );
 }
 if (
  error instanceof AiConversationPersistenceRequestError &&
  error.code === "AI_CONVERSATION_NOT_FOUND"
 ) {
  return apiError(
   "Không tìm thấy hội thoại AI của tài khoản hiện tại.",
   404,
   "AI_CONVERSATION_NOT_FOUND",
  );
 }
 if (
  error instanceof AiConversationPersistenceRequestError &&
  (error.status === 401 || error.status === 403 || error.code === "42501")
 ) {
  return apiError(
   "Supabase server credential chưa có quyền truy cập AI persistence.",
   503,
   "AI_PERSISTENCE_ACCESS_FAILED",
  );
 }
 return null;
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = streamTurnRequestSchema.safeParse(body);
 if (!parsed.success) {
  return apiError("Invalid AI conversation stream payload", 400, "INVALID_PAYLOAD");
 }

 try {
  const result = await createPersistedAiConversationTurnStream({
   supabase: auth.context.supabase,
   userId: auth.context.user.id,
   conversationId: parsed.data.conversationId,
   clientMessageId: parsed.data.clientMessageId,
   content: parsed.data.content,
   ...(parsed.data.apiKeyId ? { apiKeyId: parsed.data.apiKeyId } : {}),
   requestSignal: request.signal,
  });
  return result.ok ? result.response : apiError(result.message, result.status, result.code);
 } catch (error) {
  const persistenceResponse = persistenceBoundaryErrorResponse(error);
  if (persistenceResponse) return persistenceResponse;
  if (error instanceof z.ZodError) {
   return apiError(
    "AI conversation persistence trả về dữ liệu không đúng contract.",
    502,
    "AI_PERSISTENCE_INVALID_RESPONSE",
   );
  }
  logger.error("[AI Conversation] stream setup failed", error);
  return apiError("AI conversation không thể bắt đầu stream.", 503, "AI_STREAM_UNAVAILABLE");
 }
}
