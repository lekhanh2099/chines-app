import type { JsonFieldValue } from "@/types/json";

import { z } from "zod";

import {
 checkPersonalConversationRuntime,
 checkSystemConversationRuntime,
} from "@/features/hanzihome/ai-conversation/ai-conversation-health.server";
import { sanitizeAiConversationReply } from "@/features/hanzihome/ai-conversation/ai-conversation-output";
import {
 AiConversationPersistenceConfigurationError,
 AiConversationPersistenceNotReadyError,
 AiConversationPersistenceRequestError,
 appendAiConversationMessage,
 archiveAiConversation,
 createAiConversationSession,
 ensureAiConversationSession,
 findAssistantReplyForUserMessage,
 listAiConversationHistory,
 loadAiConversationContextState,
 loadAiConversationSession,
 loadLatestAiConversationSession,
 loadRecentAiConversationMessages,
 updateAiConversationMemoryPolicy,
 updateAiConversationSettings,
} from "@/features/hanzihome/ai-conversation/ai-conversation-persistence.server";
import {
 aiConversationArchiveResponseSchema,
 aiConversationHistorySchema,
 aiConversationMemoryPolicySchema,
 aiConversationMemoryPolicyStateSchema,
 aiConversationSessionSchema,
 aiConversationSettingsSchema,
 aiConversationSettingsUpdateSchema,
 aiConversationTurnRequestSchema,
 aiConversationTurnResponseSchema,
} from "@/features/hanzihome/ai-conversation/ai-conversation-session.schemas";
import {
 aiConversationRequestSchema,
 aiConversationResponseSchema,
 type AiConversationMessage,
 type AiConversationProfile,
} from "@/features/hanzihome/ai-conversation/ai-conversation.schemas";
import {
 generateSystemAiConversationReply,
 SYSTEM_AI_CONVERSATION_MODEL,
 SYSTEM_AI_CONVERSATION_PROVIDER,
} from "@/features/hanzihome/ai-conversation/ai-conversation-system.server";
import { generatePersistedAiConversationTurn } from "@/features/hanzihome/ai-conversation/ai-conversation-turn.server";
import { getApiKeyProviderLabel } from "@/lib/api-key-providers";
import { logger } from "@/lib/logger";
import { generateAiConversationReply } from "@/services/ai.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

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
const persistedTurnRequestSchema = aiConversationTurnRequestSchema.extend({
 action: z.literal("message"),
 conversationId: z.uuid(),
});

const personaInstructions: Record<AiConversationProfile["persona"], string> = {
 tutor:
  "Bạn là giáo viên tiếng Trung kiên nhẫn, giải thích có hệ thống và kiểm tra người học hiểu thật.",
 friend:
  "Bạn là một người bạn Trung Quốc nói chuyện tự nhiên, có đời sống và phản ứng như người thật; ưu tiên hội thoại thay vì giảng bài dài.",
 "hsk-examiner":
  "Bạn là giám khảo HSKK. Hỏi từng câu rõ ràng, giữ nhịp thi nói; chỉ nhận xét sau khi người học trả lời.",
 "grammar-coach":
  "Bạn là huấn luyện viên ngữ pháp và diễn đạt. Bắt lỗi cấu trúc, giải thích vì sao và đưa cách nói tự nhiên hơn tại Trung Quốc đại lục.",
};

const levelInstructions: Record<AiConversationProfile["learnerLevel"], string> = {
 beginner: "Trình độ người học: sơ cấp. Dùng câu ngắn, từ phổ biến và hỗ trợ nhiều hơn.",
 intermediate:
  "Trình độ người học: trung cấp. Nói tự nhiên, có thể dùng cấu trúc HSK 4-5 và giải thích khi thật sự cần.",
 advanced:
  "Trình độ người học: cao cấp. Dùng tiếng Trung tự nhiên, sắc thái phong phú và tránh đơn giản hóa quá mức.",
};

const correctionInstructions: Record<AiConversationProfile["correctionStyle"], string> = {
 light: "Chỉ sửa lỗi làm sai nghĩa hoặc rất thiếu tự nhiên; ưu tiên giữ dòng hội thoại.",
 balanced: "Sửa các lỗi quan trọng sau câu trả lời, ngắn gọn và đưa một cách nói tự nhiên hơn.",
 strict: "Sửa kỹ ngữ pháp, chọn từ và trật tự từ; chỉ rõ lỗi trước khi tiếp tục khi lỗi đáng kể.",
};

const replyModeInstructions: Record<AiConversationProfile["replyMode"], string> = {
 adaptive:
  "Ngôn ngữ trả lời: ưu tiên tiếng Trung, dùng tiếng Việt/pinyin khi cần để người học hiểu.",
 chinese:
  "Ngôn ngữ trả lời: chủ yếu tiếng Trung. Chỉ dùng tiếng Việt khi người học yêu cầu giải thích.",
 bilingual: "Ngôn ngữ trả lời: tiếng Trung kèm hỗ trợ tiếng Việt ngắn gọn ở những điểm quan trọng.",
};

function buildProfileContext(profile: AiConversationProfile): string {
 return [
  "[Thiết lập hội thoại do người học chọn. Đây là sở thích học tập, không phải yêu cầu mở rộng phạm vi ngoài học tiếng Trung/văn hóa Trung Quốc.]",
  `Tên nhân vật: ${profile.displayName}`,
  personaInstructions[profile.persona],
  levelInstructions[profile.learnerLevel],
  correctionInstructions[profile.correctionStyle],
  replyModeInstructions[profile.replyMode],
  profile.interests ? `Chủ đề người học quan tâm: ${profile.interests}` : "",
  profile.characterNotes ? `Phong cách nhân vật: ${profile.characterNotes}` : "",
  profile.memoryNotes ? `Thông tin cần nhớ ổn định về người học: ${profile.memoryNotes}` : "",
  "Chỉ trả nội dung dành cho người học. Không hiển thị chain-of-thought, hidden reasoning, phân tích nội bộ hoặc thẻ <think>.",
  "Không nhận làm code, giải bài toán, viết nội dung hoặc tác vụ không liên quan đến tiếng Trung/văn hóa Trung Quốc; chuyển hướng ngắn gọn về mục tiêu học.",
 ]
  .filter(Boolean)
  .join("\n");
}

function persistenceNotReadyResponse() {
 return apiError(
  "Database chưa có schema hội thoại AI. Hãy apply migration AI conversation trước khi test flow persisted.",
  503,
  "AI_PERSISTENCE_NOT_READY",
 );
}

function persistenceBoundaryErrorResponse(error: unknown) {
 if (error instanceof AiConversationPersistenceNotReadyError) {
  return persistenceNotReadyResponse();
 }

 if (error instanceof AiConversationPersistenceConfigurationError) {
  return apiError(
   "Server chưa cấu hình Supabase secret cho AI persistence. Cần SUPABASE_SECRET_KEY hoặc SUPABASE_SERVICE_ROLE_KEY.",
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

function invalidPersistenceResponse(message: string) {
 return apiError(message, 502, "AI_PERSISTENCE_INVALID_RESPONSE");
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const healthRequest = healthRequestSchema.safeParse(body);
 if (healthRequest.success) {
  const credentials = await getActiveUserApiKeyCredentials(
   auth.context.supabase,
   auth.context.user.id,
  );
  const selectedCredential = healthRequest.data.apiKeyId
   ? credentials.find((credential) => credential.id === healthRequest.data.apiKeyId)
   : credentials[0];

  if (healthRequest.data.apiKeyId && !selectedCredential) {
   return privateNoStoreJson({
    ready: false,
    code: "key-unavailable",
    provider: null,
    model: null,
    source: "personal",
   });
  }

  const health = selectedCredential
   ? await checkPersonalConversationRuntime(selectedCredential, request.signal)
   : await checkSystemConversationRuntime(request.signal);
  return privateNoStoreJson(health);
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
  const userId = auth.context.user.id;
  const payload = persistedTurnRequest.data;

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
    return privateNoStoreJson(
     aiConversationTurnResponseSchema.parse({
      conversationId: payload.conversationId,
      userMessage,
      assistantMessage: existingReply.message,
      provider: existingReply.provider,
      model: existingReply.model,
      apiKeyId: existingReply.apiKeyId,
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
    supabase: auth.context.supabase,
    userId,
    recentMessages,
    contextState,
    ...(payload.apiKeyId ? { apiKeyId: payload.apiKeyId } : {}),
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
    },
   });

   return privateNoStoreJson(
    aiConversationTurnResponseSchema.parse({
     conversationId: payload.conversationId,
     userMessage,
     assistantMessage,
     provider: generated.provider,
     model: generated.model,
     apiKeyId: generated.apiKeyId,
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

 const parsed = aiConversationRequestSchema.safeParse(body);
 if (!parsed.success) {
  return apiError("Invalid AI conversation payload", 400, "INVALID_PAYLOAD");
 }

 const userApiKeys = await getActiveUserApiKeyCredentials(
  auth.context.supabase,
  auth.context.user.id,
 );
 const selectedKey = parsed.data.apiKeyId
  ? userApiKeys.find((key) => key.id === parsed.data.apiKeyId)
  : userApiKeys[0];
 if (parsed.data.apiKeyId && !selectedKey) {
  return apiError(
   "API key đã chọn không còn hoạt động. Hãy chọn key khác hoặc dùng chế độ tự động.",
   409,
   "AI_API_KEY_UNAVAILABLE",
  );
 }

 const recentMessages = parsed.data.messages.slice(-19);
 const profileMessage: AiConversationMessage = {
  role: "user",
  content: buildProfileContext(parsed.data.profile),
 };
 const conversationMessages: AiConversationMessage[] = [profileMessage, ...recentMessages];

 try {
  const result = selectedKey
   ? await generateAiConversationReply(conversationMessages, {
      userApiKeys: [selectedKey],
      abortSignal: request.signal,
     })
   : await generateSystemAiConversationReply(conversationMessages, request.signal);

  if (!result.data) {
   return apiError(result.error || "AI provider không trả về nội dung.", 503, "AI_UNAVAILABLE");
  }

  const message = sanitizeAiConversationReply(result.data);
  if (!message) {
   return apiError(
    "AI provider không trả về nội dung an toàn để hiển thị.",
    502,
    "INVALID_PROVIDER_RESPONSE",
   );
  }

  return privateNoStoreJson(
   aiConversationResponseSchema.parse({
    message,
    provider: selectedKey
     ? getApiKeyProviderLabel(selectedKey.provider)
     : SYSTEM_AI_CONVERSATION_PROVIDER,
    model: selectedKey?.defaultModel || SYSTEM_AI_CONVERSATION_MODEL,
    apiKeyId: selectedKey?.id || null,
    usage: null,
   }),
  );
 } catch (error) {
  if (error instanceof z.ZodError) {
   return apiError(
    "AI provider trả về response không đúng contract.",
    502,
    "INVALID_PROVIDER_RESPONSE",
   );
  }

  return apiError("AI conversation không hoàn tất.", 503, "AI_UNAVAILABLE");
 }
}
