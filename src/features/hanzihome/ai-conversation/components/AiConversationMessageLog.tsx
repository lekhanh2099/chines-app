"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { Typography } from "@/components/ui/display/typography";

import type { AiConversationSession } from "../model/ai-conversation-session.schemas";
import type { AiConversationMessage } from "../model/ai-conversation.schemas";
import type { useAiConversationSend } from "../useAiConversationSend";
import {
 AiConversationMessageBubble,
 AiConversationTypingBubble,
} from "./AiConversationMessageBubble";

type AiConversationSend = ReturnType<typeof useAiConversationSend>;

export function AiConversationMessageLog({
 viewportRef,
 isSessionPending,
 isSessionError,
 persistedMessages,
 assistantName,
 activeModeLabel,
 isSending,
 pendingTurn,
 streamContent,
 streamStop,
}: {
 viewportRef: ComponentProps<"div">["ref"];
 isSessionPending: boolean;
 isSessionError: boolean;
 persistedMessages: AiConversationSession["messages"];
 assistantName: string;
 activeModeLabel: string;
 isSending: boolean;
 pendingTurn: AiConversationSend["sendMutation"]["variables"];
 streamContent: AiConversationSend["streamContent"];
 streamStop: AiConversationSend["streamStop"];
}) {
 const t = useTranslations("AiConversation");
 const greeting: AiConversationMessage = {
  role: "assistant",
  content: t("greeting", {
   name: assistantName,
   mode: activeModeLabel,
  }),
 };
 const renderedMessages =
  isSessionPending || isSessionError
   ? []
   : persistedMessages.length > 0
     ? persistedMessages.map((message) => ({
        key: message.id,
        message,
       }))
     : [{ key: "greeting", message: greeting }];
 const pendingMessage =
  isSending && pendingTurn
   ? {
      key: `pending-${pendingTurn.clientMessageId}`,
      message: {
       role: "user",
       content: pendingTurn.content,
      } satisfies AiConversationMessage,
     }
   : null;

 return (
  <div
   ref={viewportRef}
   className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-bg-subtle px-3 py-4 sm:px-5"
   role="log"
   aria-live="polite"
   aria-relevant="additions text"
  >
   {isSessionPending ? (
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("message.loadingConversation")}
    </Typography>
   ) : null}
   {renderedMessages.map(({ key, message }) => (
    <AiConversationMessageBubble key={key} message={message} assistantName={assistantName} />
   ))}
   {pendingMessage ? (
    <AiConversationMessageBubble
     key={pendingMessage.key}
     message={pendingMessage.message}
     assistantName={assistantName}
    />
   ) : null}
   {isSending ? (
    <AiConversationTypingBubble
     assistantName={assistantName}
     label={t("message.replying", { name: assistantName })}
     streamContent={streamContent}
     onStop={streamStop}
    />
   ) : null}
  </div>
 );
}
