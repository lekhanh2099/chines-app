"use client";

import { MoreHorizontal, Square } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

import { useAiConversationClientStream } from "./ai-conversation-stream.client";
import type { AiConversationMessage } from "./ai-conversation.schemas";

type AiConversationMessageBubbleProps = {
 message: AiConversationMessage;
 assistantName: string;
};

function getAvatarFallback(name: string) {
 return name.trim().slice(0, 1) || "AI";
}

export function AiConversationMessageBubble({
 message,
 assistantName,
}: AiConversationMessageBubbleProps) {
 if (message.role === "user") {
  return (
   <div className="flex w-full justify-end pl-10 sm:pl-24" data-message-role="user">
    <div className="max-w-[84%] rounded-xl rounded-br-sm bg-primary px-3.5 py-2.5 text-primary-foreground sm:max-w-[72%]">
     <Typography as="p" variant="bodySmall" tone="inherit" wrapping="preWrap">
      {message.content}
     </Typography>
    </div>
   </div>
  );
 }

 return (
  <div className="flex w-full items-end gap-2 pr-10 sm:pr-24" data-message-role="assistant">
   <Avatar size="xs" tone="accent" aria-hidden="true">
    <AvatarFallback>{getAvatarFallback(assistantName)}</AvatarFallback>
   </Avatar>
   <div className="max-w-[86%] rounded-xl rounded-bl-sm border border-border-default bg-surface px-3.5 py-2.5 sm:max-w-[74%]">
    <Typography as="p" variant="bodySmall" wrapping="preWrap">
     {message.content}
    </Typography>
   </div>
  </div>
 );
}

export function AiConversationTypingBubble({
 assistantName,
 label,
}: {
 assistantName: string;
 label: string;
}) {
 const t = useTranslations("AiConversation");
 const stream = useAiConversationClientStream();

 return (
  <div className="flex w-full items-end gap-2 pr-3 sm:pr-24" data-message-role="assistant">
   <Avatar size="xs" tone="accent" aria-hidden="true">
    <AvatarFallback>{getAvatarFallback(assistantName)}</AvatarFallback>
   </Avatar>
   <div className="grid min-w-0 max-w-[92%] gap-2 rounded-xl rounded-bl-sm border border-border-default bg-surface px-3 py-2 sm:max-w-[78%]">
    {stream.content.length > 0 ? (
     <Typography as="p" variant="bodySmall" wrapping="preWrap">
      {stream.content}
     </Typography>
    ) : (
     <div className="flex min-h-6 items-center">
      <MoreHorizontal className="size-5 text-text-muted" aria-hidden="true" />
      <Typography as="span" variant="caption" className="sr-only">
       {label}
      </Typography>
     </div>
    )}
    {stream.active && stream.stop ? (
     <Button
      type="button"
      variant="outline"
      size="compact"
      className="justify-self-start"
      onClick={stream.stop}
     >
      <Square data-icon="inline-start" />
      {t("actions.stop")}
     </Button>
    ) : null}
   </div>
  </div>
 );
}
