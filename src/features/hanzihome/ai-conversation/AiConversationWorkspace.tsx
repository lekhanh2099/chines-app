"use client";

import { useEffect, useRef, useState } from "react";
import {
 Bot,
 RefreshCcw,
 RotateCcw,
 Send,
 Settings2,
 Sparkles,
 Trash2,
 UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { useAppForm } from "@/components/form";
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
import { IconTile } from "@/components/ui/icon-tile";
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
 fetchAiConversationRuntimeHealth,
 sendAiConversationMessage,
} from "./ai-conversation-api";
import {
 saveAiConversationProfile,
 useAiConversationProfile,
} from "./ai-conversation-profile.client";
import {
 aiConversationCorrectionStyleSchema,
 aiConversationLearnerLevelSchema,
 aiConversationPersonaSchema,
 aiConversationProfileSchema,
 aiConversationReplyModeSchema,
 DEFAULT_AI_CONVERSATION_PROFILE,
 type AiConversationMessage,
 type AiConversationProfile,
 type AiConversationRuntimeHealth,
} from "./ai-conversation.schemas";

const AUTO_RUNTIME_KEY_ID = "auto";
const RUNTIME_KEY_STORAGE_KEY = "hanzihome.ai-conversation.runtime-key.v1";
type ManagedApiKey = ApiKeysResponse["keys"][number];

export function AiConversationWorkspace() {
 const t = useTranslations("AiConversation");
 const profile = useAiConversationProfile();
 const [isSetupOpen, setIsSetupOpen] = useState(false);
 const [messages, setMessages] = useState<AiConversationMessage[]>([]);
 const [draft, setDraft] = useState("");
 const [isSending, setIsSending] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [lastRuntime, setLastRuntime] = useState<{ provider: string; model: string } | null>(null);
 const [runtimeKeys, setRuntimeKeys] = useState<ManagedApiKey[]>([]);
 const [runtimeKeyId, setRuntimeKeyId] = useState(AUTO_RUNTIME_KEY_ID);
 const [isRuntimeLoading, setIsRuntimeLoading] = useState(true);
 const [runtimeLoadError, setRuntimeLoadError] = useState(false);
 const [runtimeHealth, setRuntimeHealth] = useState<AiConversationRuntimeHealth | null>(null);
 const [isHealthChecking, setIsHealthChecking] = useState(true);
 const [healthRefreshId, setHealthRefreshId] = useState(0);
 const requestRef = useRef<AbortController | null>(null);
 const messageViewportRef = useRef<HTMLDivElement | null>(null);
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
 const displayMessages = [greeting, ...messages];

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
  if (isRuntimeLoading) return;

  const controller = new AbortController();
  setIsHealthChecking(true);
  setRuntimeHealth(null);

  void fetchAiConversationRuntimeHealth({
   ...(runtimeKeyId !== AUTO_RUNTIME_KEY_ID ? { apiKeyId: runtimeKeyId } : {}),
   signal: controller.signal,
  })
   .then((health) => {
    if (!controller.signal.aborted) setRuntimeHealth(health);
   })
   .catch(() => {
    if (!controller.signal.aborted) {
     setRuntimeHealth({
      ready: false,
      code: "network-error",
      provider: null,
      model: null,
      source: null,
     });
    }
   })
   .finally(() => {
    if (!controller.signal.aborted) setIsHealthChecking(false);
   });

  return () => controller.abort();
 }, [healthRefreshId, isRuntimeLoading, runtimeKeyId]);

 useEffect(() => {
  const viewport = messageViewportRef.current;
  if (!viewport) return;
  viewport.scrollTop = viewport.scrollHeight;
 }, [isSending, messages]);

 const clearSession = () => {
  requestRef.current?.abort();
  setMessages([]);
  setDraft("");
  setError(null);
  setLastRuntime(null);
 };

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
  setError(null);
  if (nextValue === AUTO_RUNTIME_KEY_ID) {
   window.localStorage.removeItem(RUNTIME_KEY_STORAGE_KEY);
  } else {
   window.localStorage.setItem(RUNTIME_KEY_STORAGE_KEY, nextValue);
  }
 };

 const send = async () => {
  const content = draft.normalize("NFC").trim();
  if (!content || isSending || !runtimeHealth?.ready) return;

  const userMessage: AiConversationMessage = { role: "user", content };
  const nextMessages = [...messages, userMessage];
  setMessages(nextMessages);
  setDraft("");
  setError(null);
  setIsSending(true);
  requestRef.current?.abort();
  const controller = new AbortController();
  requestRef.current = controller;

  try {
   const response = await sendAiConversationMessage(nextMessages.slice(-24), profile, {
    ...(runtimeKeyId !== AUTO_RUNTIME_KEY_ID ? { apiKeyId: runtimeKeyId } : {}),
    signal: controller.signal,
   });
   setMessages((current) => [...current, { role: "assistant", content: response.message }]);
   setLastRuntime({ provider: response.provider, model: response.model });
   recordAiUsageEvent({
    apiKeyId: response.apiKeyId,
    provider: response.provider,
    model: response.model,
    usage: response.usage,
   });
  } catch (caught) {
   if (controller.signal.aborted) return;
   setError(caught instanceof Error ? caught.message : t("message.sendError"));
   setHealthRefreshId((current) => current + 1);
  } finally {
   if (requestRef.current === controller) {
    requestRef.current = null;
    setIsSending(false);
   }
  }
 };

 const runtimeDescription = runtimeLoadError
  ? t("runtime.loadError")
  : lastRuntime
    ? t("runtime.current", { provider: lastRuntime.provider, model: lastRuntime.model })
    : runtimeKeys.length === 0 && !isRuntimeLoading
      ? t("runtime.empty")
      : t("runtime.description");
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
 const canSend = Boolean(runtimeHealth?.ready) && !isHealthChecking && !isSending;

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

   <Card variant="section" padding="md" className="grid min-w-0 gap-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
     <div className="flex min-w-0 items-center gap-3">
      <IconTile tone="accent" size="md">
       {profile.persona === "friend" ? <UserRound /> : <Bot />}
      </IconTile>
      <div className="grid min-w-0 gap-1">
       <div className="flex flex-wrap items-center gap-2">
        <Typography as="h2" variant="sectionTitle" weight="bold">
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
     <Button type="button" variant="ghost" size="sm" onClick={clearSession}>
      <Trash2 data-icon="inline-start" />
      {t("actions.clear")}
     </Button>
    </div>

    <div className="grid gap-3 border-y border-border-default py-3 lg:grid-cols-[minmax(16rem,24rem)_minmax(0,1fr)] lg:items-end">
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
     <div className="grid gap-1.5">
      <Typography as="p" variant="caption" tone={runtimeLoadError ? "warning" : "muted"}>
       {runtimeDescription}
      </Typography>
      <div className="flex flex-wrap items-center gap-2">
       <Badge variant={runtimeHealth?.ready ? "success" : isHealthChecking ? "default" : "warning"}>
        {healthMessage}
       </Badge>
       <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setHealthRefreshId((current) => current + 1)}
        disabled={isHealthChecking || isRuntimeLoading}
       >
        <RefreshCcw data-icon="inline-start" />
        {t("runtime.recheck")}
       </Button>
      </div>
     </div>
    </div>

    <div
     ref={messageViewportRef}
     className="grid min-h-80 max-h-[60dvh] content-start gap-3 overflow-y-auto rounded-xl border border-border-default bg-bg-subtle p-3 sm:p-4"
     aria-live="polite"
    >
     {displayMessages.map((message, index) => (
      <div
       key={`${message.role}-${index}`}
       className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
      >
       <div
        className={
         message.role === "user"
          ? "max-w-[min(92%,46rem)] rounded-xl bg-primary px-3 py-2 text-primary-foreground"
          : "max-w-[min(92%,46rem)] rounded-xl border border-border-default bg-bg-card px-3 py-2"
        }
       >
        <Typography as="p" variant="bodySmall" wrapping="preWrap">
         {message.content}
        </Typography>
       </div>
      </div>
     ))}
     {isSending ? (
      <div className="flex items-center gap-2 text-text-muted">
       <Sparkles className="size-4 animate-pulse" aria-hidden="true" />
       <Typography variant="caption" tone="muted">
        {t("message.replying", { name: profile.displayName })}
       </Typography>
      </div>
     ) : null}
    </div>

    {error ? (
     <Card variant="subtle" padding="sm">
      <Typography variant="bodySmall" tone="danger">
       {error}
      </Typography>
     </Card>
    ) : null}

    <form
     className="grid gap-2"
     onSubmit={(event) => {
      event.preventDefault();
      void send();
     }}
    >
     <Label htmlFor="ai-conversation-message" className="sr-only">
      {t("message.label")}
     </Label>
     <Textarea
      id="ai-conversation-message"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
       if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void send();
       }
      }}
      maxLength={6000}
      disabled={isSending}
      placeholder={t("message.placeholder")}
      className="min-h-24"
     />
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography variant="caption" tone="muted">
       {t("message.hint")}
      </Typography>
      <Button type="submit" disabled={!draft.trim() || !canSend}>
       <Send data-icon="inline-start" />
       {isSending ? t("actions.sending") : t("actions.send")}
      </Button>
     </div>
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
       {(field) => (
        <field.Select label={t("setup.learnerLevel")} options={levelOptions} required />
       )}
      </form.AppField>
      <form.AppField name="correctionStyle">
       {(field) => (
        <field.Select label={t("setup.correctionStyle")} options={correctionOptions} required />
       )}
      </form.AppField>
      <div className="md:col-span-2">
       <form.AppField name="replyMode">
        {(field) => <field.Select label={t("setup.replyMode")} options={replyModeOptions} required />}
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
