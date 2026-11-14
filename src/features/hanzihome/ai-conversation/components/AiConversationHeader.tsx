"use client";

import type { ComponentProps } from "react";
import { Archive, History, MessageSquarePlus, MoreHorizontal, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/display/avatar";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { Typography } from "@/components/ui/display/typography";

import { deriveAiConversationRelationshipBand } from "../model/ai-conversation-relationship";
import type {
 AiConversationSession,
 AiConversationSettingsUpdate,
} from "../model/ai-conversation-session.schemas";
import { AiConversationRuntimeMenu } from "./AiConversationRuntimeMenu";

export function AiConversationHeader({
 assistantName,
 character,
 learnerLevel,
 familiarityScore,
 activeModeLabel,
 isMemoryOff,
 isNavigationLocked,
 runtimeMenu,
 actionsMenu,
 onCreateConversation,
 onOpenHistory,
}: {
 assistantName: string;
 character: AiConversationSession["character"];
 learnerLevel: AiConversationSettingsUpdate["learnerLevel"];
 familiarityScore: Parameters<typeof deriveAiConversationRelationshipBand>[0];
 activeModeLabel: string;
 isMemoryOff: boolean;
 isNavigationLocked: boolean;
 runtimeMenu: ComponentProps<typeof AiConversationRuntimeMenu>;
 actionsMenu: ComponentProps<typeof AiConversationActionsMenu>;
 onCreateConversation: () => void;
 onOpenHistory: () => void;
}) {
 const t = useTranslations("AiConversation");
 const levelLabels: Record<AiConversationSettingsUpdate["learnerLevel"], string> = {
  beginner: t("levels.beginner"),
  intermediate: t("levels.intermediate"),
  advanced: t("levels.advanced"),
 };
 const relationshipBand = deriveAiConversationRelationshipBand(familiarityScore);
 const relationshipLabels = {
  new: t("relationship.new"),
  familiar: t("relationship.familiar"),
  friends: t("relationship.friends"),
  close: t("relationship.close"),
 } satisfies Record<typeof relationshipBand, string>;
 const profileAvatar = assistantName.trim().slice(0, 1) || "AI";
 const characterSummary = character
  ? [character.city, ...character.interests.slice(0, 2)].filter(Boolean).join(" · ")
  : t("fallbackInterest");

 return (
  <div className="flex min-w-0 shrink-0 flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
   <div className="flex min-w-0 items-center gap-3">
    <Avatar size="md" shape="rounded" tone="accent" aria-hidden="true">
     <AvatarFallback>{profileAvatar}</AvatarFallback>
    </Avatar>
    <div className="grid min-w-0 gap-1">
     <Typography as="span" variant="caption" tone="muted">
      {t("title")} · {levelLabels[learnerLevel]}
     </Typography>
     <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Typography as="h1" variant="cardTitle" weight="black">
       {assistantName}
      </Typography>
      <Badge variant="accent" casing="natural">
       {relationshipLabels[relationshipBand]}
      </Badge>
      <Badge variant="default" casing="natural">
       {activeModeLabel}
      </Badge>
      {isMemoryOff ? (
       <Badge variant="warning" casing="natural">
        {t("memory.offShort")}
       </Badge>
      ) : null}
     </div>
     <Typography variant="caption" tone="muted" clamp="one">
      {characterSummary}
     </Typography>
    </div>
   </div>

   <div className="flex min-w-0 flex-wrap items-center gap-1">
    <Button
     type="button"
     variant="ghost"
     size="icon"
     aria-label={t("history.newConversation")}
     onClick={onCreateConversation}
     disabled={isNavigationLocked}
    >
     <MessageSquarePlus />
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon"
     aria-label={t("history.open")}
     onClick={onOpenHistory}
     disabled={isNavigationLocked}
    >
     <History />
    </Button>
    <AiConversationRuntimeMenu {...runtimeMenu} />
    <AiConversationActionsMenu {...actionsMenu} />
   </div>
  </div>
 );
}

function AiConversationActionsMenu({
 disabled,
 canOpenSetup,
 isMemoryEnabled,
 isMemoryUpdating,
 onOpenSetup,
 onMemoryChange,
 onArchive,
}: {
 disabled: boolean;
 canOpenSetup: boolean;
 isMemoryEnabled: boolean;
 isMemoryUpdating: boolean;
 onOpenSetup: () => void;
 onMemoryChange: (useMemory: boolean) => void;
 onArchive: () => void;
}) {
 const t = useTranslations("AiConversation");
 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     variant="ghost"
     size="icon"
     aria-label={t("actions.more")}
     disabled={disabled}
    >
     <MoreHorizontal />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="end" width="md">
    <DropdownMenuItem onSelect={onOpenSetup} disabled={!canOpenSetup}>
     <Settings2 />
     {t("actions.setup")}
    </DropdownMenuItem>
    <DropdownMenuCheckboxItem
     checked={isMemoryEnabled}
     onCheckedChange={(checked) => onMemoryChange(checked === true)}
     disabled={isMemoryUpdating}
    >
     {t("memory.useLongTerm")}
    </DropdownMenuCheckboxItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={onArchive}>
     <Archive />
     {t("history.archive")}
    </DropdownMenuItem>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}
