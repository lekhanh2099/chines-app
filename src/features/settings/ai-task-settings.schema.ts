import { z } from "zod";

import { ApiKeyProviderSchema } from "@/lib/api-key-providers";
import { aiRuntimeCapabilitySchema } from "@/lib/ai-runtime-contract";
import {
 aiActivityCursorSchema,
 aiActivityEventSchema,
 aiTaskAssignmentSchema,
 aiTaskDefinitionSchema,
} from "@/lib/ai-task-contract";

const safeTaskKeySchema = z.strictObject({
 keyId: z.uuid(),
 provider: ApiKeyProviderSchema,
 providerLabel: z.string().min(1),
 label: z.string().min(1),
 maskedKey: z.string().min(1),
 isActive: z.boolean(),
 defaultModel: z.string().nullable(),
 capabilities: z.array(aiRuntimeCapabilitySchema),
 models: z.array(z.strictObject({ value: z.string().min(1), label: z.string().min(1) })),
});

export const aiTaskSettingsResponseSchema = z.strictObject({
 tasks: z.array(
  aiTaskDefinitionSchema.extend({
   assignment: aiTaskAssignmentSchema,
  }),
 ),
 keys: z.array(safeTaskKeySchema),
});

export const aiTaskUpdateResponseSchema = z.strictObject({
 assignment: aiTaskAssignmentSchema,
});

export const aiActivityResponseSchema = z.strictObject({
 events: z.array(aiActivityEventSchema),
 nextCursor: aiActivityCursorSchema.nullable(),
});

export type AiTaskSettingsResponse = z.output<typeof aiTaskSettingsResponseSchema>;
