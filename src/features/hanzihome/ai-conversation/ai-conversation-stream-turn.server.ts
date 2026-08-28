import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { logger } from "@/lib/logger";
import { recordUserAiRuntimeActivity } from "@/services/ai-runtime.service";

import { sanitizeAiConversationReply } from "./ai-conversation-output";
import {
 appendAiConversationMessage,
 findAssistantReplyForUserMessage,
 loadAiConversationContextState,
 loadRecentAiConversationMessages,
} from "./ai-conversation-persistence.server";
import {
 aiConversationTurnResponseSchema,
 type AiConversationTurnResponse,
} from "./ai-conversation-session.schemas";
import { createAiConversationVisibleStreamFilter } from "./ai-conversation-stream-filter";
import {
 AiConversationProviderStreamError,
 streamAiConversationProviderReply,
} from "./ai-conversation-stream-provider.server";
import {
 aiConversationStreamEventSchema,
 type AiConversationStreamEvent,
} from "./ai-conversation-stream.schemas";
import { preparePersistedAiConversationTurn } from "./ai-conversation-turn.server";
import { dispatchAiConversationPostTurnWorkflow } from "./ai-conversation-post-turn.workflow";

const encoder = new TextEncoder();
const heartbeatMilliseconds = 10_000;
const maximumAssistantCharacters = 6_000;

export type AiConversationStreamTurnResult =
 | { ok: true; response: Response }
 | { ok: false; status: number; code: string; message: string };

function encodeEvent(event: AiConversationStreamEvent) {
 return encoder.encode(`${JSON.stringify(aiConversationStreamEventSchema.parse(event))}\n`);
}

function streamHeaders() {
 return {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "application/x-ndjson; charset=utf-8",
  "X-Accel-Buffering": "no",
 };
}

function completedTurnResponse(turn: AiConversationTurnResponse) {
 const stream = new ReadableStream<Uint8Array>({
  start(controller) {
   controller.enqueue(
    encodeEvent({
     type: "start",
     conversationId: turn.conversationId,
     userMessage: turn.userMessage,
    }),
   );
   controller.enqueue(encodeEvent({ type: "final", turn }));
   controller.close();
  },
 });
 return new Response(stream, { status: 200, headers: streamHeaders() });
}

function streamErrorCode(error: AiConversationProviderStreamError) {
 return `AI_${error.code.replaceAll("-", "_").toUpperCase()}`;
}

export async function createPersistedAiConversationTurnStream(input: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 conversationId: string;
 clientMessageId: string;
 content: string;
 apiKeyId?: string;
 model?: string;
 requestSignal: AbortSignal;
}): Promise<AiConversationStreamTurnResult> {
 const userMessage = await appendAiConversationMessage({
  userId: input.userId,
  conversationId: input.conversationId,
  role: "user",
  content: input.content,
  clientMessageId: input.clientMessageId,
 });

 const existingReply = await findAssistantReplyForUserMessage({
  userId: input.userId,
  conversationId: input.conversationId,
  userMessageId: userMessage.id,
 });
 if (existingReply) {
  await dispatchAiConversationPostTurnWorkflow({
   userId: input.userId,
   conversationId: input.conversationId,
  });
  const turn = aiConversationTurnResponseSchema.parse({
   conversationId: input.conversationId,
   userMessage,
   assistantMessage: existingReply.message,
   provider: existingReply.provider,
   model: existingReply.model,
   apiKeyId: existingReply.apiKeyId,
   runtimeReceipt: existingReply.runtimeReceipt,
   usage: null,
  });
  return { ok: true, response: completedTurnResponse(turn) };
 }

 const [contextState, recentMessages] = await Promise.all([
  loadAiConversationContextState({ userId: input.userId, conversationId: input.conversationId }),
  loadRecentAiConversationMessages({
   userId: input.userId,
   conversationId: input.conversationId,
   limit: 19,
  }),
 ]);
 const prepared = await preparePersistedAiConversationTurn({
  supabase: input.supabase,
  userId: input.userId,
  recentMessages,
  contextState,
  ...(input.apiKeyId ? { apiKeyId: input.apiKeyId } : {}),
  ...(input.model ? { model: input.model } : {}),
  signal: input.requestSignal,
 });
 if (!prepared.ok) return prepared;

 const providerController = new AbortController();
 const startedAt = performance.now();
 const abortProvider = () => providerController.abort();
 if (input.requestSignal.aborted) providerController.abort();
 else input.requestSignal.addEventListener("abort", abortProvider, { once: true });

 const stream = new ReadableStream<Uint8Array>({
  async start(controller) {
   let closed = false;
   const safeEnqueue = (event: AiConversationStreamEvent) => {
    if (closed || providerController.signal.aborted) return;
    try {
     controller.enqueue(encodeEvent(event));
    } catch {
     closed = true;
     providerController.abort();
    }
   };
   const close = () => {
    if (closed) return;
    closed = true;
    try {
     controller.close();
    } catch {
     providerController.abort();
    }
   };
   const heartbeat = setInterval(() => safeEnqueue({ type: "heartbeat" }), heartbeatMilliseconds);
   const visibleFilter = createAiConversationVisibleStreamFilter();
   let rawReply = "";
   let visibleCharacters = 0;

   try {
    safeEnqueue({
     type: "start",
     conversationId: input.conversationId,
     userMessage,
    });

    for await (const rawDelta of streamAiConversationProviderReply({
     runtime: prepared.runtime,
     messages: prepared.conversationMessages,
     systemPrompt: prepared.systemPrompt,
     signal: providerController.signal,
    })) {
     if (providerController.signal.aborted) break;
     rawReply += rawDelta;
     const visibleDelta = visibleFilter.push(rawDelta);
     if (visibleDelta.length === 0) continue;
     visibleCharacters += visibleDelta.length;
     if (visibleCharacters > maximumAssistantCharacters) {
      throw new AiConversationProviderStreamError(
       prepared.runtime.providerLabel,
       "invalid-response",
      );
     }
     safeEnqueue({ type: "delta", text: visibleDelta });
    }

    if (providerController.signal.aborted) {
     await recordUserAiRuntimeActivity({
      userId: input.userId,
      runtime: prepared.runtime,
      status: "cancelled",
      errorCode: "cancelled",
      latencyMs: Math.round(performance.now() - startedAt),
      resourceType: "conversation",
      resourceId: input.conversationId,
     });
     close();
     return;
    }

    const finalVisibleDelta = visibleFilter.flush();
    if (finalVisibleDelta.length > 0) {
     visibleCharacters += finalVisibleDelta.length;
     if (visibleCharacters > maximumAssistantCharacters) {
      throw new AiConversationProviderStreamError(
       prepared.runtime.providerLabel,
       "invalid-response",
      );
     }
     safeEnqueue({ type: "delta", text: finalVisibleDelta });
    }

    const message = sanitizeAiConversationReply(rawReply);
    if (message.length === 0 || message.length > maximumAssistantCharacters) {
     throw new AiConversationProviderStreamError(
      prepared.runtime.providerLabel,
      "invalid-response",
     );
    }

    // A Stop can race with the final provider chunk. Recheck immediately before
    // persistence so a cancelled partial reply remains presentation-only.
    if (providerController.signal.aborted) {
     await recordUserAiRuntimeActivity({
      userId: input.userId,
      runtime: prepared.runtime,
      status: "cancelled",
      errorCode: "cancelled",
      latencyMs: Math.round(performance.now() - startedAt),
      resourceType: "conversation",
      resourceId: input.conversationId,
     });
     close();
     return;
    }

    const assistantMessage = await appendAiConversationMessage({
     userId: input.userId,
     conversationId: input.conversationId,
     role: "assistant",
     content: message,
     replyToMessageId: userMessage.id,
     metadata: {
      provider: prepared.runtime.providerLabel,
      model: prepared.runtime.model,
      apiKeyId: prepared.runtime.keyId,
      taskId: prepared.runtime.taskId,
      keyLabel: prepared.runtime.label,
      resolutionSource: prepared.runtime.resolutionSource,
     },
    });
    await dispatchAiConversationPostTurnWorkflow({
     userId: input.userId,
     conversationId: input.conversationId,
    });
    const turn = aiConversationTurnResponseSchema.parse({
     conversationId: input.conversationId,
     userMessage,
     assistantMessage,
     provider: prepared.runtime.providerLabel,
     model: prepared.runtime.model,
     apiKeyId: prepared.runtime.keyId,
     runtimeReceipt: {
      taskId: prepared.runtime.taskId,
      provider: prepared.runtime.provider,
      model: prepared.runtime.model,
      keyId: prepared.runtime.keyId,
      keyLabel: prepared.runtime.label,
      resolutionSource: prepared.runtime.resolutionSource,
     },
     usage: null,
    });
    safeEnqueue({ type: "final", turn });
    await recordUserAiRuntimeActivity({
     userId: input.userId,
     runtime: prepared.runtime,
     status: "success",
     latencyMs: Math.round(performance.now() - startedAt),
     resourceType: "conversation",
     resourceId: input.conversationId,
    });
    close();
   } catch (error) {
    if (providerController.signal.aborted) {
     await recordUserAiRuntimeActivity({
      userId: input.userId,
      runtime: prepared.runtime,
      status: "cancelled",
      errorCode: "cancelled",
      latencyMs: Math.round(performance.now() - startedAt),
      resourceType: "conversation",
      resourceId: input.conversationId,
     });
     close();
     return;
    }

    if (error instanceof AiConversationProviderStreamError) {
     await recordUserAiRuntimeActivity({
      userId: input.userId,
      runtime: prepared.runtime,
      status: error.code === "cancelled" ? "cancelled" : "failure",
      errorCode: error.code,
      latencyMs: Math.round(performance.now() - startedAt),
      resourceType: "conversation",
      resourceId: input.conversationId,
     });
     safeEnqueue({ type: "error", code: streamErrorCode(error), message: error.message });
    } else {
     await recordUserAiRuntimeActivity({
      userId: input.userId,
      runtime: prepared.runtime,
      status: "failure",
      errorCode: "provider-unavailable",
      latencyMs: Math.round(performance.now() - startedAt),
      resourceType: "conversation",
      resourceId: input.conversationId,
     });
     logger.error("[AI Conversation] streamed assistant persistence failed", error);
     safeEnqueue({
      type: "error",
      code: "AI_STREAM_FAILED",
      message: "AI conversation không hoàn tất. Tin nhắn người học vẫn đã được lưu.",
     });
    }
    close();
   } finally {
    clearInterval(heartbeat);
    input.requestSignal.removeEventListener("abort", abortProvider);
   }
  },
  cancel() {
   providerController.abort();
   input.requestSignal.removeEventListener("abort", abortProvider);
  },
 });

 return { ok: true, response: new Response(stream, { status: 200, headers: streamHeaders() }) };
}
