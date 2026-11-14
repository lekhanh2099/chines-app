"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
 useEffect,
 useRef,
 useState,
 type Dispatch,
 type RefObject,
 type SetStateAction,
} from "react";
import { useTranslations } from "next-intl";

import {
 ensureAiConversationSession,
 sendPersistedAiConversationMessage,
} from "./services/ai-conversation-api";
import { AUTO_RUNTIME_KEY_ID } from "./components/AiConversationRuntimeMenu";
import type { AiConversationSession } from "./model/ai-conversation-session.schemas";
import {
 conversationSessionQueryKey,
 HISTORY_QUERY_KEY,
 type RetryTurn,
} from "./ai-conversation-workspace-utils";
import type { useAiConversationRuntime } from "./useAiConversationRuntime";
import type { useAiConversationSessionQuery } from "./useAiConversationSessionQuery";

type AiConversationRuntime = ReturnType<typeof useAiConversationRuntime>;

export function useAiConversationSend({
 sessionQuery,
 runtimeKeyId,
 runtimeModel,
 runtimeHealthQuery,
 retryTurnRef,
 setDraft,
}: {
 sessionQuery: ReturnType<typeof useAiConversationSessionQuery>["sessionQuery"];
 runtimeKeyId: AiConversationRuntime["runtimeKeyId"];
 runtimeModel: AiConversationRuntime["runtimeModel"];
 runtimeHealthQuery: AiConversationRuntime["runtimeHealthQuery"];
 retryTurnRef: RefObject<RetryTurn | null>;
 setDraft: Dispatch<SetStateAction<string>>;
}) {
 const t = useTranslations("AiConversation");
 const queryClient = useQueryClient();
 const [streamContent, setStreamContent] = useState("");
 const [streamStop, setStreamStop] = useState<(() => void) | null>(null);
 const requestRef = useRef<AbortController | null>(null);

 const sendMutation = useMutation({
  retry: false,
  mutationFn: async ({
   content,
   clientMessageId,
   controller,
  }: {
   content: string;
   clientMessageId: string;
   controller: AbortController;
  }) => {
   const session = sessionQuery.data?.conversation
    ? sessionQuery.data
    : await ensureAiConversationSession({ signal: controller.signal });
   const conversation = session.conversation;
   if (!conversation) throw new Error(t("message.sendError"));

   const turn = await sendPersistedAiConversationMessage(
    conversation.id,
    {
     clientMessageId,
     content,
     ...(runtimeKeyId !== AUTO_RUNTIME_KEY_ID ? { apiKeyId: runtimeKeyId } : {}),
     ...(runtimeKeyId !== AUTO_RUNTIME_KEY_ID && runtimeModel ? { model: runtimeModel } : {}),
    },
    {
     signal: controller.signal,
     onDelta: (text) => setStreamContent((current) => `${current}${text}`),
     onStreamReady: (stop) => setStreamStop(() => stop),
     onStreamEnd: () => setStreamStop(null),
    },
   );
   return { session, turn };
  },
  onSuccess: ({ session, turn }) => {
   retryTurnRef.current = null;
   const retainedMessages = session.messages.filter(
    (message) => message.id !== turn.userMessage.id && message.id !== turn.assistantMessage.id,
   );
   const nextSession: AiConversationSession = {
    ...session,
    messages: [...retainedMessages, turn.userMessage, turn.assistantMessage].sort(
     (left, right) => left.seq - right.seq,
    ),
   };
   queryClient.setQueryData(conversationSessionQueryKey(turn.conversationId), nextSession);
   void queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
  },
  onError: (_error, variables) => {
   if (!variables.controller.signal.aborted) {
    retryTurnRef.current = {
     clientMessageId: variables.clientMessageId,
     content: variables.content,
    };
    setDraft((current) => current || variables.content);
    void sessionQuery.refetch();
    void runtimeHealthQuery.refetch();
   }
  },
  onSettled: (_data, _error, variables) => {
   if (requestRef.current === variables.controller) requestRef.current = null;
   setStreamContent("");
   setStreamStop(null);
  },
 });

 useEffect(
  () => () => {
   requestRef.current?.abort();
  },
  [],
 );

 const startSend = (content: string) => {
  requestRef.current?.abort();
  const controller = new AbortController();
  const retryTurn = retryTurnRef.current;
  const clientMessageId =
   retryTurn?.content === content ? retryTurn.clientMessageId : crypto.randomUUID();
  requestRef.current = controller;
  retryTurnRef.current = null;
  setDraft("");
  setStreamContent("");
  setStreamStop(null);
  sendMutation.mutate({ content, clientMessageId, controller });
 };

 return { sendMutation, streamContent, streamStop, startSend };
}
