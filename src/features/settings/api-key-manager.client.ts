import type { JsonFieldValue } from "@/types/json";
import { z } from "zod";

import {
 addApiKeyResponseSchema,
 apiKeysResponseSchema,
 deleteApiKeyResponseSchema,
 moveApiKeyResponseSchema,
 updateApiKeyResponseSchema,
} from "./api-key-manager.schema";
import { ApiKeyProviderSchema } from "@/lib/api-key-providers";

const endpoint = "/api/settings/api-keys";
type ApiKeyProviderInput = z.infer<z.ZodUnion<[typeof ApiKeyProviderSchema, z.ZodLiteral<"auto">]>>;
export const ApiKeyMoveDirectionSchema = z.enum(["up", "down"]);

async function requestApiKeys<T>(schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
 const response = await fetch(endpoint, {
  credentials: "include",
  ...init,
  headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
 });
 const payload: JsonFieldValue = await response.json().catch(() => null);

 if (!response.ok) {
  const message =
   payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : "Yêu cầu API key thất bại.";
  throw new Error(message);
 }

 const parsed = schema.safeParse(payload);
 if (!parsed.success) throw new Error("Phản hồi API key không đúng định dạng.");
 return parsed.data;
}

export function fetchManagedApiKeys() {
 return requestApiKeys(apiKeysResponseSchema);
}

export function addManagedApiKey(input: {
 apiKey: string;
 label?: string;
 provider: ApiKeyProviderInput;
 model?: string;
}) {
 return requestApiKeys(addApiKeyResponseSchema, {
  method: "POST",
  body: JSON.stringify(input),
 });
}

export function updateManagedApiKeyModel(input: { keyId: string; model: string }) {
 return requestApiKeys(updateApiKeyResponseSchema, {
  method: "PATCH",
  body: JSON.stringify({ action: "model", ...input }),
 });
}

export function toggleManagedApiKey(input: { keyId: string; isActive: boolean }) {
 return requestApiKeys(updateApiKeyResponseSchema, {
  method: "PATCH",
  body: JSON.stringify({ action: "toggle", ...input }),
 });
}

export function moveManagedApiKey(input: {
 keyId: string;
 direction: z.infer<typeof ApiKeyMoveDirectionSchema>;
}) {
 return requestApiKeys(moveApiKeyResponseSchema, {
  method: "PATCH",
  body: JSON.stringify({ action: "move", ...input }),
 });
}

export function deleteManagedApiKey(keyId: string) {
 return requestApiKeys(deleteApiKeyResponseSchema, {
  method: "DELETE",
  body: JSON.stringify({ keyId }),
 });
}
