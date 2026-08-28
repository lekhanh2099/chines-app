import type { JsonFieldValue } from "@/types/json";

import { aiConversationTurnRequestSchema } from "./ai-conversation-session.schemas";
import {
 aiConversationStreamEventSchema,
 type AiConversationStreamStartEvent,
} from "./ai-conversation-stream.schemas";
import type { AiConversationTurnResponse } from "./ai-conversation-session.schemas";

const endpoint = "/api/ai/conversation/stream";

function readApiError(body: JsonFieldValue, fallback: string) {
 const error =
  body && typeof body === "object" && !Array.isArray(body) && "error" in body ? body.error : null;
 return typeof error === "string" ? error : fallback;
}

export class AiConversationStreamRequestError extends Error {
 readonly code: string;

 constructor(code: string, message: string) {
  super(message);
  this.name = "AiConversationStreamRequestError";
  this.code = code;
 }
}

export async function streamPersistedAiConversationMessage(
 conversationId: string,
 input: {
  clientMessageId: string;
  content: string;
  apiKeyId?: string;
  model?: string;
 },
 options?: {
  signal?: AbortSignal;
  onStart?: (event: AiConversationStreamStartEvent) => void;
  onDelta?: (text: string) => void;
 },
): Promise<AiConversationTurnResponse> {
 const payload = aiConversationTurnRequestSchema.parse({
  clientMessageId: input.clientMessageId,
  content: input.content,
  ...(input.apiKeyId ? { apiKeyId: input.apiKeyId } : {}),
  ...(input.model ? { model: input.model } : {}),
 });
 const response = await fetch(endpoint, {
  method: "POST",
  headers: {
   "Content-Type": "application/json",
   Accept: "application/x-ndjson",
  },
  credentials: "include",
  cache: "no-store",
  body: JSON.stringify({ conversationId, ...payload }),
  signal: options?.signal,
 });

 if (!response.ok) {
  const body: JsonFieldValue = await response.json().catch(() => null);
  throw new AiConversationStreamRequestError(
   "AI_STREAM_REQUEST_FAILED",
   readApiError(body, "AI conversation không thể bắt đầu stream."),
  );
 }
 if (response.body === null) {
  throw new AiConversationStreamRequestError(
   "AI_STREAM_MISSING_BODY",
   "AI conversation không trả về stream dữ liệu.",
  );
 }

 const reader = response.body.getReader();
 const decoder = new TextDecoder();
 let buffer = "";
 let finalTurn: AiConversationTurnResponse | null = null;

 const consumeLine = (line: string) => {
  if (line.trim().length === 0) return;
  let parsedJson: object;
  try {
   const value = JSON.parse(line);
   if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("stream event is not an object");
   }
   parsedJson = value;
  } catch {
   throw new AiConversationStreamRequestError(
    "AI_STREAM_INVALID_EVENT",
    "AI conversation trả về stream không hợp lệ.",
   );
  }

  const parsed = aiConversationStreamEventSchema.safeParse(parsedJson);
  if (!parsed.success) {
   throw new AiConversationStreamRequestError(
    "AI_STREAM_INVALID_EVENT",
    "AI conversation trả về event không đúng contract.",
   );
  }

  switch (parsed.data.type) {
   case "start":
    options?.onStart?.(parsed.data);
    return;
   case "delta":
    options?.onDelta?.(parsed.data.text);
    return;
   case "heartbeat":
    return;
   case "error":
    throw new AiConversationStreamRequestError(parsed.data.code, parsed.data.message);
   case "final":
    finalTurn = parsed.data.turn;
  }
 };

 try {
  while (true) {
   const result = await reader.read();
   if (result.done) break;
   buffer += decoder.decode(result.value, { stream: true });
   const lines = buffer.split("\n");
   buffer = lines.pop() ?? "";
   for (const line of lines) consumeLine(line);
  }
  buffer += decoder.decode();
  consumeLine(buffer);
 } finally {
  reader.releaseLock();
 }

 if (finalTurn !== null) return finalTurn;
 if (options?.signal?.aborted)
  throw new DOMException("AI conversation stream aborted", "AbortError");
 throw new AiConversationStreamRequestError(
  "AI_STREAM_INCOMPLETE",
  "AI conversation kết thúc trước khi lưu xong câu trả lời.",
 );
}
