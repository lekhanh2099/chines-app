import type { JsonFieldValue } from "@/types/json";

import { z } from "zod";

import { checkPersonalConversationRuntime } from "@/features/hanzihome/ai-conversation/server/ai-conversation-health.server";
import { respondWithLegacyAiConversationReply } from "@/features/hanzihome/ai-conversation/server/ai-conversation-legacy-reply.server";
import {
 archiveAiConversation,
 createAiConversationSession,
 ensureAiConversationSession,
 listAiConversationHistory,
 loadAiConversationSession,
 loadLatestAiConversationSession,
 updateAiConversationMemoryPolicy,
 updateAiConversationSettings,
} from "@/features/hanzihome/ai-conversation/server/ai-conversation-persistence.server";
import {
 persistedTurnRequestSchema,
 respondWithPersistedAiConversationTurn,
} from "@/features/hanzihome/ai-conversation/server/ai-conversation-persisted-turn-response.server";
import {
 invalidPersistenceResponse,
 persistenceBoundaryErrorResponse,
} from "@/features/hanzihome/ai-conversation/server/ai-conversation-route-errors.server";
import {
 aiConversationArchiveResponseSchema,
 aiConversationHistorySchema,
 aiConversationMemoryPolicySchema,
 aiConversationMemoryPolicyStateSchema,
 aiConversationSessionSchema,
 aiConversationSettingsSchema,
 aiConversationSettingsUpdateSchema,
} from "@/features/hanzihome/ai-conversation/model/ai-conversation-session.schemas";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import { logger } from "@/lib/logger";
import { resolveUserAiRuntime } from "@/services/ai/ai-runtime.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const healthRequestSchema = z.strictObject({
 action: z.literal("health"),
 apiKeyId: z.uuid().optional(),
});

const sessionRequestSchema = z.strictObject({
 action: z.literal("session"),
 conversationId: z.uuid().optional(),
});
const ensureSessionRequestSchema = z.strictObject({ action: z.literal("ensure-session") });
const historyRequestSchema = z.strictObject({ action: z.literal("history") });
const createConversationRequestSchema = z.strictObject({
 action: z.literal("create-conversation"),
});
const archiveConversationRequestSchema = z.strictObject({
 action: z.literal("archive-conversation"),
 conversationId: z.uuid(),
});
const updateMemoryPolicyRequestSchema = z.strictObject({
 action: z.literal("update-memory-policy"),
 conversationId: z.uuid(),
 memoryPolicy: aiConversationMemoryPolicySchema,
});
const updateSettingsRequestSchema = aiConversationSettingsUpdateSchema.extend({
 action: z.literal("update-settings"),
 conversationId: z.uuid(),
});

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const healthRequest = healthRequestSchema.safeParse(body);
 if (healthRequest.success) {
  const resolution = await resolveUserAiRuntime({
   supabase: auth.context.supabase,
   userId: auth.context.user.id,
   capability: "conversation",
   ...(healthRequest.data.apiKeyId ? { apiKeyId: healthRequest.data.apiKeyId } : {}),
  });
  if (!resolution.ok) {
   return privateNoStoreJson({
    ready: false,
    code: resolution.status === "missing-key" ? "key-unavailable" : "provider-unavailable",
    provider: null,
    model: null,
    source: "personal",
   });
  }

  return privateNoStoreJson(
   await checkPersonalConversationRuntime(resolution.runtime, request.signal),
  );
 }

 const sessionRequest = sessionRequestSchema.safeParse(body);
 if (sessionRequest.success) {
  try {
   const session = sessionRequest.data.conversationId
    ? await loadAiConversationSession({
       userId: auth.context.user.id,
       conversationId: sessionRequest.data.conversationId,
      })
    : await loadLatestAiConversationSession(auth.context.user.id);
   return privateNoStoreJson(aiConversationSessionSchema.parse(session));
  } catch (error) {
   const persistenceResponse = persistenceBoundaryErrorResponse(error);
   if (persistenceResponse) return persistenceResponse;
   if (error instanceof z.ZodError) {
    return invalidPersistenceResponse(
     "AI conversation session persistence trả về dữ liệu không đúng contract.",
    );
   }
   logger.error("[AI Conversation] persisted session load failed", error);
   return apiError("Không thể tải lịch sử hội thoại AI.", 500, "AI_CONVERSATION_LOAD_FAILED");
  }
 }

 const ensureSessionRequest = ensureSessionRequestSchema.safeParse(body);
 if (ensureSessionRequest.success) {
  try {
   const session = await ensureAiConversationSession(auth.context.user.id);
   return privateNoStoreJson(aiConversationSessionSchema.parse(session));
  } catch (error) {
   const persistenceResponse = persistenceBoundaryErrorResponse(error);
   if (persistenceResponse) return persistenceResponse;
   logger.error("[AI Conversation] persisted session create failed", error);
   return apiError("Không thể khởi tạo hội thoại AI.", 500, "AI_CONVERSATION_CREATE_FAILED");
  }
 }

 const historyRequest = historyRequestSchema.safeParse(body);
 if (historyRequest.success) {
  try {
   const history = await listAiConversationHistory(auth.context.user.id);
   return privateNoStoreJson(aiConversationHistorySchema.parse(history));
  } catch (error) {
   const persistenceResponse = persistenceBoundaryErrorResponse(error);
   if (persistenceResponse) return persistenceResponse;
   if (error instanceof z.ZodError) {
    return invalidPersistenceResponse(
     "AI conversation history persistence trả về dữ liệu không đúng contract.",
    );
   }
   logger.error("[AI Conversation] history load failed", error);
   return apiError("Không thể tải danh sách hội thoại AI.", 500, "AI_CONVERSATION_HISTORY_FAILED");
  }
 }

 const createConversationRequest = createConversationRequestSchema.safeParse(body);
 if (createConversationRequest.success) {
  try {
   const session = await createAiConversationSession(auth.context.user.id);
   return privateNoStoreJson(aiConversationSessionSchema.parse(session));
  } catch (error) {
   const persistenceResponse = persistenceBoundaryErrorResponse(error);
   if (persistenceResponse) return persistenceResponse;
   if (error instanceof z.ZodError) {
    return invalidPersistenceResponse(
     "AI conversation create persistence trả về dữ liệu không đúng contract.",
    );
   }
   logger.error("[AI Conversation] new conversation create failed", error);
   return apiError("Không thể tạo hội thoại AI mới.", 500, "AI_CONVERSATION_CREATE_FAILED");
  }
 }

 const archiveConversationRequest = archiveConversationRequestSchema.safeParse(body);
 if (archiveConversationRequest.success) {
  try {
   const result = await archiveAiConversation({
    userId: auth.context.user.id,
    conversationId: archiveConversationRequest.data.conversationId,
   });
   return privateNoStoreJson(aiConversationArchiveResponseSchema.parse(result));
  } catch (error) {
   const persistenceResponse = persistenceBoundaryErrorResponse(error);
   if (persistenceResponse) return persistenceResponse;
   if (error instanceof z.ZodError) {
    return invalidPersistenceResponse(
     "AI conversation archive persistence trả về dữ liệu không đúng contract.",
    );
   }
   logger.error("[AI Conversation] archive failed", error);
   return apiError("Không thể lưu trữ hội thoại AI.", 500, "AI_CONVERSATION_ARCHIVE_FAILED");
  }
 }

 const updateMemoryPolicyRequest = updateMemoryPolicyRequestSchema.safeParse(body);
 if (updateMemoryPolicyRequest.success) {
  try {
   const state = await updateAiConversationMemoryPolicy({
    userId: auth.context.user.id,
    conversationId: updateMemoryPolicyRequest.data.conversationId,
    memoryPolicy: updateMemoryPolicyRequest.data.memoryPolicy,
   });
   return privateNoStoreJson(aiConversationMemoryPolicyStateSchema.parse(state));
  } catch (error) {
   const persistenceResponse = persistenceBoundaryErrorResponse(error);
   if (persistenceResponse) return persistenceResponse;
   if (error instanceof z.ZodError) {
    return invalidPersistenceResponse(
     "AI memory policy persistence trả về dữ liệu không đúng contract.",
    );
   }
   logger.error("[AI Conversation] memory policy update failed", error);
   return apiError("Không thể cập nhật bộ nhớ hội thoại.", 500, "AI_MEMORY_POLICY_UPDATE_FAILED");
  }
 }

 const updateSettingsRequest = updateSettingsRequestSchema.safeParse(body);
 if (updateSettingsRequest.success) {
  const { conversationId, mode, correctionStyle, replyMode, learnerLevel } =
   updateSettingsRequest.data;
  const settings = { mode, correctionStyle, replyMode, learnerLevel };
  try {
   const persistedSettings = await updateAiConversationSettings({
    userId: auth.context.user.id,
    conversationId,
    settings,
   });
   return privateNoStoreJson(aiConversationSettingsSchema.parse(persistedSettings));
  } catch (error) {
   const persistenceResponse = persistenceBoundaryErrorResponse(error);
   if (persistenceResponse) return persistenceResponse;
   if (error instanceof z.ZodError) {
    return invalidPersistenceResponse(
     "AI conversation settings persistence trả về dữ liệu không đúng contract.",
    );
   }
   logger.error("[AI Conversation] persisted settings update failed", error);
   return apiError("Không thể lưu thiết lập hội thoại AI.", 500, "AI_SETTINGS_UPDATE_FAILED");
  }
 }

 const persistedTurnRequest = persistedTurnRequestSchema.safeParse(body);
 if (persistedTurnRequest.success) {
  return respondWithPersistedAiConversationTurn({
   context: auth.context,
   request,
   payload: persistedTurnRequest.data,
  });
 }

 return respondWithLegacyAiConversationReply({ context: auth.context, request, body });
}
