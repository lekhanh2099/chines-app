import "server-only";

import { z } from "zod";

import type { AiRuntimeOperationErrorCode } from "@/lib/ai-runtime-contract";
import { createRequestSignal, throwIfAborted } from "@/lib/request-utils";
import {
 classifyAiRuntimeOperationFailure,
 type ResolvedUserAiRuntime,
} from "@/services/ai-runtime.service";

import type { AiConversationMessage } from "./ai-conversation.schemas";

const openAiCompatibleChunkSchema = z.object({
 choices: z
  .array(
   z.object({
    delta: z
     .object({
      content: z.string().nullable().optional(),
     })
     .optional(),
   }),
  )
  .optional(),
});

const geminiChunkSchema = z.object({
 candidates: z
  .array(
   z.object({
    content: z
     .object({
      parts: z.array(z.object({ text: z.string().optional() })).optional(),
     })
     .optional(),
   }),
  )
  .optional(),
});

function safeProviderMessage(provider: string, code: AiRuntimeOperationErrorCode) {
 switch (code) {
  case "invalid-key":
   return `${provider} từ chối API key đang chọn.`;
  case "quota-exhausted":
   return `${provider} đang hết quota hoặc bị giới hạn tần suất.`;
  case "network-error":
   return `Không kết nối ổn định tới ${provider}.`;
  case "invalid-response":
   return `${provider} trả stream không hợp lệ.`;
  case "cancelled":
   return `Yêu cầu tới ${provider} đã bị hủy.`;
  case "provider-unavailable":
   return `${provider} hiện không khả dụng.`;
 }
}

function providerStatus(code: AiRuntimeOperationErrorCode) {
 switch (code) {
  case "invalid-key":
   return 401;
  case "quota-exhausted":
   return 429;
  case "invalid-response":
   return 502;
  case "cancelled":
   return 499;
  case "network-error":
  case "provider-unavailable":
   return 503;
 }
}

export class AiConversationProviderStreamError extends Error {
 readonly code: AiRuntimeOperationErrorCode;
 readonly status: number;

 constructor(provider: string, code: AiRuntimeOperationErrorCode) {
  super(safeProviderMessage(provider, code));
  this.name = "AiConversationProviderStreamError";
  this.code = code;
  this.status = providerStatus(code);
 }
}

function providerError(input: {
 runtime: ResolvedUserAiRuntime;
 status?: number;
 message?: string;
 errorName?: string;
}) {
 const code = classifyAiRuntimeOperationFailure({
  ...(input.status === undefined ? {} : { status: input.status }),
  ...(input.message === undefined ? {} : { message: input.message }),
  ...(input.errorName === undefined ? {} : { errorName: input.errorName }),
 });
 return new AiConversationProviderStreamError(input.runtime.providerLabel, code);
}

async function responseError(response: Response, runtime: ResolvedUserAiRuntime) {
 const detail = await response.text().catch(() => "");
 return providerError({
  runtime,
  status: response.status,
  message: detail.slice(0, 1_000),
 });
}

function openAiEndpoint(runtime: ResolvedUserAiRuntime) {
 if (runtime.provider === "groq") return "https://api.groq.com/openai/v1/chat/completions";
 if (runtime.provider === "deepseek") return "https://api.deepseek.com/chat/completions";
 return "https://api.openai.com/v1/chat/completions";
}

function groqReasoningOptions(runtime: ResolvedUserAiRuntime) {
 if (runtime.provider !== "groq") return {};
 if (runtime.model.startsWith("qwen/")) {
  return { reasoning_effort: "none", reasoning_format: "hidden" };
 }
 if (runtime.model.startsWith("openai/gpt-oss-")) {
  return { reasoning_effort: "low", reasoning_format: "hidden" };
 }
 return { reasoning_format: "hidden" };
}

function openAiGenerationOptions(runtime: ResolvedUserAiRuntime) {
 if (runtime.provider === "groq") {
  return {
   temperature: 0.65,
   max_completion_tokens: 4_096,
   ...groqReasoningOptions(runtime),
  };
 }
 if (runtime.provider === "openai" && runtime.model.startsWith("gpt-5")) {
  return { max_completion_tokens: 4_096 };
 }
 return { temperature: 0.65, max_tokens: 4_096 };
}

function geminiModelPath(model: string) {
 return model.startsWith("models/") ? model : `models/${model}`;
}

async function* readSseData(response: Response, signal?: AbortSignal) {
 if (response.body === null) throw new Error("provider stream body missing");
 const reader = response.body.getReader();
 const decoder = new TextDecoder();
 let buffer = "";

 try {
  while (true) {
   throwIfAborted(signal);
   const result = await reader.read();
   if (result.done) break;
   buffer += decoder.decode(result.value, { stream: true }).replace(/\r\n/gu, "\n");

   let boundary = buffer.indexOf("\n\n");
   while (boundary >= 0) {
    const event = buffer.slice(0, boundary);
    buffer = buffer.slice(boundary + 2);
    for (const line of event.split("\n")) {
     if (!line.startsWith("data:")) continue;
     const data = line.slice(5).trimStart();
     if (data.length > 0) yield data;
    }
    boundary = buffer.indexOf("\n\n");
   }
  }

  buffer += decoder.decode();
  for (const line of buffer.split("\n")) {
   if (!line.startsWith("data:")) continue;
   const data = line.slice(5).trimStart();
   if (data.length > 0) yield data;
  }
 } finally {
  reader.releaseLock();
 }
}

async function requestOpenAiCompatibleStream(input: {
 runtime: ResolvedUserAiRuntime;
 messages: readonly AiConversationMessage[];
 systemPrompt: string;
 signal?: AbortSignal;
}) {
 const { runtime } = input;
 try {
  throwIfAborted(input.signal);
  const response = await fetch(openAiEndpoint(runtime), {
   method: "POST",
   headers: {
    Accept: "text/event-stream",
    Authorization: `Bearer ${runtime.apiKey}`,
    "Content-Type": "application/json",
   },
   body: JSON.stringify({
    model: runtime.model,
    messages: [
     { role: "system", content: input.systemPrompt },
     ...input.messages.map((message) => ({ role: message.role, content: message.content })),
    ],
    stream: true,
    ...openAiGenerationOptions(runtime),
   }),
   cache: "no-store",
   signal: createRequestSignal(120_000, input.signal),
  });
  if (!response.ok) throw await responseError(response, runtime);

  return response;
 } catch (error) {
  if (error instanceof AiConversationProviderStreamError) throw error;
  throw providerError({
   runtime,
   message: error instanceof Error ? error.message : "provider stream failed",
   ...(error instanceof Error ? { errorName: error.name } : {}),
  });
 }
}

async function requestGeminiStream(input: {
 runtime: ResolvedUserAiRuntime;
 messages: readonly AiConversationMessage[];
 systemPrompt: string;
 signal?: AbortSignal;
}) {
 const { runtime } = input;
 try {
  throwIfAborted(input.signal);
  const response = await fetch(
   `https://generativelanguage.googleapis.com/v1beta/${geminiModelPath(runtime.model)}:streamGenerateContent?alt=sse&key=${runtime.apiKey}`,
   {
    method: "POST",
    headers: { Accept: "text/event-stream", "Content-Type": "application/json" },
    body: JSON.stringify({
     systemInstruction: { parts: [{ text: input.systemPrompt }] },
     contents: input.messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
     })),
     generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 4_096,
     },
    }),
    cache: "no-store",
    signal: createRequestSignal(120_000, input.signal),
   },
  );
  if (!response.ok) throw await responseError(response, runtime);
  return response;
 } catch (error) {
  if (error instanceof AiConversationProviderStreamError) throw error;
  throw providerError({
   runtime,
   message: error instanceof Error ? error.message : "provider stream failed",
   ...(error instanceof Error ? { errorName: error.name } : {}),
  });
 }
}

export async function* streamAiConversationProviderReply(input: {
 runtime: ResolvedUserAiRuntime;
 messages: readonly AiConversationMessage[];
 systemPrompt: string;
 signal?: AbortSignal;
}) {
 const response =
  input.runtime.provider === "gemini"
   ? await requestGeminiStream(input)
   : await requestOpenAiCompatibleStream(input);

 try {
  for await (const data of readSseData(response, input.signal)) {
   throwIfAborted(input.signal);
   if (data === "[DONE]") break;

   let parsedJson: object;
   try {
    const value = JSON.parse(data);
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
     throw new Error("stream event is not an object");
    }
    parsedJson = value;
   } catch {
    throw new AiConversationProviderStreamError(input.runtime.providerLabel, "invalid-response");
   }

   if (input.runtime.provider === "gemini") {
    const parsed = geminiChunkSchema.safeParse(parsedJson);
    if (!parsed.success) {
     throw new AiConversationProviderStreamError(input.runtime.providerLabel, "invalid-response");
    }
    const text =
     parsed.data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("") ?? "";
    if (text.length > 0) yield text;
    continue;
   }

   const parsed = openAiCompatibleChunkSchema.safeParse(parsedJson);
   if (!parsed.success) {
    throw new AiConversationProviderStreamError(input.runtime.providerLabel, "invalid-response");
   }
   const text = parsed.data.choices?.[0]?.delta?.content ?? "";
   if (text.length > 0) yield text;
  }
 } catch (error) {
  if (error instanceof AiConversationProviderStreamError) throw error;
  throw providerError({
   runtime: input.runtime,
   message: error instanceof Error ? error.message : "provider stream failed",
   ...(error instanceof Error ? { errorName: error.name } : {}),
  });
 }
}
