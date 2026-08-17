import { z } from "zod";

import {
 checkPersonalConversationRuntime,
 checkSystemConversationRuntime,
} from "@/features/hanzihome/ai-conversation/ai-conversation-health.server";
import { privateNoStoreJson, requireAuthenticatedRoute } from "@/lib/api/authenticated-route";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const healthQuerySchema = z.object({
 apiKeyId: z.uuid().optional(),
});

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const url = new URL(request.url);
 const parsedQuery = healthQuerySchema.safeParse({
  apiKeyId: url.searchParams.get("apiKeyId") || undefined,
 });
 if (!parsedQuery.success) {
  return privateNoStoreJson({
   ready: false,
   code: "key-unavailable",
   provider: null,
   model: null,
   source: null,
  });
 }

 const credentials = await getActiveUserApiKeyCredentials(
  auth.context.supabase,
  auth.context.user.id,
 );
 const selectedCredential = parsedQuery.data.apiKeyId
  ? credentials.find((credential) => credential.id === parsedQuery.data.apiKeyId)
  : credentials[0];

 if (parsedQuery.data.apiKeyId && !selectedCredential) {
  return privateNoStoreJson({
   ready: false,
   code: "key-unavailable",
   provider: null,
   model: null,
   source: "personal",
  });
 }

 const health = selectedCredential
  ? await checkPersonalConversationRuntime(selectedCredential, request.signal)
  : await checkSystemConversationRuntime(request.signal);

 return privateNoStoreJson(health);
}
