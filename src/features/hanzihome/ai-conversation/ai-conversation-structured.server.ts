import "server-only";

import { z } from "zod";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { generateAiConversationReply } from "@/services/ai.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";

import { generateSystemAiConversationReply } from "./ai-conversation-system.server";

const MAX_STRUCTURED_PROMPT_CHARS = 6000;

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
 const normalizedPrompt = prompt.normalize("NFC").trim();
 if (!normalizedPrompt || normalizedPrompt.length > MAX_STRUCTURED_PROMPT_CHARS) {
  return { data: null, error: "AI structured request exceeded the bounded prompt contract." };
 }

 const credentials = await getActiveUserApiKeyCredentials(supabase, userId);
 const selectedCredential = credentials[0];
 const providerErrors: string[] = [];

 if (selectedCredential) {
  const personalResult = await generateAiConversationReply(
   [{ role: "user", content: normalizedPrompt }],
   {
    userApiKeys: [selectedCredential],
    abortSignal: signal,
    systemContext: systemPrompt,
   },
  );
  if (personalResult.data) {
   const parsed = parseStructuredContent(personalResult.data, schema);
   if (parsed) return { data: parsed, error: null };
   providerErrors.push(`${selectedCredential.label} returned structured data outside the schema.`);
  } else if (personalResult.error) {
   providerErrors.push(personalResult.error);
  }
 }

 const systemResult = await generateSystemAiConversationReply(
  [{ role: "user", content: normalizedPrompt }],
  signal,
  systemPrompt,
 );
 if (systemResult.data) {
  const parsed = parseStructuredContent(systemResult.data, schema);
  if (parsed) return { data: parsed, error: null };
  providerErrors.push("System Gemini returned structured data outside the schema.");
 } else if (systemResult.error) {
  providerErrors.push(systemResult.error);
 }

 return {
  data: null,
  error: providerErrors.join(" ") || "AI structured request failed.",
 };
}
