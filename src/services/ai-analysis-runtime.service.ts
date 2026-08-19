import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import type { AiRuntimeCapability } from "@/lib/ai-runtime-contract";
import {
 resolveUserAiRuntime,
 type ResolvedUserAiRuntime,
} from "@/services/ai-runtime.service";
import {
 getActiveUserApiKeyCredentials,
 type UserApiKeyCredential,
} from "@/services/user-api-keys.service";

export type ResolvedAiCredentialRuntime =
 | {
    ok: true;
    runtime: ResolvedUserAiRuntime;
    credential: UserApiKeyCredential;
   }
 | {
    ok: false;
    status: "missing-key" | "storage-unavailable";
    reason: string;
   };

/**
 * Compatibility bridge while a few legacy provider adapters still consume the
 * full credential record. ai-runtime.service remains the selection authority;
 * this lookup only recovers that exact selected record after capability checks.
 */
export async function resolveAiCredentialRuntime(input: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 capability: AiRuntimeCapability;
 apiKeyId?: string;
}): Promise<ResolvedAiCredentialRuntime> {
 const resolution = await resolveUserAiRuntime({
  supabase: input.supabase,
  userId: input.userId,
  capability: input.capability,
  ...(input.apiKeyId ? { apiKeyId: input.apiKeyId } : {}),
 });
 if (!resolution.ok) return resolution;

 const credentials = await getActiveUserApiKeyCredentials(input.supabase, input.userId);
 const credential = credentials.find((item) => item.id === resolution.runtime.keyId);
 if (!credential) {
  return {
   ok: false,
   status: "storage-unavailable",
   reason: "credential-unreadable",
  };
 }

 return {
  ok: true,
  runtime: resolution.runtime,
  credential,
 };
}

export function resolveAiAnalysisRuntime(input: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
}) {
 return resolveAiCredentialRuntime({ ...input, capability: "lookup" });
}
