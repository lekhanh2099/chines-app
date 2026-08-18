import { MoreHorizontal } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";

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
 return (
  <div className="flex w-full items-end gap-2 pr-10 sm:pr-24" data-message-role="assistant">
   <Avatar size="xs" tone="accent" aria-hidden="true">
    <AvatarFallback>{getAvatarFallback(assistantName)}</AvatarFallback>
   </Avatar>
   <div className="flex min-h-9 items-center rounded-xl rounded-bl-sm border border-border-default bg-surface px-3 py-1.5">
    <MoreHorizontal className="size-5 text-text-muted" aria-hidden="true" />
    <Typography as="span" variant="caption" className="sr-only">
     {label}
    </Typography>
   </div>
  </div>
 );
}
