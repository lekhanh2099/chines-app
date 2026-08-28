import { z } from "zod";

import { ApiKeyProviderSchema } from "@/lib/api-key-providers";
import { aiRuntimeCapabilitySchema } from "@/lib/ai-runtime-contract";
import {
 aiActivityCursorSchema,
 aiActivityEventSchema,
 aiActivitySummaryGroupSchema,
 aiRuntimeReceiptSchema,
 aiTaskAssignmentSchema,
 aiTaskDefinitionSchema,
 aiTaskIdSchema,
 aiTaskRuntimePreviewSchema,
} from "@/lib/ai-task-contract";

const safeTaskKeySchema = z.strictObject({
 keyId: z.uuid(),
 provider: ApiKeyProviderSchema,
 providerLabel: z.string().min(1),
 label: z.string().min(1),
 maskedKey: z.string().min(1),
 isActive: z.boolean(),
 availability: z.enum(["ready", "paused", "credential-unreadable"]),
 defaultModel: z.string().nullable(),
 capabilities: z.array(aiRuntimeCapabilitySchema),
 models: z.array(z.strictObject({ value: z.string().min(1), label: z.string().min(1) })),
});

export const aiTaskSettingsResponseSchema = z.strictObject({
 tasks: z.array(
  aiTaskDefinitionSchema.extend({
   assignment: aiTaskAssignmentSchema,
   runtimePreview: aiTaskRuntimePreviewSchema,
  }),
 ),
 keys: z.array(safeTaskKeySchema),
});

export const aiTaskUpdateResponseSchema = z.strictObject({
 assignment: aiTaskAssignmentSchema,
 runtimePreview: aiTaskRuntimePreviewSchema,
});

export const aiActivityResponseSchema = z.strictObject({
 events: z.array(aiActivityEventSchema),
 nextCursor: aiActivityCursorSchema.nullable(),
 summaryGroups: z.array(aiActivitySummaryGroupSchema),
});

export const aiTaskRuntimeCheckResponseSchema = z.strictObject({
 taskId: aiTaskIdSchema,
 ok: z.boolean(),
 receipt: aiRuntimeReceiptSchema.nullable(),
 latencyMs: z.number().int().nonnegative(),
 errorCode: z.string().min(1).max(80).nullable(),
});

export type AiTaskSettingsResponse = z.output<typeof aiTaskSettingsResponseSchema>;
export type AiTaskRuntimeCheckResponse = z.output<typeof aiTaskRuntimeCheckResponseSchema>;
