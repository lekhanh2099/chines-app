import "server-only";

import { apiError } from "@/lib/api/authenticated-route";

import {
 AiConversationPersistenceConfigurationError,
 AiConversationPersistenceNotReadyError,
 AiConversationPersistenceRequestError,
} from "./ai-conversation-persistence.server";

function persistenceNotReadyResponse() {
 return apiError(
  "Database chưa có schema hội thoại AI. Hãy apply migration AI conversation trước khi test flow persisted.",
  503,
  "AI_PERSISTENCE_NOT_READY",
 );
}

export function persistenceBoundaryErrorResponse(error: unknown) {
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

export function invalidPersistenceResponse(message: string) {
 return apiError(message, 502, "AI_PERSISTENCE_INVALID_RESPONSE");
}

export function runtimeResolutionError(input: {
 status: "missing-key" | "storage-unavailable" | "task-disabled";
 reason: string;
}) {
 if (input.status === "task-disabled") {
  return apiError(
   "Tác vụ trả lời hội thoại đang tắt trong Cài đặt → AI → Tác vụ AI.",
   409,
   "AI_TASK_DISABLED",
  );
 }
 if (input.status === "missing-key") {
  return apiError(
   input.reason === "selected-key-unavailable"
    ? "API key đã chọn không còn hoạt động. Hãy chọn key khác hoặc dùng chế độ tự động."
    : "Chưa có API key AI đang hoạt động. Hãy thêm key trong Cài đặt → AI.",
   409,
   input.reason === "selected-key-unavailable" ? "AI_API_KEY_UNAVAILABLE" : "AI_API_KEY_REQUIRED",
  );
 }

 return apiError(
  "Kho API key an toàn phía server chưa sẵn sàng. Hãy kiểm tra lại cấu hình AI.",
  503,
  "AI_RUNTIME_STORAGE_UNAVAILABLE",
 );
}
