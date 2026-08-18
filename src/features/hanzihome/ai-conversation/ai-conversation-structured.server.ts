import "server-only";

import { z } from "zod";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { generateAiConversationReply } from "@/services/ai.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";

import { generateSystemAiConversationReply } from "./ai-conversation-system.server";

function parseStructuredContent<T>(raw: string, schema: z.ZodType<T>): T | null {
 try {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
   cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  const jsonValue = z.json().parse(JSON.parse(cleaned));
  const parsed = schema.safeParse(jsonValue);
  return parsed.success ? parsed.data : null;
 } catch {
  return null;
 }
}

export async function generateStructuredAiConversationData<T>({
 supabase,
 userId,
 systemPrompt,
 prompt,
 schema,
 signal,
}: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 systemPrompt: string;
 prompt: string;
 schema: z.ZodType<T>;
 signal?: AbortSignal;
}): Promise<{ data: T | null; error: string | null }> {
 const credentials = await getActiveUserApiKeyCredentials(supabase, userId);
 const selectedCredential = credentials[0];
 const result = selectedCredential
  ? await generateAiConversationReply(
     [{ role: "user", content: prompt }],
     {
      userApiKeys: [selectedCredential],
      abortSignal: signal,
      systemContext: systemPrompt,
     },
    )
  : await generateSystemAiConversationReply(
     [{ role: "user", content: prompt }],
     signal,
     systemPrompt,
    );

 if (!result.data) return { data: null, error: result.error || "AI structured request failed." };

 const parsed = parseStructuredContent(result.data, schema);
 return parsed
  ? { data: parsed, error: null }
  : { data: null, error: "AI structured response did not match the required schema." };
}
