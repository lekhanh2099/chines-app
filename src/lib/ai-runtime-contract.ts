import { z } from "zod";

import { ApiKeyProviderSchema } from "@/lib/api-key-providers";

export const aiRuntimeCapabilitySchema = z.enum([
 "conversation",
 "daily-reading-translation",
 "daily-reading-learning",
 "lookup",
 "structured-memory",
 "semantic-memory",
]);

export const aiRuntimeReadinessStatusSchema = z.enum([
 "ready",
 "missing-key",
 "storage-unavailable",
]);

export const aiRuntimeReadinessReasonSchema = z.enum([
 "ok",
 "no-active-key",
 "schema-unavailable",
 "vault-unavailable",
 "credential-unreadable",
 "selected-key-unavailable",
 "capability-unavailable",
]);

export const aiRuntimeOperationErrorCodeSchema = z.enum([
 "invalid-key",
 "quota-exhausted",
 "provider-unavailable",
 "network-error",
 "invalid-response",
 "cancelled",
]);

export const aiRuntimeSafeKeySchema = z.strictObject({
 keyId: z.uuid(),
 provider: ApiKeyProviderSchema,
 providerLabel: z.string().min(1).max(80),
 label: z.string().min(1).max(80),
 maskedKey: z.string().min(1).max(120),
 model: z.string().min(1).max(200),
 priority: z.number().int(),
 lastValidatedAt: z.string().nullable(),
 capabilities: z.array(aiRuntimeCapabilitySchema),
});

const aiRuntimeReadyResponseSchema = z.strictObject({
 status: z.literal("ready"),
 reason: z.literal("ok"),
 activeKeyCount: z.number().int().positive(),
 usableKeyCount: z.number().int().positive(),
 selectedKey: aiRuntimeSafeKeySchema,
 capabilities: z.array(aiRuntimeCapabilitySchema).min(1),
});

const aiRuntimeMissingKeyResponseSchema = z.strictObject({
 status: z.literal("missing-key"),
 reason: z.literal("no-active-key"),
 activeKeyCount: z.literal(0),
 usableKeyCount: z.literal(0),
 selectedKey: z.null(),
 capabilities: z.array(aiRuntimeCapabilitySchema).max(0),
});

const aiRuntimeStorageUnavailableResponseSchema = z.strictObject({
 status: z.literal("storage-unavailable"),
 reason: z.enum(["schema-unavailable", "vault-unavailable", "credential-unreadable"]),
 activeKeyCount: z.number().int().nonnegative(),
 usableKeyCount: z.literal(0),
 selectedKey: z.null(),
 capabilities: z.array(aiRuntimeCapabilitySchema).max(0),
});

export const aiRuntimeReadinessResponseSchema = z.discriminatedUnion("status", [
 aiRuntimeReadyResponseSchema,
 aiRuntimeMissingKeyResponseSchema,
 aiRuntimeStorageUnavailableResponseSchema,
]);

export type AiRuntimeCapability = z.output<typeof aiRuntimeCapabilitySchema>;
export type AiRuntimeReadinessStatus = z.output<typeof aiRuntimeReadinessStatusSchema>;
export type AiRuntimeReadinessReason = z.output<typeof aiRuntimeReadinessReasonSchema>;
export type AiRuntimeOperationErrorCode = z.output<typeof aiRuntimeOperationErrorCodeSchema>;
export type AiRuntimeSafeKey = z.output<typeof aiRuntimeSafeKeySchema>;
export type AiRuntimeReadinessResponse = z.output<typeof aiRuntimeReadinessResponseSchema>;
