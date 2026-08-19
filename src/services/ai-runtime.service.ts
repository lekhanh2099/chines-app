import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { getDefaultApiKeyModel } from "@/lib/api-key-models";
import { getApiKeyProviderLabel, type ApiKeyProvider } from "@/lib/api-key-providers";
import {
 aiRuntimeReadinessResponseSchema,
 type AiRuntimeCapability,
 type AiRuntimeOperationErrorCode,
 type AiRuntimeReadinessReason,
 type AiRuntimeReadinessResponse,
 type AiRuntimeSafeKey,
} from "@/lib/ai-runtime-contract";
import { isByokEncryptionConfigured } from "@/lib/encryption";
import {
 getActiveUserApiKeyCredentials,
 getUserApiKeysSchemaStatus,
 listUserApiKeys,
 type UserApiKey,
 type UserApiKeyCredential,
} from "@/services/user-api-keys.service";

const generationCapabilities: readonly AiRuntimeCapability[] = [
 "conversation",
 "daily-reading-translation",
 "daily-reading-learning",
 "lookup",
 "structured-memory",
];

type AiRuntimeStorageIssue = Extract<
 AiRuntimeReadinessReason,
 "schema-unavailable" | "vault-unavailable"
>;

export type AiRuntimeInventory = {
 storageIssue: AiRuntimeStorageIssue | null;
 activeKeys: readonly UserApiKey[];
 credentials: readonly UserApiKeyCredential[];
};

export type ResolvedUserAiRuntime = {
 keyId: string;
 provider: ApiKeyProvider;
 providerLabel: string;
 label: string;
 maskedKey: string;
 model: string;
 priority: number;
 apiKey: string;
 capabilities: readonly AiRuntimeCapability[];
};

export type UserAiRuntimeResolution =
 | {
    ok: true;
    runtime: ResolvedUserAiRuntime;
   }
 | {
    ok: false;
    status: "missing-key" | "storage-unavailable";
    reason: AiRuntimeReadinessReason;
   };

function capabilitiesForProvider(provider: ApiKeyProvider): readonly AiRuntimeCapability[] {
 if (provider === "gemini") return [...generationCapabilities, "semantic-memory"];
 return generationCapabilities;
}

function supportsCapability(provider: ApiKeyProvider, capability: AiRuntimeCapability) {
 return capabilitiesForProvider(provider).includes(capability);
}

function resolvedModel(credential: UserApiKeyCredential) {
 return credential.defaultModel?.trim() || getDefaultApiKeyModel(credential.provider);
}

function safeKeyFromCredential(credential: UserApiKeyCredential): AiRuntimeSafeKey {
 return {
  keyId: credential.id,
  provider: credential.provider,
  providerLabel: getApiKeyProviderLabel(credential.provider),
  label: credential.label,
  maskedKey: credential.maskedKey,
  model: resolvedModel(credential),
  priority: credential.priority,
  lastValidatedAt: credential.lastValidatedAt,
  capabilities: [...capabilitiesForProvider(credential.provider)],
 };
}

function aggregateCapabilities(credentials: readonly UserApiKeyCredential[]) {
 const capabilities = new Set<AiRuntimeCapability>();
 for (const credential of credentials) {
  for (const capability of capabilitiesForProvider(credential.provider)) {
   capabilities.add(capability);
  }
 }
 return [...capabilities];
}

export function getAiRuntimeReadinessFromInventory(
 inventory: AiRuntimeInventory,
): AiRuntimeReadinessResponse {
 if (inventory.storageIssue !== null) {
  return aiRuntimeReadinessResponseSchema.parse({
   status: "storage-unavailable",
   reason: inventory.storageIssue,
   activeKeyCount: inventory.activeKeys.length,
   usableKeyCount: 0,
   selectedKey: null,
   capabilities: [],
  });
 }

 if (inventory.activeKeys.length === 0) {
  return aiRuntimeReadinessResponseSchema.parse({
   status: "missing-key",
   reason: "no-active-key",
   activeKeyCount: 0,
   usableKeyCount: 0,
   selectedKey: null,
   capabilities: [],
  });
 }

 if (inventory.credentials.length === 0) {
  return aiRuntimeReadinessResponseSchema.parse({
   status: "storage-unavailable",
   reason: "credential-unreadable",
   activeKeyCount: inventory.activeKeys.length,
   usableKeyCount: 0,
   selectedKey: null,
   capabilities: [],
  });
 }

 const selectedCredential = inventory.credentials[0];
 return aiRuntimeReadinessResponseSchema.parse({
  status: "ready",
  reason: "ok",
  activeKeyCount: inventory.activeKeys.length,
  usableKeyCount: inventory.credentials.length,
  selectedKey: selectedCredential ? safeKeyFromCredential(selectedCredential) : null,
  capabilities: aggregateCapabilities(inventory.credentials),
 });
}

export function resolveAiRuntimeFromInventory(input: {
 inventory: AiRuntimeInventory;
 capability: AiRuntimeCapability;
 apiKeyId?: string;
}): UserAiRuntimeResolution {
 const readiness = getAiRuntimeReadinessFromInventory(input.inventory);
 if (readiness.status !== "ready") {
  return {
   ok: false,
   status: readiness.status,
   reason: readiness.reason,
  };
 }

 if (input.apiKeyId) {
  const activeKey = input.inventory.activeKeys.find((key) => key.id === input.apiKeyId);
  if (!activeKey) {
   return {
    ok: false,
    status: "missing-key",
    reason: "selected-key-unavailable",
   };
  }

  const credential = input.inventory.credentials.find((key) => key.id === input.apiKeyId);
  if (!credential) {
   return {
    ok: false,
    status: "storage-unavailable",
    reason: "credential-unreadable",
   };
  }

  if (!supportsCapability(credential.provider, input.capability)) {
   return {
    ok: false,
    status: "missing-key",
    reason: "capability-unavailable",
   };
  }

  return {
   ok: true,
   runtime: {
    ...safeKeyFromCredential(credential),
    apiKey: credential.apiKey,
   },
  };
 }

 const credential = input.inventory.credentials.find((key) =>
  supportsCapability(key.provider, input.capability),
 );
 if (!credential) {
  return {
   ok: false,
   status: "missing-key",
   reason: "capability-unavailable",
  };
 }

 return {
  ok: true,
  runtime: {
   ...safeKeyFromCredential(credential),
   apiKey: credential.apiKey,
  },
 };
}

async function loadUserAiRuntimeInventory(
 supabase: AuthenticatedRouteContext["supabase"],
 userId: string,
): Promise<AiRuntimeInventory> {
 const schemaStatus = await getUserApiKeysSchemaStatus(supabase, userId);
 if (!schemaStatus.ready) {
  return {
   storageIssue: "schema-unavailable",
   activeKeys: [],
   credentials: [],
  };
 }

 if (!isByokEncryptionConfigured()) {
  return {
   storageIssue: "vault-unavailable",
   activeKeys: [],
   credentials: [],
  };
 }

 const keys = await listUserApiKeys(supabase, userId);
 const activeKeys = keys.filter((key) => key.isActive);
 if (activeKeys.length === 0) {
  return {
   storageIssue: null,
   activeKeys,
   credentials: [],
  };
 }

 const credentials = await getActiveUserApiKeyCredentials(supabase, userId);
 return {
  storageIssue: null,
  activeKeys,
  credentials,
 };
}

export async function getUserAiRuntimeReadiness(
 supabase: AuthenticatedRouteContext["supabase"],
 userId: string,
) {
 const inventory = await loadUserAiRuntimeInventory(supabase, userId);
 return getAiRuntimeReadinessFromInventory(inventory);
}

export async function resolveUserAiRuntime(input: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 capability: AiRuntimeCapability;
 apiKeyId?: string;
}): Promise<UserAiRuntimeResolution> {
 const inventory = await loadUserAiRuntimeInventory(input.supabase, input.userId);
 return resolveAiRuntimeFromInventory({
  inventory,
  capability: input.capability,
  ...(input.apiKeyId ? { apiKeyId: input.apiKeyId } : {}),
 });
}

export function classifyAiRuntimeOperationFailure(input: {
 status?: number;
 message?: string;
 errorName?: string;
}): AiRuntimeOperationErrorCode {
 const message = input.message?.toLowerCase() ?? "";
 const errorName = input.errorName?.toLowerCase() ?? "";

 if (errorName === "aborterror" || message.includes("aborted") || message.includes("cancelled")) {
  return "cancelled";
 }
 if (input.status === 401 || input.status === 403) return "invalid-key";
 if (
  input.status === 402 ||
  input.status === 429 ||
  message.includes("quota") ||
  message.includes("rate limit") ||
  message.includes("insufficient balance") ||
  message.includes("insufficient_quota")
 ) {
  return "quota-exhausted";
 }
 if (
  errorName === "timeouterror" ||
  message.includes("timeout") ||
  message.includes("network") ||
  message.includes("fetch failed") ||
  message.includes("econnreset")
 ) {
  return "network-error";
 }
 if (
  message.includes("invalid response") ||
  message.includes("invalid-response") ||
  message.includes("json") ||
  message.includes("schema")
 ) {
  return "invalid-response";
 }
 return "provider-unavailable";
}
