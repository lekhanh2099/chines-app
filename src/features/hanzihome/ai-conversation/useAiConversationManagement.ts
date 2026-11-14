"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "next-intl";

import {
 archiveAiConversation,
 createAiConversation,
 ensureAiConversationSession,
 fetchAiConversationHistory,
 updateAiConversationMemoryPolicy,
 updateAiConversationSettings,
} from "./services/ai-conversation-api";
import type {
 AiConversationSession,
 AiConversationSettingsUpdate,
} from "./model/ai-conversation-session.schemas";
import {
 conversationSessionQueryKey,
 HISTORY_QUERY_KEY,
 type ArchiveTarget,
} from "./ai-conversation-workspace-utils";
import type { useAiConversationSessionQuery } from "./useAiConversationSessionQuery";

type AiConversationSessionQuery = ReturnType<typeof useAiConversationSessionQuery>;

export function useAiConversationManagement({
 sessionQuery,
 navigateToConversation,
 abortSpeech,
 resetTurn,
}: {
 sessionQuery: AiConversationSessionQuery["sessionQuery"];
 navigateToConversation: AiConversationSessionQuery["navigateToConversation"];
 abortSpeech: () => void;
 resetTurn: () => void;
}) {
 const t = useTranslations("AiConversation");
 const queryClient = useQueryClient();
 const [isSetupOpen, setIsSetupOpen] = useState(false);
 const [isHistoryOpen, setIsHistoryOpen] = useState(false);
 const [archiveTarget, setArchiveTarget] = useState<ArchiveTarget | null>(null);

 const historyQuery = useQuery({
  queryKey: HISTORY_QUERY_KEY,
  queryFn: ({ signal }) => fetchAiConversationHistory({ signal }),
  enabled: isHistoryOpen,
  staleTime: 15_000,
  retry: false,
 });

 const settingsMutation = useMutation({
  retry: false,
  mutationFn: async (settings: AiConversationSettingsUpdate) => {
   const session = sessionQuery.data?.conversation
    ? sessionQuery.data
    : await ensureAiConversationSession();
   const conversation = session.conversation;
   if (!conversation) throw new Error(t("setup.saveError"));
   return updateAiConversationSettings(conversation.id, settings);
  },
  onSuccess: (settings) => {
   queryClient.setQueryData<AiConversationSession>(
    conversationSessionQueryKey(settings.conversationId),
    (current) => {
     if (!current?.conversation || current.conversation.id !== settings.conversationId) {
      return current;
     }
     return {
      ...current,
      learnerLevel: settings.learnerLevel,
      conversation: {
       ...current.conversation,
       mode: settings.mode,
       correctionStyle: settings.correctionStyle,
       replyMode: settings.replyMode,
      },
     };
    },
   );
   setIsSetupOpen(false);
   void queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
  },
  onError: () => {
   void sessionQuery.refetch();
  },
 });

 const createConversationMutation = useMutation({
  retry: false,
  mutationFn: () => createAiConversation(),
  onSuccess: (session) => {
   const conversation = session.conversation;
   if (!conversation) return;
   abortSpeech();
   queryClient.setQueryData(conversationSessionQueryKey(conversation.id), session);
   resetTurn();
   setIsHistoryOpen(false);
   navigateToConversation(conversation.id);
   void queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
  },
 });

 const memoryPolicyMutation = useMutation({
  retry: false,
  mutationFn: async (useMemory: boolean) => {
   const conversation = sessionQuery.data?.conversation;
   if (!conversation) throw new Error(t("memory.updateError"));
   return updateAiConversationMemoryPolicy(conversation.id, useMemory ? "inherit" : "disabled");
  },
  onSuccess: (state) => {
   queryClient.setQueryData<AiConversationSession>(
    conversationSessionQueryKey(state.conversationId),
    (current) => {
     if (!current?.conversation) return current;
     return {
      ...current,
      memoryEnabled: state.memoryEnabled,
      conversation: {
       ...current.conversation,
       memoryPolicy: state.memoryPolicy,
      },
     };
    },
   );
   void queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
  },
  onError: () => {
   void sessionQuery.refetch();
  },
 });

 const archiveConversationMutation = useMutation({
  retry: false,
  mutationFn: async ({ id, isCurrent }: { id: string; isCurrent: boolean }) => {
   await archiveAiConversation(id);
   const nextSession = isCurrent ? await ensureAiConversationSession() : null;
   return { archivedId: id, nextSession };
  },
  onSuccess: ({ archivedId, nextSession }) => {
   queryClient.removeQueries({ queryKey: conversationSessionQueryKey(archivedId), exact: true });
   if (nextSession?.conversation) {
    abortSpeech();
    queryClient.setQueryData(conversationSessionQueryKey(nextSession.conversation.id), nextSession);
    resetTurn();
    navigateToConversation(nextSession.conversation.id);
   }
   setArchiveTarget(null);
   void queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
  },
 });

 return {
  isSetupOpen,
  setIsSetupOpen,
  isHistoryOpen,
  setIsHistoryOpen,
  archiveTarget,
  setArchiveTarget,
  historyQuery,
  settingsMutation,
  createConversationMutation,
  memoryPolicyMutation,
  archiveConversationMutation,
 };
}
