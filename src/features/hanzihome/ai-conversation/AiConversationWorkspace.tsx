"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
 Archive,
 History,
 MessageSquarePlus,
 MoreHorizontal,
 Send,
 Settings2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { useAppForm } from "@/components/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { fetchManagedApiKeys } from "@/features/settings/api-key-manager.client";
import type { ApiKeysResponse } from "@/features/settings/api-key-manager.schema";
import { recordAiUsageEvent } from "@/lib/ai-usage.client";

import {
 archiveAiConversation,
 createAiConversation,
 ensureAiConversationSession,
 fetchAiConversationHistory,
 fetchAiConversationRuntimeHealth,
 fetchAiConversationSession,
 sendPersistedAiConversationMessage,
 updateAiConversationMemoryPolicy,
 updateAiConversationSettings,
} from "./ai-conversation-api";
import { AiConversationHistorySheet } from "./AiConversationHistorySheet";
import {
 AiConversationMessageBubble,
 AiConversationTypingBubble,
} from "./AiConversationMessageBubble";
import { deriveAiConversationRelationshipBand } from "./ai-conversation-relationship";
import {
 aiConversationModeSchema,
 aiConversationSettingsUpdateSchema,
 type AiConversationMode,
 type AiConversationSession,
 type AiConversationSettingsUpdate,
} from "./ai-conversation-session.schemas";
import {
 aiConversationCorrectionStyleSchema,
 aiConversationLearnerLevelSchema,
 aiConversationReplyModeSchema,
 type AiConversationMessage,
} from "./ai-conversation.schemas";
import {
 AiConversationRuntimeMenu,
 AUTO_RUNTIME_KEY_ID,
} from "./AiConversationRuntimeMenu";

const RUNTIME_KEY_STORAGE_KEY = "hanzihome.ai-conversation.runtime-key.v1";
const SESSION_QUERY_ROOT = ["hanzihome", "ai-conversation", "session"] as const;
const HISTORY_QUERY_KEY = ["hanzihome", "ai-conversation", "history"] as const;

type ManagedApiKey = ApiKeysResponse["keys"][number];
type RetryTurn = { clientMessageId: string; content: string };
type ArchiveTarget = { id: string; title: string };

function conversationSessionQueryKey(conversationId: string | null) {
 return [...SESSION_QUERY_ROOT, conversationId ?? "latest"] as const;
}

export function AiConversationWorkspace() {
 const t = useTranslations("AiConversation");
 const queryClient = useQueryClient();
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const searchParamsString = searchParams.toString();
 const rawConversationId = searchParams.get("conversation");
 const parsedConversationId = z.uuid().safeParse(rawConversationId);
 const conversationIdFromUrl = parsedConversationId.success ? parsedConversationId.data : null;

 const [isSetupOpen, setIsSetupOpen] = useState(false);
 const [isHistoryOpen, setIsHistoryOpen] = useState(false);
 const [archiveTarget, setArchiveTarget] = useState<ArchiveTarget | null>(null);
 const [draft, setDraft] = useState("");
 const [runtimeKeys, setRuntimeKeys] = useState<ManagedApiKey[]>([]);
 const [runtimeKeyId, setRuntimeKeyId] = useState(AUTO_RUNTIME_KEY_ID);
 const [isRuntimeLoading, setIsRuntimeLoading] = useState(true);
 const [runtimeLoadError, setRuntimeLoadError] = useState(false);
 const requestRef = useRef<AbortController | null>(null);
 const retryTurnRef = useRef<RetryTurn | null>(null);
 const messageViewportRef = useRef<HTMLDivElement | null>(null);

 const navigateToConversation = (conversationId: string) => {
  const nextParams = new URLSearchParams(searchParamsString);
  nextParams.set("conversation", conversationId);
  router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
 };

 const sessionQuery = useQuery({
  queryKey: conversationSessionQueryKey(conversationIdFromUrl),
  queryFn: ({ signal }) =>
   conversationIdFromUrl
    ? fetchAiConversationSession({ conversationId: conversationIdFromUrl, signal })
    : ensureAiConversationSession({ signal }),
  retry: false,
 });

 const historyQuery = useQuery({
  queryKey: HISTORY_QUERY_KEY,
  queryFn: ({ signal }) => fetchAiConversationHistory({ signal }),
  enabled: isHistoryOpen,
  staleTime: 15_000,
  retry: false,
 });

 const runtimeHealthQuery = useQuery({
  queryKey: ["hanzihome", "ai-conversation", "runtime-health", runtimeKeyId],
  queryFn: ({ signal }) =>
   fetchAiConversationRuntimeHealth({
    ...(runtimeKeyId !== AUTO_RUNTIME_KEY_ID ? { apiKeyId: runtimeKeyId } : {}),
    signal,
   }),
  enabled: !isRuntimeLoading,
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
    },
    { signal: controller.signal },
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
   void queryClient.invalidateQueries({
    queryKey: conversationSessionQueryKey(turn.conversationId),
   });
   void queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
   recordAiUsageEvent({
    apiKeyId: turn.apiKeyId,
    provider: turn.provider,
    model: turn.model,
    usage: turn.usage,
   });
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
  },
 });

 const createConversationMutation = useMutation({
  retry: false,
  mutationFn: () => createAiConversation(),
  onSuccess: (session) => {
   const conversation = session.conversation;
   if (!conversation) return;
   queryClient.setQueryData(conversationSessionQueryKey(conversation.id), session);
   retryTurnRef.current = null;
   setDraft("");
   sendMutation.reset();
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
   return updateAiConversationMemoryPolicy(
    conversation.id,
    useMemory ? "inherit" : "disabled",
   );
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
    queryClient.setQueryData(
     conversationSessionQueryKey(nextSession.conversation.id),
     nextSession,
    );
    retryTurnRef.current = null;
    setDraft("");
    sendMutation.reset();
    navigateToConversation(nextSession.conversation.id);
   }
   setArchiveTarget(null);
   void queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
  },
 });

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
 const levelLabels: Record<AiConversationSettingsUpdate["learnerLevel"], string> = {
  beginner: t("levels.beginner"),
  intermediate: t("levels.intermediate"),
  advanced: t("levels.advanced"),
 };
 const relationshipBand = deriveAiConversationRelationshipBand(
  session?.relationship?.familiarityScore ?? null,
 );
 const relationshipLabels = {
  new: t("relationship.new"),
  familiar: t("relationship.familiar"),
  friends: t("relationship.friends"),
  close: t("relationship.close"),
 } satisfies Record<typeof relationshipBand, string>;
 const assistantName = character?.displayName ?? t("character.defaultName");
 const activeMode = conversation?.mode ?? aiConversationModeSchema.enum.natural;
 const greeting: AiConversationMessage = {
  role: "assistant",
  content: t("greeting", {
   name: assistantName,
   mode: modeLabels[activeMode],
  }),
 };
 const renderedMessages =
  sessionQuery.isPending || sessionQuery.isError
   ? []
   : persistedMessages.length > 0
     ? persistedMessages.map((message) => ({
        key: message.id,
        message: { role: message.role, content: message.content } satisfies AiConversationMessage,
       }))
     : [{ key: "greeting", message: greeting }];
 const pendingMessage =
  sendMutation.isPending && sendMutation.variables
   ? {
      key: `pending-${sendMutation.variables.clientMessageId}`,
      message: {
       role: "user",
       content: sendMutation.variables.content,
      } satisfies AiConversationMessage,
     }
   : null;
 const profileAvatar = assistantName.trim().slice(0, 1) || "AI";
 const characterSummary = character
  ? [character.city, ...character.interests.slice(0, 2)].filter(Boolean).join(" · ")
  : t("fallbackInterest");
 const sessionError = sessionQuery.error instanceof Error ? sessionQuery.error.message : null;
 const sendError = sendMutation.error instanceof Error ? sendMutation.error.message : null;
 const memoryError =
  memoryPolicyMutation.error instanceof Error ? memoryPolicyMutation.error.message : null;
 const visibleError = sendError || memoryError || sessionError;
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
 const currentTitle = conversation?.title.trim() || t("history.untitled");
 const isNavigationLocked = isSending || archiveConversationMutation.isPending;

 useEffect(() => () => requestRef.current?.abort(), []);

 useEffect(() => {
  const resolvedConversationId = sessionQuery.data?.conversation?.id;
  if (!resolvedConversationId || resolvedConversationId === conversationIdFromUrl) return;
  queryClient.setQueryData(
   conversationSessionQueryKey(resolvedConversationId),
   sessionQuery.data,
  );
  navigateToConversation(resolvedConversationId);
 }, [conversationIdFromUrl, queryClient, sessionQuery.data]);

 useEffect(() => {
  let cancelled = false;
  const loadRuntimeKeys = async () => {
   setIsRuntimeLoading(true);
   setRuntimeLoadError(false);
   try {
    const response = await fetchManagedApiKeys();
    if (cancelled) return;
    const activeKeys = response.keys.filter((key) => key.isActive);
    setRuntimeKeys(activeKeys);
    const savedKeyId = window.localStorage.getItem(RUNTIME_KEY_STORAGE_KEY);
    setRuntimeKeyId(
     savedKeyId && activeKeys.some((key) => key.id === savedKeyId)
      ? savedKeyId
      : AUTO_RUNTIME_KEY_ID,
    );
   } catch {
    if (!cancelled) setRuntimeLoadError(true);
   } finally {
    if (!cancelled) setIsRuntimeLoading(false);
   }
  };

  void loadRuntimeKeys();
  return () => {
   cancelled = true;
  };
 }, []);

 useEffect(() => {
  const viewport = messageViewportRef.current;
  if (!viewport) return;
  viewport.scrollTop = viewport.scrollHeight;
 }, [conversation?.id, isSending, persistedMessages.length]);

 const selectRuntimeKey = (value: string) => {
  const nextValue =
   value === AUTO_RUNTIME_KEY_ID || runtimeKeys.some((key) => key.id === value)
    ? value
    : AUTO_RUNTIME_KEY_ID;
  setRuntimeKeyId(nextValue);
  sendMutation.reset();
  if (nextValue === AUTO_RUNTIME_KEY_ID) {
   window.localStorage.removeItem(RUNTIME_KEY_STORAGE_KEY);
  } else {
   window.localStorage.setItem(RUNTIME_KEY_STORAGE_KEY, nextValue);
  }
 };

 const updateDraft = (value: string) => {
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
  retryTurnRef.current = null;
  setDraft("");
  sendMutation.reset();
  setIsHistoryOpen(false);
  navigateToConversation(nextConversationId);
 };

 const send = () => {
  const content = draft.normalize("NFC").trim();
  if (!content || isSending || !runtimeHealth?.ready || sessionQuery.isFetching) return;

  requestRef.current?.abort();
  const controller = new AbortController();
  const retryTurn = retryTurnRef.current;
  const clientMessageId =
   retryTurn?.content === content ? retryTurn.clientMessageId : crypto.randomUUID();
  requestRef.current = controller;
  retryTurnRef.current = null;
  setDraft("");
  sendMutation.mutate({ content, clientMessageId, controller });
 };

 const canSend =
  Boolean(runtimeHealth?.ready) &&
  !isHealthChecking &&
  !isSending &&
  !sessionQuery.isFetching &&
  !sessionQuery.isError;

 return (
  <Card variant="section" padding="none" className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
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
        {modeLabels[activeMode]}
       </Badge>
       {session && !session.memoryEnabled ? (
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
      onClick={() => createConversationMutation.mutate()}
      disabled={isNavigationLocked || createConversationMutation.isPending}
     >
      <MessageSquarePlus />
     </Button>
     <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("history.open")}
      onClick={() => setIsHistoryOpen(true)}
      disabled={isNavigationLocked}
     >
      <History />
     </Button>
     <AiConversationRuntimeMenu
      runtimeKeys={runtimeKeys}
      runtimeKeyId={runtimeKeyId}
      runtimeHealth={runtimeHealth}
      isRuntimeLoading={isRuntimeLoading}
      isHealthChecking={isHealthChecking}
      runtimeLoadError={runtimeLoadError}
      onSelectRuntime={selectRuntimeKey}
      onRecheck={() => void runtimeHealthQuery.refetch()}
     />
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
       <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("actions.more")}
        disabled={!conversation || isNavigationLocked}
       >
        <MoreHorizontal />
       </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" width="md">
       <DropdownMenuItem
        onSelect={() => {
         settingsMutation.reset();
         setIsSetupOpen(true);
        }}
        disabled={!currentSettings}
       >
        <Settings2 />
        {t("actions.setup")}
       </DropdownMenuItem>
       <DropdownMenuCheckboxItem
        checked={conversation?.memoryPolicy !== "disabled"}
        onCheckedChange={(checked) => memoryPolicyMutation.mutate(checked === true)}
        disabled={memoryPolicyMutation.isPending}
       >
        {t("memory.useLongTerm")}
       </DropdownMenuCheckboxItem>
       <DropdownMenuSeparator />
       <DropdownMenuItem
        onSelect={() => {
         if (conversation) setArchiveTarget({ id: conversation.id, title: currentTitle });
        }}
       >
        <Archive />
        {t("history.archive")}
       </DropdownMenuItem>
      </DropdownMenuContent>
     </DropdownMenu>
    </div>
   </div>

   <div
    ref={messageViewportRef}
    className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-bg-subtle px-3 py-4 sm:px-5"
    role="log"
    aria-live="polite"
    aria-relevant="additions text"
   >
    {sessionQuery.isPending ? (
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
     />
    ) : null}
   </div>

   {visibleError ? (
    <div className="shrink-0 border-t border-border-default px-3 py-2 sm:px-4" role="alert">
     <Typography variant="bodySmall" tone="danger">
      {visibleError}
     </Typography>
    </div>
   ) : null}

   <form
    className="grid shrink-0 gap-2 border-t border-border-default bg-surface px-3 py-3 sm:px-4"
    onSubmit={(event) => {
     event.preventDefault();
     send();
    }}
   >
    <Label htmlFor="ai-conversation-message" className="sr-only">
     {t("message.label")}
    </Label>
    <div className="flex items-end gap-2">
     <Textarea
      id="ai-conversation-message"
      value={draft}
      onChange={(event) => updateDraft(event.target.value)}
      onKeyDown={(event) => {
       if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        send();
       }
      }}
      rows={1}
      maxLength={6000}
      disabled={isSending || sessionQuery.isError}
      placeholder={t("message.placeholder")}
      className="min-h-11 max-h-40 flex-1"
     />
     <Button
      type="submit"
      size="icon-round"
      disabled={!draft.trim() || !canSend}
      aria-label={isSending ? t("actions.sending") : t("actions.send")}
     >
      <Send />
     </Button>
    </div>
    <Typography variant="caption" tone="muted">
     {t("message.hint")}
    </Typography>
   </form>

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
    onSelect={selectConversation}
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
  </Card>
 );
}

function ArchiveConversationDialog({
 target,
 isArchiving,
 error,
 onOpenChange,
 onConfirm,
}: {
 target: ArchiveTarget;
 isArchiving: boolean;
 error: string | null;
 onOpenChange: (open: boolean) => void;
 onConfirm: () => void;
}) {
 const t = useTranslations("AiConversation");
 return (
  <Dialog open onOpenChange={onOpenChange}>
   <DialogContent size="sm">
    <DialogHeader>
     <DialogTitle>{t("history.archiveTitle")}</DialogTitle>
     <DialogDescription>{t("history.archiveDescription", { title: target.title })}</DialogDescription>
    </DialogHeader>
    {error ? (
     <DialogBody>
      <Typography as="p" variant="bodySmall" tone="danger" role="alert">
       {error}
      </Typography>
     </DialogBody>
    ) : null}
    <DialogFooter>
     <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isArchiving}>
      {t("actions.cancel")}
     </Button>
     <Button type="button" variant="warning" onClick={onConfirm} disabled={isArchiving}>
      {isArchiving ? t("history.archiving") : t("history.archiveConfirm")}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}

function ConversationSettingsDialog({
 initialSettings,
 isSaving,
 saveError,
 onOpenChange,
 onSave,
}: {
 initialSettings: AiConversationSettingsUpdate;
 isSaving: boolean;
 saveError: string | null;
 onOpenChange: (open: boolean) => void;
 onSave: (settings: AiConversationSettingsUpdate) => void;
}) {
 const t = useTranslations("AiConversation");
 const modeOptions = [
  { value: aiConversationModeSchema.enum.natural, label: t("modes.natural") },
  {
   value: aiConversationModeSchema.enum["speaking-practice"],
   label: t("modes.speakingPractice"),
  },
  {
   value: aiConversationModeSchema.enum["grammar-coach"],
   label: t("modes.grammarCoach"),
  },
  {
   value: aiConversationModeSchema.enum["hskk-practice"],
   label: t("modes.hskkPractice"),
  },
 ];
 const levelOptions = [
  { value: aiConversationLearnerLevelSchema.enum.beginner, label: t("levels.beginner") },
  { value: aiConversationLearnerLevelSchema.enum.intermediate, label: t("levels.intermediate") },
  { value: aiConversationLearnerLevelSchema.enum.advanced, label: t("levels.advanced") },
 ];
 const correctionOptions = [
  { value: aiConversationCorrectionStyleSchema.enum.light, label: t("corrections.light") },
  { value: aiConversationCorrectionStyleSchema.enum.balanced, label: t("corrections.balanced") },
  { value: aiConversationCorrectionStyleSchema.enum.strict, label: t("corrections.strict") },
 ];
 const replyModeOptions = [
  { value: aiConversationReplyModeSchema.enum.adaptive, label: t("replyModes.adaptive") },
  { value: aiConversationReplyModeSchema.enum.chinese, label: t("replyModes.chinese") },
  { value: aiConversationReplyModeSchema.enum.bilingual, label: t("replyModes.bilingual") },
 ];
 const form = useAppForm({
  defaultValues: initialSettings,
  validators: { onSubmit: aiConversationSettingsUpdateSchema },
  onSubmit: ({ value }) => {
   onSave(value);
  },
 });

 return (
  <Dialog open onOpenChange={onOpenChange}>
   <DialogContent size="lg">
    <DialogHeader>
     <DialogTitle>{t("setup.title")}</DialogTitle>
     <DialogDescription>{t("setup.description")}</DialogDescription>
    </DialogHeader>
    <form
     onSubmit={(event) => {
      event.preventDefault();
      void form.handleSubmit();
     }}
    >
     <DialogBody className="grid gap-5 md:grid-cols-2">
      <form.AppField name="mode">
       {(field) => <field.Select label={t("setup.mode")} options={modeOptions} required />}
      </form.AppField>
      <form.AppField name="learnerLevel">
       {(field) => <field.Select label={t("setup.learnerLevel")} options={levelOptions} required />}
      </form.AppField>
      <form.AppField name="correctionStyle">
       {(field) => (
        <field.Select label={t("setup.correctionStyle")} options={correctionOptions} required />
       )}
      </form.AppField>
      <form.AppField name="replyMode">
       {(field) => (
        <field.Select label={t("setup.replyMode")} options={replyModeOptions} required />
       )}
      </form.AppField>
      {saveError ? (
       <div className="md:col-span-2">
        <Typography variant="bodySmall" tone="danger">
         {saveError}
        </Typography>
       </div>
      ) : null}
     </DialogBody>
     <DialogFooter>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
       {t("actions.cancel")}
      </Button>
      <Button type="submit" disabled={isSaving}>
       {isSaving ? t("actions.saving") : t("actions.save")}
      </Button>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
