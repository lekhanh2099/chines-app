import {
 AiConversationPersistenceNotReadyError,
 ensureAiConversationSession,
 loadLatestAiConversationSession,
} from "@/features/hanzihome/ai-conversation/ai-conversation-persistence.server";
import { aiConversationSessionSchema } from "@/features/hanzihome/ai-conversation/ai-conversation-session.schemas";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function persistenceNotReadyResponse() {
 return apiError(
  "AI conversation persistence chưa sẵn sàng. Hãy apply migration AI conversation trước khi test flow này.",
  503,
  "AI_PERSISTENCE_NOT_READY",
 );
}

export async function GET() {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 try {
  const session = await loadLatestAiConversationSession(auth.context.user.id);
  return privateNoStoreJson(aiConversationSessionSchema.parse(session));
 } catch (error) {
  if (error instanceof AiConversationPersistenceNotReadyError) {
   return persistenceNotReadyResponse();
  }
  return apiError("Không thể tải lịch sử hội thoại AI.", 500, "AI_CONVERSATION_LOAD_FAILED");
 }
}

export async function POST() {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 try {
  const session = await ensureAiConversationSession(auth.context.user.id);
  return privateNoStoreJson(aiConversationSessionSchema.parse(session));
 } catch (error) {
  if (error instanceof AiConversationPersistenceNotReadyError) {
   return persistenceNotReadyResponse();
  }
  return apiError("Không thể khởi tạo hội thoại AI.", 500, "AI_CONVERSATION_CREATE_FAILED");
 }
}
