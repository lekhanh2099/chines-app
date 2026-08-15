import type { JsonFieldValue } from "@/types/json";

import { z } from "zod";

import {
 aiConversationRequestSchema,
 aiConversationResponseSchema,
} from "@/features/hanzihome/ai-conversation/ai-conversation.schemas";
import { generateAiConversationReply } from "@/services/ai.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = aiConversationRequestSchema.safeParse(body);
 if (!parsed.success) {
  return apiError("Invalid AI conversation payload", 400, "INVALID_PAYLOAD");
 }

 const userApiKeys = await getActiveUserApiKeyCredentials(
  auth.context.supabase,
  auth.context.user.id,
 );
 if (userApiKeys.length === 0) {
  return apiError(
   "Chưa có API key AI đang hoạt động. Hãy thêm key trong Cài đặt → AI.",
   503,
   "AI_API_KEY_REQUIRED",
  );
 }

 try {
  const result = await generateAiConversationReply(parsed.data.messages, {
   userApiKeys,
   abortSignal: request.signal,
  });

  if (!result.data) {
   return apiError(result.error || "AI provider không trả về nội dung.", 503, "AI_UNAVAILABLE");
  }

  return privateNoStoreJson(aiConversationResponseSchema.parse({ message: result.data }));
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
