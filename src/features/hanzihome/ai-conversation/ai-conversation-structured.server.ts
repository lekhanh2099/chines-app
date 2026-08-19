import "server-only";

import { z } from "zod";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { resolveUserAiRuntime } from "@/services/ai-runtime.service";

import {
 AiConversationProviderStreamError,
 streamAiConversationProviderReply,
} from "./ai-conversation-stream-provider.server";

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

function runtimeResolutionError(input: {
 status: "missing-key" | "storage-unavailable";
 reason: string;
}) {
 if (input.status === "missing-key") {
  return input.reason === "capability-unavailable"
   ? "No active personal API key supports structured memory tasks."
   : "No active personal API key is available for structured memory tasks.";
 }
 return "The secure personal API-key runtime is unavailable for structured memory tasks.";
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

 const resolution = await resolveUserAiRuntime({
  supabase,
  userId,
  capability: "structured-memory",
 });
 if (!resolution.ok) {
  return {
   data: null,
   error: runtimeResolutionError(resolution),
  };
 }

 let raw = "";
 try {
  for await (const delta of streamAiConversationProviderReply({
   runtime: resolution.runtime,
   messages: [{ role: "user", content: normalizedPrompt }],
   systemPrompt,
   signal,
  })) {
   raw += delta;
  }
 } catch (error) {
  return {
   data: null,
   error:
    error instanceof AiConversationProviderStreamError
     ? error.message
     : "AI structured request failed before a valid response was available.",
  };
 }

 const parsed = parseStructuredContent(raw, schema);
 return parsed
  ? { data: parsed, error: null }
  : {
     data: null,
     error: `${resolution.runtime.providerLabel} returned structured data outside the schema.`,
    };
}
