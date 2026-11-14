"use client";

import { useTranslations } from "next-intl";

import type {
 AiConversationSession,
 AiConversationSettingsUpdate,
} from "../model/ai-conversation-session.schemas";
import type { useAiConversationManagement } from "../useAiConversationManagement";
import { AiConversationHistorySheet } from "./AiConversationHistorySheet";
import { ArchiveConversationDialog } from "./ArchiveConversationDialog";
import { ConversationSettingsDialog } from "./ConversationSettingsDialog";

export function AiConversationOverlays({
 management,
 conversation,
 learnerLevel,
 isNavigationLocked,
 onSelectConversation,
}: {
 management: ReturnType<typeof useAiConversationManagement>;
 conversation: AiConversationSession["conversation"];
 learnerLevel: AiConversationSettingsUpdate["learnerLevel"];
 isNavigationLocked: boolean;
 onSelectConversation: (conversationId: string) => void;
}) {
 const t = useTranslations("AiConversation");
 const {
  isSetupOpen,
  setIsSetupOpen,
  isHistoryOpen,
  setIsHistoryOpen,
  archiveTarget,
  setArchiveTarget,
  historyQuery,
  settingsMutation,
  createConversationMutation,
  archiveConversationMutation,
 } = management;
 const currentSettings: AiConversationSettingsUpdate | null = conversation
  ? {
     mode: conversation.mode,
     correctionStyle: conversation.correctionStyle,
     replyMode: conversation.replyMode,
     learnerLevel,
    }
  : null;
 const historyError =
  createConversationMutation.error instanceof Error
   ? createConversationMutation.error.message
   : historyQuery.error instanceof Error
     ? historyQuery.error.message
     : null;

 return (
  <>
   <AiConversationHistorySheet
    open={isHistoryOpen}
    currentConversationId={conversation?.id ?? null}
    items={historyQuery.data ?? []}
    isLoading={historyQuery.isPending && isHistoryOpen}
    error={historyError}
    disabled={isNavigationLocked}
    isCreating={createConversationMutation.isPending}
    archivingConversationId={archiveConversationMutation.variables?.id ?? null}
    onOpenChange={setIsHistoryOpen}
    onCreate={() => createConversationMutation.mutate()}
    onSelect={onSelectConversation}
    onRequestArchive={(item) => {
     setIsHistoryOpen(false);
     setArchiveTarget({ id: item.id, title: item.title.trim() || t("history.untitled") });
    }}
   />

   {archiveTarget ? (
    <ArchiveConversationDialog
     target={archiveTarget}
     isArchiving={archiveConversationMutation.isPending}
     error={
      archiveConversationMutation.error instanceof Error
       ? archiveConversationMutation.error.message
       : null
     }
     onOpenChange={(open) => {
      if (!open && !archiveConversationMutation.isPending) {
       archiveConversationMutation.reset();
       setArchiveTarget(null);
      }
     }}
     onConfirm={() =>
      archiveConversationMutation.mutate({
       id: archiveTarget.id,
       isCurrent: archiveTarget.id === conversation?.id,
      })
     }
    />
   ) : null}

   {isSetupOpen && currentSettings ? (
    <ConversationSettingsDialog
     initialSettings={currentSettings}
     isSaving={settingsMutation.isPending}
     saveError={settingsMutation.error instanceof Error ? settingsMutation.error.message : null}
     onOpenChange={(open) => {
      if (!settingsMutation.isPending) {
       if (!open) settingsMutation.reset();
       setIsSetupOpen(open);
      }
     }}
     onSave={(settings) => settingsMutation.mutate(settings)}
    />
   ) : null}
  </>
 );
}
