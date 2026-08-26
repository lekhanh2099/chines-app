import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { getDefaultApiKeyModel, isApiKeyModelSupported } from "@/lib/api-key-models";
import { getApiKeyProviderLabel, type ApiKeyProvider } from "@/lib/api-key-providers";
import {
 aiRuntimeReadinessResponseSchema,
 type AiRuntimeCapability,
 type AiRuntimeOperationErrorCode,
 type AiRuntimeReadinessReason,
 type AiRuntimeReadinessResponse,
 type AiRuntimeSafeKey,
} from "@/lib/ai-runtime-contract";
import {
 getAiTaskDefinition,
 type AiRuntimeReceipt,
 type AiTaskAssignment,
 type AiTaskId,
 type AiTaskResolutionSource,
 type AiTaskSessionOverride,
} from "@/lib/ai-task-contract";
import { isByokEncryptionConfigured } from "@/lib/encryption";
import {
 getActiveUserApiKeyCredentials,
 getUserApiKeysSchemaStatus,
 listUserApiKeys,
 type UserApiKey,
 type UserApiKeyCredential,
} from "@/services/user-api-keys.service";
import { getUserAiTaskAssignment } from "@/services/ai-task-routing.service";
import {
 recordUserAiActivityEvent,
 type CreateAiActivityEvent,
} from "@/services/ai-task-routing.service";

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
 taskId?: AiTaskId;
 resolutionSource?: AiTaskResolutionSource;
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

export type UserAiTaskRuntimeResolution =
 | {
    ok: true;
    runtime: ResolvedUserAiRuntime & {
     taskId: AiTaskId;
     resolutionSource: AiTaskResolutionSource;
    };
   }
 | {
    ok: false;
    status: "missing-key" | "storage-unavailable" | "task-disabled";
    reason: AiRuntimeReadinessReason;
   };

export function getAiRuntimeCapabilitiesForProvider(
 provider: ApiKeyProvider,
): readonly AiRuntimeCapability[] {
 if (provider === "gemini") return [...generationCapabilities, "semantic-memory"];
 return generationCapabilities;
}

function supportsCapability(provider: ApiKeyProvider, capability: AiRuntimeCapability) {
 return getAiRuntimeCapabilitiesForProvider(provider).includes(capability);
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
  capabilities: [...getAiRuntimeCapabilitiesForProvider(credential.provider)],
 };
}

function runtimeFromCredential(input: {
 credential: UserApiKeyCredential;
 taskId?: AiTaskId;
 resolutionSource?: AiTaskResolutionSource;
 model?: string;
}): ResolvedUserAiRuntime {
 return {
  ...safeKeyFromCredential(input.credential),
  ...(input.taskId ? { taskId: input.taskId } : {}),
  ...(input.resolutionSource ? { resolutionSource: input.resolutionSource } : {}),
  model: input.model ?? resolvedModel(input.credential),
  apiKey: input.credential.apiKey,
 };
}

function supportsModel(credential: UserApiKeyCredential, model: string) {
 return (
  isApiKeyModelSupported(credential.provider, model) || credential.defaultModel?.trim() === model
 );
}

function aggregateCapabilities(credentials: readonly UserApiKeyCredential[]) {
 const capabilities = new Set<AiRuntimeCapability>();
 for (const credential of credentials) {
  for (const capability of getAiRuntimeCapabilitiesForProvider(credential.provider)) {
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
    ...runtimeFromCredential({
     credential,
    }),
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
   ...runtimeFromCredential({
    credential,
   }),
  },
 };
}

export function resolveAiTaskRuntimeFromInventory(input: {
 inventory: AiRuntimeInventory;
 taskId: AiTaskId;
 assignment?: AiTaskAssignment;
 sessionOverride?: AiTaskSessionOverride;
}): UserAiTaskRuntimeResolution {
 const task = getAiTaskDefinition(input.taskId);
 if (input.assignment && input.assignment.taskId !== input.taskId) {
  throw new Error(`AI task assignment mismatch for ${input.taskId}`);
 }

 if (input.assignment?.mode === "disabled") {
  return {
   ok: false,
   status: "task-disabled",
   reason: "task-disabled",
  };
 }

 const readiness = getAiRuntimeReadinessFromInventory(input.inventory);
 if (readiness.status !== "ready") {
  return {
   ok: false,
   status: readiness.status,
   reason: readiness.reason,
  };
 }

 const exactSelection =
  input.sessionOverride ?? (input.assignment?.mode === "assigned" ? input.assignment : null);
 if (exactSelection) {
  const activeKey = input.inventory.activeKeys.find((key) => key.id === exactSelection.keyId);
  const reason = input.sessionOverride ? "selected-key-unavailable" : "assigned-key-unavailable";
  if (!activeKey) return { ok: false, status: "missing-key", reason };

  const credential = input.inventory.credentials.find((key) => key.id === exactSelection.keyId);
  if (!credential) {
   return { ok: false, status: "storage-unavailable", reason: "credential-unreadable" };
  }
  if (!supportsCapability(credential.provider, task.capability)) {
   return { ok: false, status: "missing-key", reason: "capability-unavailable" };
  }
  if (!supportsModel(credential, exactSelection.model)) {
   return { ok: false, status: "missing-key", reason: "assigned-model-unavailable" };
  }

  return {
   ok: true,
   runtime: {
    ...runtimeFromCredential({ credential, model: exactSelection.model }),
    taskId: input.taskId,
    resolutionSource: input.sessionOverride ? "session-override" : "assigned",
   },
  };
 }

 const credential = input.inventory.credentials.find((key) =>
  supportsCapability(key.provider, task.capability),
 );
 if (!credential) {
  return { ok: false, status: "missing-key", reason: "capability-unavailable" };
 }

 return {
  ok: true,
  runtime: {
   ...runtimeFromCredential({ credential }),
   taskId: input.taskId,
   resolutionSource: "auto",
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

export async function resolveUserAiTaskRuntime(input: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 taskId: AiTaskId;
 sessionOverride?: AiTaskSessionOverride;
}): Promise<UserAiTaskRuntimeResolution> {
 const [inventory, assignment] = await Promise.all([
  loadUserAiRuntimeInventory(input.supabase, input.userId),
  getUserAiTaskAssignment(input.userId, input.taskId),
 ]);
 return resolveAiTaskRuntimeFromInventory({
  inventory,
  taskId: input.taskId,
  ...(assignment ? { assignment } : {}),
  ...(input.sessionOverride ? { sessionOverride: input.sessionOverride } : {}),
 });
}

export function getAiRuntimeReceipt(
 runtime: ResolvedUserAiRuntime & {
  taskId: AiTaskId;
  resolutionSource: AiTaskResolutionSource;
 },
): AiRuntimeReceipt {
 return {
  taskId: runtime.taskId,
  provider: runtime.provider,
  model: runtime.model,
  keyId: runtime.keyId,
  keyLabel: runtime.label,
  resolutionSource: runtime.resolutionSource,
 };
}

export async function recordUserAiRuntimeActivity(input: {
 userId: string;
 runtime: ResolvedUserAiRuntime & {
  taskId: AiTaskId;
  resolutionSource: AiTaskResolutionSource;
 };
 status: CreateAiActivityEvent["status"];
 errorCode?: string;
 latencyMs?: number;
 inputTokens?: number;
 outputTokens?: number;
 resourceType?: string;
 resourceId?: string;
}) {
 try {
  await recordUserAiActivityEvent(input.userId, {
   taskId: input.runtime.taskId,
   provider: input.runtime.provider,
   model: input.runtime.model,
   keyId: input.runtime.keyId,
   keyLabel: input.runtime.label,
   resolutionSource: input.runtime.resolutionSource,
   status: input.status,
   errorCode: input.errorCode ?? null,
   latencyMs: input.latencyMs ?? null,
   inputTokens: input.inputTokens ?? null,
   outputTokens: input.outputTokens ?? null,
   resourceType: input.resourceType ?? null,
   resourceId: input.resourceId ?? null,
  });
 } catch {
  // Activity telemetry must never change the outcome of the AI task itself.
 }
}

export async function recordUserAiTaskBlockedActivity(input: {
 userId: string;
 taskId: AiTaskId;
 errorCode: string;
 resourceType?: string;
 resourceId?: string;
}) {
 try {
  await recordUserAiActivityEvent(input.userId, {
   taskId: input.taskId,
   provider: null,
   model: null,
   keyId: null,
   keyLabel: null,
   resolutionSource: null,
   status: "blocked",
   errorCode: input.errorCode,
   latencyMs: null,
   inputTokens: null,
   outputTokens: null,
   resourceType: input.resourceType ?? null,
   resourceId: input.resourceId ?? null,
  });
 } catch {
  // Activity telemetry must never change the outcome of the AI task itself.
 }
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
  message.includes("insufficient balance") ||
  message.includes("insufficient_quota")
 ) {
  return "quota-exhausted";
 }
 if (
  input.status === 429 ||
  message.includes("rate limit") ||
  message.includes("too many requests")
 ) {
  return "provider-unavailable";
 }
 if (message.includes("quota")) return "quota-exhausted";
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
