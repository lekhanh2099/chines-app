import { Sparkles } from "lucide-react";

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
   <div className="flex justify-end pl-10 sm:pl-20">
    <div className="max-w-[86%] rounded-xl bg-primary px-3 py-2 text-primary-foreground sm:max-w-[72%]">
     <Typography as="p" variant="bodySmall" tone="inherit" wrapping="preWrap">
      {message.content}
     </Typography>
    </div>
   </div>
  );
 }

 return (
  <div className="flex items-end gap-2 pr-8 sm:pr-20">
   <Avatar size="xs" tone="accent" aria-hidden="true">
    <AvatarFallback>{getAvatarFallback(assistantName)}</AvatarFallback>
   </Avatar>
   <div className="max-w-[88%] rounded-xl border border-border-default bg-surface px-3 py-2 sm:max-w-[76%]">
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
  <div className="flex items-end gap-2 pr-8 sm:pr-20">
   <Avatar size="xs" tone="accent" aria-hidden="true">
    <AvatarFallback>{getAvatarFallback(assistantName)}</AvatarFallback>
   </Avatar>
   <div className="flex items-center gap-2 rounded-xl border border-border-default bg-surface px-3 py-2">
    <Sparkles className="size-4 animate-pulse text-text-muted" aria-hidden="true" />
    <Typography variant="caption" tone="muted">
     {label}
    </Typography>
   </div>
  </div>
 );
}
