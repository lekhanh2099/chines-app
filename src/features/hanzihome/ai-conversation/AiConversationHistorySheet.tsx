"use client";

import { Archive, MessageCircle, MessageSquarePlus, MoreHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";

import type { AiConversationHistoryItem, AiConversationMode } from "./ai-conversation-session.schemas";

type AiConversationHistorySheetProps = {
 open: boolean;
 currentConversationId: string | null;
 items: AiConversationHistoryItem[];
 isLoading: boolean;
 error: string | null;
 disabled: boolean;
 isCreating: boolean;
 archivingConversationId: string | null;
 onOpenChange: (open: boolean) => void;
 onCreate: () => void;
 onSelect: (conversationId: string) => void;
 onRequestArchive: (item: AiConversationHistoryItem) => void;
};

export function AiConversationHistorySheet({
 open,
 currentConversationId,
 items,
 isLoading,
 error,
 disabled,
 isCreating,
 archivingConversationId,
 onOpenChange,
 onCreate,
 onSelect,
 onRequestArchive,
}: AiConversationHistorySheetProps) {
 const t = useTranslations("AiConversation");
 const locale = useLocale();
 const modeLabels: Record<AiConversationMode, string> = {
  natural: t("modes.natural"),
  "speaking-practice": t("modes.speakingPractice"),
  "grammar-coach": t("modes.grammarCoach"),
  "hskk-practice": t("modes.hskkPractice"),
 };
 const dateFormatter = new Intl.DateTimeFormat(locale, {
  dateStyle: "medium",
  timeStyle: "short",
 });

 return (
  <Sheet open={open} onOpenChange={onOpenChange} side="right">
   <SheetHeader title={t("history.title")} onClose={() => onOpenChange(false)} />
   <SheetBody className="grid content-start gap-4">
    <Button
     type="button"
     variant="outline"
     size="touch"
     onClick={onCreate}
     disabled={disabled || isCreating}
    >
     <MessageSquarePlus data-icon="inline-start" />
     {isCreating ? t("history.creating") : t("history.newConversation")}
    </Button>

    {error ? (
     <Typography as="p" variant="bodySmall" tone="danger" role="alert">
      {error}
     </Typography>
    ) : null}

    {isLoading ? (
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("history.loading")}
     </Typography>
    ) : items.length === 0 ? (
     <EmptyState
      size="compact"
      icon={<MessageCircle aria-hidden="true" />}
      title={t("history.emptyTitle")}
      description={t("history.emptyDescription")}
     />
    ) : (
     <div className="grid gap-1" role="list" aria-label={t("history.listAria")}>
      {items.map((item) => {
       const isCurrent = item.id === currentConversationId;
       const activityAt = item.lastMessageAt ?? item.createdAt;
       const title = item.title.trim() || t("history.untitled");
       return (
        <div
         key={item.id}
         role="listitem"
         className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-1"
        >
         <Button
          type="button"
          variant={isCurrent ? "active" : "navigation"}
          size="touch"
          align="start"
          wrap="normal"
          layout="grid"
          className="w-full min-w-0"
          aria-current={isCurrent ? "true" : undefined}
          onClick={() => onSelect(item.id)}
          disabled={disabled}
         >
          <span className="grid min-w-0 gap-1">
           <Typography as="span" variant="bodySmall" weight="bold" clamp="one">
            {title}
           </Typography>
           <span className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="default" size="sm" casing="natural">
             {modeLabels[item.mode]}
            </Badge>
            {item.memoryPolicy === "disabled" ? (
             <Badge variant="warning" size="sm" casing="natural">
              {t("memory.offShort")}
             </Badge>
            ) : null}
            <Typography as="span" variant="caption" tone="muted">
             {dateFormatter.format(new Date(activityAt))}
            </Typography>
           </span>
          </span>
         </Button>

         <DropdownMenu>
          <DropdownMenuTrigger asChild>
           <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("history.actionsAria", { title })}
            disabled={disabled || archivingConversationId === item.id}
           >
            <MoreHorizontal />
           </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" width="sm">
           <DropdownMenuItem onSelect={() => onRequestArchive(item)}>
            <Archive />
            {t("history.archive")}
           </DropdownMenuItem>
          </DropdownMenuContent>
         </DropdownMenu>
        </div>
       );
      })}
     </div>
    )}
   </SheetBody>
  </Sheet>
 );
}
