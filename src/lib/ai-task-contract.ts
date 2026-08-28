import { z } from "zod";

import { ApiKeyProviderSchema } from "@/lib/api-key-providers";
import {
 aiRuntimeCapabilitySchema,
 aiRuntimeMissingKeyResponseSchema,
 aiRuntimeReadinessReasonSchema,
 aiRuntimeReadyResponseSchema,
 aiRuntimeStorageUnavailableResponseSchema,
} from "@/lib/ai-runtime-contract";

export const aiTaskIdSchema = z.enum([
 "conversation.reply",
 "lookup.quick",
 "lookup.deep",
 "daily-reading.translation",
 "daily-reading.vocabulary",
 "daily-reading.grammar",
 "daily-reading.questions",
 "conversation.summary",
 "conversation.memory-extraction",
 "conversation.semantic-memory",
]);

export const AI_SEMANTIC_MEMORY_MODEL = "gemini-embedding-001";

export const aiTaskRoutingModeSchema = z.enum(["auto", "assigned", "disabled"]);
export const aiTaskResolutionSourceSchema = z.enum(["auto", "assigned", "session-override"]);
export const aiTaskGroupSchema = z.enum(["main", "advanced"]);

export const aiTaskDefinitionSchema = z.strictObject({
 id: aiTaskIdSchema,
 capability: aiRuntimeCapabilitySchema,
 group: aiTaskGroupSchema,
});

export const AI_TASK_REGISTRY = z.array(aiTaskDefinitionSchema).parse([
 { id: "conversation.reply", capability: "conversation", group: "main" },
 { id: "lookup.quick", capability: "lookup", group: "main" },
 { id: "lookup.deep", capability: "lookup", group: "main" },
 {
  id: "daily-reading.translation",
  capability: "daily-reading-translation",
  group: "main",
 },
 {
  id: "daily-reading.vocabulary",
  capability: "daily-reading-learning",
  group: "main",
 },
 { id: "daily-reading.grammar", capability: "daily-reading-learning", group: "main" },
 { id: "daily-reading.questions", capability: "daily-reading-learning", group: "main" },
 { id: "conversation.summary", capability: "structured-memory", group: "advanced" },
 {
  id: "conversation.memory-extraction",
  capability: "structured-memory",
  group: "advanced",
 },
 {
  id: "conversation.semantic-memory",
  capability: "semantic-memory",
  group: "advanced",
 },
]);

const autoAiTaskAssignmentSchema = z.strictObject({
 taskId: aiTaskIdSchema,
 mode: z.literal("auto"),
 keyId: z.null(),
 model: z.null(),
});

const assignedAiTaskAssignmentSchema = z.strictObject({
 taskId: aiTaskIdSchema,
 mode: z.literal("assigned"),
 keyId: z.uuid(),
 model: z.string().trim().min(1).max(200),
});

const disabledAiTaskAssignmentSchema = z.strictObject({
 taskId: aiTaskIdSchema,
 mode: z.literal("disabled"),
 keyId: z.null(),
 model: z.null(),
});

export const aiTaskAssignmentSchema = z.discriminatedUnion("mode", [
 autoAiTaskAssignmentSchema,
 assignedAiTaskAssignmentSchema,
 disabledAiTaskAssignmentSchema,
]);

export const aiTaskSessionOverrideSchema = z.strictObject({
 keyId: z.uuid(),
 model: z.string().trim().min(1).max(200),
});

export const aiRuntimeReceiptSchema = z.strictObject({
 taskId: aiTaskIdSchema,
 provider: ApiKeyProviderSchema,
 model: z.string().min(1).max(200),
 keyId: z.uuid(),
 keyLabel: z.string().min(1).max(80),
 resolutionSource: aiTaskResolutionSourceSchema,
});

const readyAiTaskRuntimePreviewSchema = z.strictObject({
 taskId: aiTaskIdSchema,
 status: z.literal("ready"),
 reason: z.literal("ok"),
 receipt: aiRuntimeReceiptSchema,
});

const unavailableAiTaskRuntimePreviewSchema = z.strictObject({
 taskId: aiTaskIdSchema,
 status: z.enum(["missing-key", "storage-unavailable", "task-disabled"]),
 reason: aiRuntimeReadinessReasonSchema,
 receipt: z.null(),
});

export const aiTaskRuntimePreviewSchema = z.union([
 readyAiTaskRuntimePreviewSchema,
 unavailableAiTaskRuntimePreviewSchema,
]);

const taskRuntimesSchema = z.array(aiTaskRuntimePreviewSchema);

export const aiRuntimeWithTaskRuntimesResponseSchema = z.discriminatedUnion("status", [
 aiRuntimeReadyResponseSchema.extend({ taskRuntimes: taskRuntimesSchema }),
 aiRuntimeMissingKeyResponseSchema.extend({ taskRuntimes: taskRuntimesSchema }),
 aiRuntimeStorageUnavailableResponseSchema.extend({ taskRuntimes: taskRuntimesSchema }),
]);

export const aiActivityStatusSchema = z.enum(["success", "failure", "cancelled", "blocked"]);

export const aiActivityEventSchema = z.strictObject({
 id: z.uuid(),
 taskId: aiTaskIdSchema,
 provider: ApiKeyProviderSchema.nullable(),
 model: z.string().min(1).max(200).nullable(),
 keyId: z.uuid().nullable(),
 keyLabel: z.string().min(1).max(80).nullable(),
 resolutionSource: aiTaskResolutionSourceSchema.nullable(),
 status: aiActivityStatusSchema,
 errorCode: z.string().min(1).max(80).nullable(),
 latencyMs: z.number().int().nonnegative().nullable(),
 inputTokens: z.number().int().nonnegative().nullable(),
 outputTokens: z.number().int().nonnegative().nullable(),
 resourceType: z.string().min(1).max(80).nullable(),
 resourceId: z.string().min(1).max(200).nullable(),
 createdAt: z.iso.datetime({ offset: true }),
});

export const aiActivityCursorSchema = z.strictObject({
 createdAt: z.iso.datetime({ offset: true }),
 id: z.uuid(),
});

export const aiActivitySummaryGroupSchema = z.strictObject({
 taskId: aiTaskIdSchema,
 provider: ApiKeyProviderSchema,
 model: z.string().min(1).max(200),
 attempts: z.number().int().nonnegative(),
 successes: z.number().int().nonnegative(),
 successRate: z.number().min(0).max(100),
 averageLatencyMs: z.number().int().nonnegative().nullable(),
 inputTokens: z.number().int().nonnegative(),
 outputTokens: z.number().int().nonnegative(),
});

export function getAiTaskDefinition(taskId: AiTaskId): AiTaskDefinition {
 const definition = AI_TASK_REGISTRY.find((candidate) => candidate.id === taskId);
 if (!definition) throw new Error(`Unknown AI task: ${taskId}`);
 return definition;
}

export type AiTaskId = z.output<typeof aiTaskIdSchema>;
export type AiTaskRoutingMode = z.output<typeof aiTaskRoutingModeSchema>;
export type AiTaskResolutionSource = z.output<typeof aiTaskResolutionSourceSchema>;
export type AiTaskDefinition = z.output<typeof aiTaskDefinitionSchema>;
export type AiTaskAssignment = z.output<typeof aiTaskAssignmentSchema>;
export type AiTaskSessionOverride = z.output<typeof aiTaskSessionOverrideSchema>;
export type AiRuntimeReceipt = z.output<typeof aiRuntimeReceiptSchema>;
export type AiTaskRuntimePreview = z.output<typeof aiTaskRuntimePreviewSchema>;
export type AiRuntimeWithTaskRuntimesResponse = z.output<
 typeof aiRuntimeWithTaskRuntimesResponseSchema
>;
export type AiActivityEvent = z.output<typeof aiActivityEventSchema>;
export type AiActivityCursor = z.output<typeof aiActivityCursorSchema>;
export type AiActivitySummaryGroup = z.output<typeof aiActivitySummaryGroupSchema>;
