"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";

import { AiConversationComposer } from "./components/AiConversationComposer";
import { AiConversationHeader } from "./components/AiConversationHeader";
import { AiConversationMessageLog } from "./components/AiConversationMessageLog";
import { AiConversationOverlays } from "./components/AiConversationOverlays";
import {
 aiConversationModeSchema,
 type AiConversationMode,
} from "./model/ai-conversation-session.schemas";
import { aiConversationLearnerLevelSchema } from "./model/ai-conversation.schemas";
import type { RetryTurn } from "./ai-conversation-workspace-utils";
import { useAiConversationManagement } from "./useAiConversationManagement";
import { useAiConversationRuntime } from "./useAiConversationRuntime";
import { useAiConversationSend } from "./useAiConversationSend";
import { useAiConversationSessionQuery } from "./useAiConversationSessionQuery";
import { useAiConversationSpeech } from "./useAiConversationSpeech";

export function AiConversationWorkspace() {
 const t = useTranslations("AiConversation");
 const { conversationIdFromUrl, navigateToConversation, sessionQuery } =
  useAiConversationSessionQuery();

 const [draft, setDraft] = useState("");
 const retryTurnRef = useRef<RetryTurn | null>(null);
 const messageViewportRef = useRef<HTMLDivElement | null>(null);

 const speech = useAiConversationSpeech({ conversationIdFromUrl, draft, setDraft, retryTurnRef });
 const { abortSpeech, speechRecognitionRef, isListening, isSpeechPending } = speech;

 const activeConversationId = sessionQuery.data?.conversation?.id ?? null;
 const runtime = useAiConversationRuntime(activeConversationId);
 const { runtimeKeyId, runtimeHealthQuery } = runtime;

 const { sendMutation, streamContent, streamStop, startSend } = useAiConversationSend({
  sessionQuery,
  runtimeKeyId,
  runtimeModel: runtime.runtimeModel,
  runtimeHealthQuery,
  retryTurnRef,
  setDraft,
 });

 const management = useAiConversationManagement({
  sessionQuery,
  navigateToConversation,
  abortSpeech,
  resetTurn: () => {
   retryTurnRef.current = null;
   setDraft("");
   sendMutation.reset();
  },
 });
 const {
  setIsSetupOpen,
  setIsHistoryOpen,
  setArchiveTarget,
  settingsMutation,
  createConversationMutation,
  memoryPolicyMutation,
  archiveConversationMutation,
 } = management;

 const runtimeHealth = runtimeHealthQuery.data ?? null;
 const isHealthChecking = runtimeHealthQuery.isFetching;
 const isSending = sendMutation.isPending;
 const session = sessionQuery.data ?? null;
 const conversation = session?.conversation ?? null;
 const character = session?.character ?? null;
 const learnerLevel = session?.learnerLevel ?? aiConversationLearnerLevelSchema.enum.intermediate;
 const persistedMessages = session?.messages ?? [];
 const modeLabels: Record<AiConversationMode, string> = {
  natural: t("modes.natural"),
  "speaking-practice": t("modes.speakingPractice"),
  "grammar-coach": t("modes.grammarCoach"),
  "hskk-practice": t("modes.hskkPractice"),
 };
 const assistantName = character?.displayName ?? t("character.defaultName");
 const activeMode = conversation?.mode ?? aiConversationModeSchema.enum.natural;
 const sessionError = sessionQuery.error instanceof Error ? sessionQuery.error.message : null;
 const sendError = sendMutation.error instanceof Error ? sendMutation.error.message : null;
 const memoryError =
  memoryPolicyMutation.error instanceof Error ? memoryPolicyMutation.error.message : null;
 const visibleError = sendError || memoryError || sessionError;
 const currentTitle = conversation?.title.trim() || t("history.untitled");
 const isNavigationLocked =
  isSending ||
  createConversationMutation.isPending ||
  archiveConversationMutation.isPending ||
  sessionQuery.isFetching;

 useEffect(() => {
  const viewport = messageViewportRef.current;
  if (!viewport) return;
  viewport.scrollTop = viewport.scrollHeight;
 }, [conversation?.id, isSending, persistedMessages.length, streamContent]);

 const updateDraft = (value: string) => {
  abortSpeech();
  setDraft(value);
  const retryTurn = retryTurnRef.current;
  if (retryTurn && value.normalize("NFC").trim() !== retryTurn.content) {
   retryTurnRef.current = null;
  }
 };

 const selectConversation = (nextConversationId: string) => {
  if (isNavigationLocked || nextConversationId === conversation?.id) {
   setIsHistoryOpen(false);
   return;
  }
  abortSpeech();
  retryTurnRef.current = null;
  setDraft("");
  sendMutation.reset();
  setIsHistoryOpen(false);
  navigateToConversation(nextConversationId);
 };

 const send = () => {
  const content = draft.normalize("NFC").trim();
  if (
   !content ||
   isSending ||
   speechRecognitionRef.current ||
   !runtimeHealth?.ready ||
   sessionQuery.isFetching
  )
   return;

  startSend(content);
 };

 const canSend =
  Boolean(runtimeHealth?.ready) &&
  !isHealthChecking &&
  !isSending &&
  !isListening &&
  !isSpeechPending &&
  !sessionQuery.isFetching &&
  !sessionQuery.isError;

 return (
  <Card
   variant="section"
   padding="none"
   className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
  >
   <AiConversationHeader
    assistantName={assistantName}
    character={character}
    learnerLevel={learnerLevel}
    familiarityScore={session?.relationship?.familiarityScore ?? null}
    activeModeLabel={modeLabels[activeMode]}
    isMemoryOff={Boolean(session && !session.memoryEnabled)}
    isNavigationLocked={isNavigationLocked}
    onCreateConversation={() => createConversationMutation.mutate()}
    onOpenHistory={() => setIsHistoryOpen(true)}
    runtimeMenu={{
     runtimeKeys: runtime.runtimeKeys,
     runtimeKeyId,
     runtimeModel: runtime.runtimeModel,
     runtimeHealth,
     isRuntimeLoading: runtime.isRuntimeLoading,
     isHealthChecking,
     runtimeLoadError: runtime.runtimeLoadError,
     onSelectRuntime: (value) => runtime.selectRuntimeKey(value, () => sendMutation.reset()),
     onSelectModel: runtime.selectRuntimeModel,
     onRecheck: () => void runtimeHealthQuery.refetch(),
    }}
    actionsMenu={{
     disabled: !conversation || isNavigationLocked,
     canOpenSetup: Boolean(conversation),
     isMemoryEnabled: conversation?.memoryPolicy !== "disabled",
     isMemoryUpdating: memoryPolicyMutation.isPending,
     onOpenSetup: () => {
      settingsMutation.reset();
      setIsSetupOpen(true);
     },
     onMemoryChange: (useMemory) => memoryPolicyMutation.mutate(useMemory),
     onArchive: () => {
      if (conversation) setArchiveTarget({ id: conversation.id, title: currentTitle });
     },
    }}
   />

   <AiConversationMessageLog
    viewportRef={messageViewportRef}
    isSessionPending={sessionQuery.isPending}
    isSessionError={sessionQuery.isError}
    persistedMessages={persistedMessages}
    assistantName={assistantName}
    activeModeLabel={modeLabels[activeMode]}
    isSending={isSending}
    pendingTurn={sendMutation.variables}
    streamContent={streamContent}
    streamStop={streamStop}
   />

   {visibleError ? (
    <div className="shrink-0 border-t border-border-default px-3 py-2 sm:px-4" role="alert">
     <Typography variant="bodySmall" tone="danger">
      {visibleError}
     </Typography>
    </div>
   ) : null}

   <AiConversationComposer
    draft={draft}
    isSending={isSending}
    isSessionError={sessionQuery.isError}
    canSend={canSend}
    speech={speech}
    onDraftChange={updateDraft}
    onSend={send}
   />

   <AiConversationOverlays
    management={management}
    conversation={conversation}
    learnerLevel={learnerLevel}
    isNavigationLocked={isNavigationLocked}
    onSelectConversation={selectConversation}
   />
  </Card>
 );
}
