import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import {
 resolveUserAiRuntime,
 type ResolvedUserAiRuntime,
} from "@/services/ai-runtime.service";
import {
 getActiveUserApiKeyCredentials,
 type UserApiKeyCredential,
} from "@/services/user-api-keys.service";

export type ResolvedAiAnalysisRuntime =
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
 * Compatibility bridge while the existing structured-analysis service still
 * consumes the full credential record. Runtime selection remains authoritative
 * in ai-runtime.service; this lookup only recovers that exact selected record.
 */
export async function resolveAiAnalysisRuntime(input: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
}): Promise<ResolvedAiAnalysisRuntime> {
 const resolution = await resolveUserAiRuntime({
  supabase: input.supabase,
  userId: input.userId,
  capability: "lookup",
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
