import "server-only";

import { z } from "zod";

import { publicSupabaseEnv } from "@/lib/env/public";
import { getSupabaseServerSecret } from "@/lib/env/server";
import type { JsonObject } from "@/types/json";

import { postgrestErrorSchema } from "./ai-conversation-persistence-schemas.server";

export class AiConversationPersistenceNotReadyError extends Error {
 constructor() {
  super("AI conversation persistence schema is not ready");
  this.name = "AiConversationPersistenceNotReadyError";
 }
}

export class AiConversationPersistenceConfigurationError extends Error {
 constructor() {
  super("AI conversation persistence server secret is not configured");
  this.name = "AiConversationPersistenceConfigurationError";
 }
}

export class AiConversationPersistenceRequestError extends Error {
 readonly status: number;
 readonly code: string | null;

 constructor(status: number, code: string | null, message: string) {
  super(message);
  this.name = "AiConversationPersistenceRequestError";
  this.status = status;
  this.code = code;
 }
}

function buildRestUrl(resource: string, params?: Readonly<Record<string, string>>) {
 const url = new URL(`${publicSupabaseEnv.url}/rest/v1/${resource}`);
 for (const [key, value] of Object.entries(params ?? {})) {
  url.searchParams.set(key, value);
 }
 return url;
}

function buildServiceHeaders(secret: string, body: boolean, prefer?: string) {
 const isModernSecret = secret.startsWith("sb_secret_");
 return {
  Accept: "application/json",
  apikey: secret,
  ...(!isModernSecret ? { Authorization: `Bearer ${secret}` } : {}),
  ...(body ? { "Content-Type": "application/json" } : {}),
  ...(prefer ? { Prefer: prefer } : {}),
 };
}

function getPersistenceServerSecret() {
 try {
  return getSupabaseServerSecret();
 } catch {
  throw new AiConversationPersistenceConfigurationError();
 }
}

function isMissingPersistenceSchema(code: string | null, message: string) {
 if (code === "42P01" || code === "PGRST202" || code === "PGRST205") return true;

 const normalizedMessage = message.toLowerCase();
 return (
  normalizedMessage.includes("could not find the table 'public.ai_") ||
  normalizedMessage.includes('could not find the table "public.ai_') ||
  (normalizedMessage.includes('relation "public.ai_') &&
   normalizedMessage.includes("does not exist")) ||
  normalizedMessage.includes("could not find the function public.ai_append_message") ||
  normalizedMessage.includes("could not find the function ai_append_message")
 );
}

export async function requestPostgrest<T>({
 resource,
 schema,
 params,
 method = "GET",
 body,
 prefer,
}: {
 resource: string;
 schema: z.ZodType<T>;
 params?: Readonly<Record<string, string>>;
 method?: "GET" | "POST" | "PATCH";
 body?: JsonObject;
 prefer?: string;
}): Promise<T> {
 const secret = getPersistenceServerSecret();
 const response = await fetch(buildRestUrl(resource, params), {
  method,
  headers: buildServiceHeaders(secret, Boolean(body), prefer),
  ...(body ? { body: JSON.stringify(body) } : {}),
  cache: "no-store",
 });
 const payload: unknown = await response.json().catch(() => null);

 if (!response.ok) {
  const parsedError = postgrestErrorSchema.safeParse(payload);
  const code = parsedError.success ? (parsedError.data.code ?? null) : null;
  const message =
   parsedError.success && parsedError.data.message
    ? parsedError.data.message
    : "AI conversation persistence request failed";

  if (isMissingPersistenceSchema(code, message)) {
   throw new AiConversationPersistenceNotReadyError();
  }

  throw new AiConversationPersistenceRequestError(response.status, code, message);
 }

 return schema.parse(payload);
}
