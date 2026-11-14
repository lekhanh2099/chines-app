import "server-only";

import { z } from "zod";

import { ApiKeyProviderSchema } from "@/lib/ai/api-key-providers";
import { aiTaskIdSchema, aiTaskResolutionSourceSchema } from "@/lib/ai/ai-task-contract";

export const postgrestErrorSchema = z.object({
 code: z.string().optional(),
 message: z.string().optional(),
 details: z.string().nullable().optional(),
 hint: z.string().nullable().optional(),
});

const conversationModeSchema = z.enum([
 "natural",
 "speaking-practice",
 "grammar-coach",
 "hskk-practice",
]);
const correctionStyleSchema = z.enum(["light", "balanced", "strict"]);
const replyModeSchema = z.enum(["adaptive", "chinese", "bilingual"]);
const learnerLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export const memoryPolicySchema = z.enum(["inherit", "enabled", "disabled"]);

export const conversationRowSchema = z.object({
 id: z.uuid(),
 character_id: z.uuid(),
 title: z.string(),
 mode: conversationModeSchema,
 correction_style: correctionStyleSchema,
 reply_mode: replyModeSchema,
 memory_policy: memoryPolicySchema,
});

export const conversationHistoryRowSchema = conversationRowSchema.extend({
 last_message_at: z.iso.datetime({ offset: true }).nullable(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export const conversationContextRowSchema = conversationRowSchema.extend({
 summary: z.string(),
 summary_until_seq: z.number().int().nonnegative(),
});

export const messageRowSchema = z.object({
 id: z.uuid(),
 seq: z.number().int().positive(),
 role: z.enum(["user", "assistant"]),
 content: z.string().trim().min(1).max(6000),
 created_at: z.iso.datetime({ offset: true }),
 metadata: z
  .strictObject({
   provider: ApiKeyProviderSchema.optional(),
   model: z.string().trim().min(1).optional(),
   apiKeyId: z.uuid().nullable().optional(),
   taskId: aiTaskIdSchema.optional(),
   keyLabel: z.string().trim().min(1).max(80).optional(),
   resolutionSource: aiTaskResolutionSourceSchema.optional(),
  })
  .optional(),
});

const assistantRuntimeMetadataSchema = z.strictObject({
 provider: ApiKeyProviderSchema,
 model: z.string().trim().min(1),
 apiKeyId: z.uuid().nullable(),
 taskId: aiTaskIdSchema.optional(),
 keyLabel: z.string().trim().min(1).max(80).optional(),
 resolutionSource: aiTaskResolutionSourceSchema.optional(),
});

export const assistantReplyRowSchema = messageRowSchema.extend({
 metadata: assistantRuntimeMetadataSchema,
});

export const characterRowSchema = z.object({ id: z.uuid() });

export const characterContextRowSchema = z.object({
 id: z.uuid(),
 display_name: z.string().trim().min(1),
 city: z.string(),
 age: z.number().int().min(1).max(120).nullable(),
 background: z.string(),
 personality: z.string(),
 speaking_style: z.string(),
 interests: z.array(z.string()),
 identity_notes: z.string(),
});

export const relationshipContextRowSchema = z.object({
 nickname: z.string(),
 familiarity_score: z.number().min(0).max(1),
 revision: z.number().int().nonnegative(),
});

export const preferenceContextRowSchema = z.object({
 default_mode: conversationModeSchema,
 default_correction_style: correctionStyleSchema,
 default_reply_mode: replyModeSchema,
 learner_level: learnerLevelSchema,
 memory_enabled: z.boolean(),
});

export const messageRpcResultSchema = z.union([
 messageRowSchema,
 z.tuple([messageRowSchema]).transform(([row]) => row),
]);

export const DEFAULT_CHARACTER = {
 display_name: "小林",
 city: "上海",
 background: "在上海生活和工作的年轻人，熟悉普通话日常表达和当代城市生活。",
 personality: "自然、耐心、有分寸，会像朋友一样延续话题，而不是把每句话都变成课堂。",
 speaking_style: "以自然普通话交流；只有在学习者需要时才简短纠错或解释。",
 interests: ["日常生活", "电影", "文化", "城市生活", "语言交流"],
 identity_notes: "这是产品默认角色身份。用户本地保存的旧 memoryNotes 不会自动上传。",
};

export const DEFAULT_CONVERSATION_PREFERENCES: z.output<typeof preferenceContextRowSchema> = {
 default_mode: "natural",
 default_correction_style: "balanced",
 default_reply_mode: "adaptive",
 learner_level: "intermediate",
 memory_enabled: true,
};
