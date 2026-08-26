import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import type { AiTaskId, AiTaskResolutionSource } from "@/lib/ai-task-contract";
import {
 resolveUserAiTaskRuntime,
 type ResolvedUserAiRuntime,
} from "@/services/ai-runtime.service";
import {
 getActiveUserApiKeyCredentials,
 type UserApiKeyCredential,
} from "@/services/user-api-keys.service";

export type ResolvedAiCredentialRuntime =
 | {
    ok: true;
    runtime: ResolvedUserAiRuntime & {
     taskId: AiTaskId;
     resolutionSource: AiTaskResolutionSource;
    };
    credential: UserApiKeyCredential;
   }
 | {
    ok: false;
    status: "missing-key" | "storage-unavailable" | "task-disabled";
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
 taskId: AiTaskId;
}): Promise<ResolvedAiCredentialRuntime> {
 const resolution = await resolveUserAiTaskRuntime({
  supabase: input.supabase,
  userId: input.userId,
  taskId: input.taskId,
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
  credential: { ...credential, defaultModel: resolution.runtime.model },
 };
}

export function resolveAiAnalysisRuntime(input: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 taskId: Extract<AiTaskId, "lookup.quick" | "lookup.deep">;
}) {
 return resolveAiCredentialRuntime(input);
}
