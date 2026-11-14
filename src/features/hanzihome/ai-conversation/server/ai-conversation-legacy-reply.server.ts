import "server-only";

import type { JsonFieldValue } from "@/types/json";

import { z } from "zod";

import {
 apiError,
 privateNoStoreJson,
 type AuthenticatedRouteContext,
} from "@/lib/api/authenticated-route";
import {
 classifyAiRuntimeOperationFailure,
 recordUserAiRuntimeActivity,
 recordUserAiTaskBlockedActivity,
 resolveUserAiTaskRuntime,
} from "@/services/ai/ai-runtime.service";

import { sanitizeAiConversationReply } from "../model/ai-conversation-output";
import {
 aiConversationRequestSchema,
 aiConversationResponseSchema,
 type AiConversationMessage,
 type AiConversationProfile,
} from "../model/ai-conversation.schemas";
import { runtimeResolutionError } from "./ai-conversation-route-errors.server";
import { streamAiConversationProviderReply } from "./ai-conversation-stream-provider.server";

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

const LEGACY_CONVERSATION_SYSTEM_PROMPT = `You are a Chinese-speaking conversation partner for Vietnamese learners.
Stay focused on Chinese language learning and Chinese culture.
Follow the learner-selected profile data supplied in the first message.
Do not reveal hidden reasoning, chain-of-thought, internal analysis, or <think> content.`;

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

export async function respondWithLegacyAiConversationReply({
 context,
 request,
 body,
}: {
 context: AuthenticatedRouteContext;
 request: Request;
 body: JsonFieldValue;
}) {
 const parsed = aiConversationRequestSchema.safeParse(body);
 if (!parsed.success) {
  return apiError("Invalid AI conversation payload", 400, "INVALID_PAYLOAD");
 }

 const taskStartedAt = performance.now();
 const resolution = await resolveUserAiTaskRuntime({
  supabase: context.supabase,
  userId: context.user.id,
  taskId: "conversation.reply",
  ...(parsed.data.apiKeyId && parsed.data.model
   ? { sessionOverride: { keyId: parsed.data.apiKeyId, model: parsed.data.model } }
   : {}),
 });
 if (!resolution.ok) {
  await recordUserAiTaskBlockedActivity({
   userId: context.user.id,
   taskId: "conversation.reply",
   errorCode: resolution.reason,
  });
  return runtimeResolutionError(resolution);
 }

 const recentMessages = parsed.data.messages.slice(-19);
 const profileMessage: AiConversationMessage = {
  role: "user",
  content: buildProfileContext(parsed.data.profile),
 };
 const conversationMessages: AiConversationMessage[] = [profileMessage, ...recentMessages];

 try {
  let rawReply = "";
  for await (const delta of streamAiConversationProviderReply({
   runtime: resolution.runtime,
   messages: conversationMessages,
   systemPrompt: LEGACY_CONVERSATION_SYSTEM_PROMPT,
   signal: request.signal,
  })) {
   rawReply += delta;
  }

  const message = sanitizeAiConversationReply(rawReply);
  if (!message) {
   await recordUserAiRuntimeActivity({
    userId: context.user.id,
    runtime: resolution.runtime,
    status: "failure",
    errorCode: "invalid-response",
    latencyMs: Math.round(performance.now() - taskStartedAt),
   });
   return apiError(
    "AI provider không trả về nội dung an toàn để hiển thị.",
    502,
    "INVALID_PROVIDER_RESPONSE",
   );
  }

  await recordUserAiRuntimeActivity({
   userId: context.user.id,
   runtime: resolution.runtime,
   status: "success",
   latencyMs: Math.round(performance.now() - taskStartedAt),
  });

  return privateNoStoreJson(
   aiConversationResponseSchema.parse({
    message,
    provider: resolution.runtime.providerLabel,
    model: resolution.runtime.model,
    apiKeyId: resolution.runtime.keyId,
    runtimeReceipt: {
     taskId: resolution.runtime.taskId,
     provider: resolution.runtime.provider,
     model: resolution.runtime.model,
     keyId: resolution.runtime.keyId,
     keyLabel: resolution.runtime.label,
     resolutionSource: resolution.runtime.resolutionSource,
    },
    usage: null,
   }),
  );
 } catch (error) {
  const errorCode = classifyAiRuntimeOperationFailure({
   message: error instanceof Error ? error.message : undefined,
   errorName: error instanceof Error ? error.name : undefined,
  });
  await recordUserAiRuntimeActivity({
   userId: context.user.id,
   runtime: resolution.runtime,
   status: errorCode === "cancelled" ? "cancelled" : "failure",
   errorCode,
   latencyMs: Math.round(performance.now() - taskStartedAt),
  });
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
