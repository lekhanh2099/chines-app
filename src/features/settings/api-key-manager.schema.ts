import { z } from "zod";

import { API_KEY_PROVIDER_OPTIONS } from "@/lib/api-key-providers";

const apiKeyProviderSchema = z.enum(API_KEY_PROVIDER_OPTIONS.map((option) => option.value));

export const managedApiKeySchema = z.object({
 id: z.uuid(),
 provider: apiKeyProviderSchema,
 providerLabel: z.string(),
 label: z.string(),
 maskedKey: z.string(),
 isActive: z.boolean(),
 priority: z.number().int(),
 defaultModel: z.string().nullable(),
 lastValidatedAt: z.string().nullable(),
 createdAt: z.string(),
 updatedAt: z.string(),
});

const apiKeysSummarySchema = z.object({
 total: z.number().int().nonnegative(),
 active: z.number().int().nonnegative(),
 groq: z.number().int().nonnegative(),
 deepseek: z.number().int().nonnegative(),
 gemini: z.number().int().nonnegative(),
 openai: z.number().int().nonnegative(),
});

export const apiKeysResponseSchema = z.object({
 schemaReady: z.boolean().default(true),
 schemaReason: z.enum(["ok", "missing-table", "schema-error"]).optional(),
 schemaMessage: z.string().nullable().default(null),
 keys: z.array(managedApiKeySchema),
 summary: apiKeysSummarySchema,
});

export const addApiKeyResponseSchema = z.object({
 success: z.literal(true),
 key: managedApiKeySchema,
 message: z.string(),
});

export const updateApiKeyResponseSchema = z.object({
 success: z.literal(true),
 key: managedApiKeySchema,
});

export const moveApiKeyResponseSchema = z.object({
 success: z.literal(true),
 keys: z.array(managedApiKeySchema),
});

export const deleteApiKeyResponseSchema = z.object({
 success: z.literal(true),
});
export type ApiKeysResponse = z.output<typeof apiKeysResponseSchema>;
