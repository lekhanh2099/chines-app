"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { RefreshCcw, RotateCcw, Send, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { fetchManagedApiKeys } from "@/features/settings/api-key-manager.client";
import type { ApiKeysResponse } from "@/features/settings/api-key-manager.schema";
import { Link } from "@/i18n/navigation";
import { recordAiUsageEvent } from "@/lib/ai-usage.client";

import {
 ensureAiConversationSession,
 fetchAiConversationRuntimeHealth,
 fetchAiConversationSession,
 sendPersistedAiConversationMessage,
} from "./ai-conversation-api";
import {
 AiConversationMessageBubble,
 AiConversationTypingBubble,
} from "./AiConversationMessageBubble";
import {
 saveAiConversationProfile,
 useAiConversationProfile,
} from "./ai-conversation-profile.client";
import type { AiConversationSession } from "./ai-conversation-session.schemas";
import {
 aiConversationCorrectionStyleSchema,
 aiConversationLearnerLevelSchema,
 aiConversationPersonaSchema,
 aiConversationProfileSchema,
 aiConversationReplyModeSchema,
 DEFAULT_AI_CONVERSATION_PROFILE,
 type AiConversationMessage,
 type AiConversationProfile,
} from "./ai-conversation.schemas";

const AUTO_RUNTIME_KEY_ID = "auto";
const RUNTIME_KEY_STORAGE_KEY = "hanzihome.ai-conversation.runtime-key.v1";
const SESSION_QUERY_KEY = ["hanzihome", "ai-conversation", "session"];
type ManagedApiKey = ApiKeysResponse["keys"][number];
type RetryTurn = { clientMessageId: string; content: string };

export function AiConversationWorkspace() {
 const t = useTranslations("AiConversation");
 const queryClient = useQueryClient();
 const profile = useAiConversationProfile();
 const [isSetupOpen, setIsSetupOpen] = useState(false);
 const [draft, setDraft] = useState("");
 const [runtimeKeys, setRuntimeKeys] = useState<ManagedApiKey[]>([]);
 const [runtimeKeyId, setRuntimeKeyId] = useState(AUTO_RUNTIME_KEY_ID);
 const [isRuntimeLoading, setIsRuntimeLoading] = useState(true);
 const [runtimeLoadError, setRuntimeLoadError] = useState(false);
 const requestRef = useRef<AbortController | null>(null);
 const retryTurnRef = useRef<RetryTurn | null>(null);
 const messageViewportRef = useRef<HTMLDivElement | null>(null);
 const sessionQuery = useQuery({
  queryKey: SESSION_QUERY_KEY,
  queryFn: ({ signal }) => fetchAiConversationSession({ signal }),
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
   if (!conversation) {
    throw new Error(t("message.sendError"));
   }

   const turn = await sendPersistedAiConversationMessage(
    conversation.id,
    {
     clientMessageId,
     content,
     profile,
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
    conversation: session.conversation,
    messages: [...retainedMessages, turn.userMessage, turn.assistantMessage].sort(
     (left, right) => left.seq - right.seq,
    ),
   };
   queryClient.setQueryData(SESSION_QUERY_KEY, nextSession);
   void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
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
   if (requestRef.current === variables.controller) {
    requestRef.current = null;
   }
  },
 });
 const runtimeHealth = runtimeHealthQuery.data ?? null;
 const isHealthChecking = runtimeHealthQuery.isFetching;
 const isSending = sendMutation.isPending;
 const persistedMessages = sessionQuery.data?.messages ?? [];
 const personaLabels: Record<AiConversationProfile["persona"], string> = {
  tutor: t("personas.tutor"),
  friend: t("personas.friend"),
  "hsk-examiner": t("personas.hskExaminer"),
  "grammar-coach": t("personas.grammarCoach"),
 };
 const levelLabels: Record<AiConversationProfile["learnerLevel"], string> = {
  beginner: t("levels.beginner"),
  intermediate: t("levels.intermediate"),
  advanced: t("levels.advanced"),
 };
 const greeting: AiConversationMessage = {
  role: "assistant",
  content: t("greeting", {
   name: profile.displayName,
   role: personaLabels[profile.persona],
  }),
 };
 const renderedMessages =
  persistedMessages.length > 0
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
 const profileAvatar = profile.displayName.trim().slice(0, 1) || "AI";
 const sessionError = sessionQuery.error instanceof Error ? sessionQuery.error.message : null;
 const sendError = sendMutation.error instanceof Error ? sendMutation.error.message : null;
 const visibleError = sendError || sessionError;

 useEffect(() => () => requestRef.current?.abort(), []);

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
 }, [isSending, persistedMessages.length]);

 const saveProfile = (nextProfile: AiConversationProfile) => {
  saveAiConversationProfile(nextProfile);
  setIsSetupOpen(false);
 };

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
  sendMutation.mutate({
   content,
   clientMessageId,
   controller,
  });
 };

 const runtimeNotice = runtimeLoadError
  ? t("runtime.loadError")
  : runtimeKeys.length === 0 && !isRuntimeLoading
    ? t("runtime.empty")
    : null;
 const healthMessage = isHealthChecking
  ? t("runtime.healthChecking")
  : runtimeHealth?.ready && runtimeHealth.provider && runtimeHealth.model
    ? t("runtime.healthReady", {
       provider: runtimeHealth.provider,
       model: runtimeHealth.model,
      })
    : runtimeHealth?.code === "missing-system-key"
      ? t("runtime.health.missingSystemKey")
      : runtimeHealth?.code === "invalid-key"
        ? t("runtime.health.invalidKey")
        : runtimeHealth?.code === "quota-exhausted"
          ? t("runtime.health.quotaExhausted")
          : runtimeHealth?.code === "key-unavailable"
            ? t("runtime.health.keyUnavailable")
            : runtimeHealth?.code === "provider-unavailable"
              ? t("runtime.health.providerUnavailable")
              : t("runtime.health.networkError");
 const canSend =
  Boolean(runtimeHealth?.ready) &&
  !isHealthChecking &&
  !isSending &&
  !sessionQuery.isFetching &&
  !sessionQuery.isError;

 return (
  <div className="grid min-w-0 gap-5">
   <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div className="grid min-w-0 gap-1">
     <Typography as="h1" variant="pageTitle" weight="black">
      {t("title")}
     </Typography>
     <Typography as="p" variant="body" tone="muted">
      {t("description")}
     </Typography>
    </div>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="outline" onClick={() => setIsSetupOpen(true)}>
      <Settings2 data-icon="inline-start" />
      {t("actions.setup")}
     </Button>
     <Button type="button" variant="ghost" asChild>
      <Link href="/settings?section=ai">{t("actions.apiKeys")}</Link>
     </Button>
    </div>
   </div>

   <Card variant="section" padding="none" className="min-w-0 overflow-hidden">
    <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
     <div className="flex min-w-0 items-center gap-3">
      <Avatar size="md" shape="rounded" tone="accent" aria-hidden="true">
       <AvatarFallback>{profileAvatar}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 gap-1">
       <div className="flex flex-wrap items-center gap-2">
        <Typography as="h2" variant="cardTitle" weight="bold">
         {profile.displayName}
        </Typography>
        <Badge variant="accent" casing="natural">
         {personaLabels[profile.persona]}
        </Badge>
        <Badge variant="default" casing="natural">
         {levelLabels[profile.learnerLevel]}
        </Badge>
       </div>
       <Typography variant="caption" tone="muted" clamp="one">
        {profile.interests || t("fallbackInterest")}
       </Typography>
      </div>
     </div>
    </div>

    <div className="grid gap-2 border-t border-border-default px-3 py-3 sm:px-4 lg:grid-cols-[minmax(16rem,24rem)_minmax(0,1fr)] lg:items-end">
     <div className="grid gap-1.5">
      <Label htmlFor="ai-conversation-runtime" variant="label" weight="semibold">
       {t("runtime.label")}
      </Label>
      <Select value={runtimeKeyId} onValueChange={selectRuntimeKey} disabled={isRuntimeLoading}>
       <SelectTrigger id="ai-conversation-runtime" width="full">
        <SelectValue placeholder={t("runtime.loading")} />
       </SelectTrigger>
       <SelectContent align="start">
        <SelectItem value={AUTO_RUNTIME_KEY_ID}>{t("runtime.auto")}</SelectItem>
        {runtimeKeys.map((key) => (
         <SelectItem key={key.id} value={key.id}>
          {`${key.providerLabel} · ${key.label} · ${key.defaultModel || t("runtime.modelFallback")}`}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>
     <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Badge variant={runtimeHealth?.ready ? "success" : isHealthChecking ? "default" : "warning"}>
       {healthMessage}
      </Badge>
      <Button
       type="button"
       variant="ghost"
       size="icon-toolbar"
       aria-label={t("runtime.recheck")}
       onClick={() => void runtimeHealthQuery.refetch()}
       disabled={isHealthChecking || isRuntimeLoading}
      >
       <RefreshCcw />
      </Button>
     </div>
     {runtimeNotice ? (
      <Typography as="p" variant="caption" tone={runtimeLoadError ? "warning" : "muted"}>
       {runtimeNotice}
      </Typography>
     ) : null}
    </div>

    <div
     ref={messageViewportRef}
     className="flex min-h-96 max-h-[62dvh] flex-col gap-2 overflow-y-auto bg-surface-muted px-3 py-4 sm:px-4"
     role="log"
     aria-live="polite"
     aria-relevant="additions text"
    >
     {renderedMessages.map(({ key, message }) => (
      <AiConversationMessageBubble
       key={key}
       message={message}
       assistantName={profile.displayName}
      />
     ))}
     {pendingMessage ? (
      <AiConversationMessageBubble
       key={pendingMessage.key}
       message={pendingMessage.message}
       assistantName={profile.displayName}
      />
     ) : null}
     {isSending ? (
      <AiConversationTypingBubble
       assistantName={profile.displayName}
       label={t("message.replying", { name: profile.displayName })}
      />
     ) : null}
    </div>

    {visibleError ? (
     <div className="border-t border-border-default px-3 py-2 sm:px-4">
      <Typography variant="bodySmall" tone="danger">
       {visibleError}
      </Typography>
     </div>
    ) : null}

    <form
     className="grid gap-2 border-t border-border-default bg-surface px-3 py-3 sm:px-4"
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
       disabled={isSending}
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
   </Card>

   {isSetupOpen ? (
    <PersonaSetupDialog
     initialProfile={profile}
     onOpenChange={setIsSetupOpen}
     onSave={saveProfile}
    />
   ) : null}
  </div>
 );
}

function PersonaSetupDialog({
 initialProfile,
 onOpenChange,
 onSave,
}: {
 initialProfile: AiConversationProfile;
 onOpenChange: (open: boolean) => void;
 onSave: (profile: AiConversationProfile) => void;
}) {
 const t = useTranslations("AiConversation");
 const personaOptions = [
  { value: aiConversationPersonaSchema.enum.tutor, label: t("personas.tutor") },
  { value: aiConversationPersonaSchema.enum.friend, label: t("personas.friend") },
  { value: aiConversationPersonaSchema.enum["hsk-examiner"], label: t("personas.hskExaminer") },
  { value: aiConversationPersonaSchema.enum["grammar-coach"], label: t("personas.grammarCoach") },
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
  defaultValues: initialProfile,
  validators: { onSubmit: aiConversationProfileSchema },
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
      <form.AppField name="persona">
       {(field) => <field.Select label={t("setup.persona")} options={personaOptions} required />}
      </form.AppField>
      <form.AppField name="displayName">
       {(field) => (
        <field.TextField
         label={t("setup.displayName")}
         required
         maxLength={40}
         placeholder={t("setup.displayNamePlaceholder")}
        />
       )}
      </form.AppField>
      <form.AppField name="learnerLevel">
       {(field) => <field.Select label={t("setup.learnerLevel")} options={levelOptions} required />}
      </form.AppField>
      <form.AppField name="correctionStyle">
       {(field) => (
        <field.Select label={t("setup.correctionStyle")} options={correctionOptions} required />
       )}
      </form.AppField>
      <div className="md:col-span-2">
       <form.AppField name="replyMode">
        {(field) => (
         <field.Select label={t("setup.replyMode")} options={replyModeOptions} required />
        )}
       </form.AppField>
      </div>
      <div className="md:col-span-2">
       <form.AppField name="interests">
        {(field) => (
         <field.Textarea
          label={t("setup.interests")}
          maxLength={300}
          rows={3}
          placeholder={t("setup.interestsPlaceholder")}
         />
        )}
       </form.AppField>
      </div>
      <div className="md:col-span-2">
       <form.AppField name="characterNotes">
        {(field) => (
         <field.Textarea
          label={t("setup.characterNotes")}
          maxLength={600}
          rows={3}
          placeholder={t("setup.characterNotesPlaceholder")}
         />
        )}
       </form.AppField>
      </div>
      <div className="md:col-span-2">
       <form.AppField name="memoryNotes">
        {(field) => (
         <field.Textarea
          label={t("setup.memoryNotes")}
          description={t("setup.memoryNotesDescription")}
          maxLength={1200}
          rows={4}
          placeholder={t("setup.memoryNotesPlaceholder")}
         />
        )}
       </form.AppField>
      </div>
     </DialogBody>
     <DialogFooter>
      <Button
       type="button"
       variant="ghost"
       onClick={() => form.reset(DEFAULT_AI_CONVERSATION_PROFILE)}
      >
       <RotateCcw data-icon="inline-start" />
       {t("actions.defaults")}
      </Button>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
       {t("actions.cancel")}
      </Button>
      <Button type="submit">{t("actions.save")}</Button>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
