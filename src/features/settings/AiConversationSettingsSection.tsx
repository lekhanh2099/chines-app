"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
 Brain,
 CheckCircle2,
 MessageCircleMore,
 MoreHorizontal,
 Pencil,
 Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/patterns/empty-state";
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
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconTile } from "@/components/ui/icon-tile";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { deriveAiConversationRelationshipBand } from "@/features/hanzihome/ai-conversation/ai-conversation-relationship";
import {
 aiConversationCorrectionStyleSchema,
 aiConversationLearnerLevelSchema,
 aiConversationReplyModeSchema,
} from "@/features/hanzihome/ai-conversation/ai-conversation.schemas";
import { aiConversationModeSchema } from "@/features/hanzihome/ai-conversation/ai-conversation-session.schemas";

import {
 editAiConversationManagedMemory,
 fetchAiConversationManagedMemories,
 fetchAiConversationSettingsOverview,
 forgetAiConversationManagedMemory,
 resolveAiConversationManagedOpenLoop,
 updateAiConversationAccountPreferences,
} from "./ai-conversation-settings.client";
import type {
 AiConversationAccountPreferences,
 AiConversationManagedMemory,
 AiConversationSettingsOverview,
} from "./ai-conversation-settings.schema";

const OVERVIEW_QUERY_KEY = ["settings", "ai-conversation", "overview"] as const;
const MEMORIES_QUERY_KEY = ["settings", "ai-conversation", "memories"] as const;

type MemoryFilter = "all" | "global" | "character" | "open-loops";
type MemoryAction =
 | { type: "edit"; memory: AiConversationManagedMemory; draft: string }
 | { type: "forget"; memory: AiConversationManagedMemory }
 | null;

export function AiConversationSettingsSection() {
 const t = useTranslations("AiConversationSettings");
 const common = useTranslations("Common");
 const queryClient = useQueryClient();
 const [memoryManagerOpen, setMemoryManagerOpen] = useState(false);

 const overviewQuery = useQuery({
  queryKey: OVERVIEW_QUERY_KEY,
  queryFn: ({ signal }) => fetchAiConversationSettingsOverview({ signal }),
  staleTime: 30_000,
  refetchOnWindowFocus: false,
  retry: false,
 });

 const preferencesMutation = useMutation({
  retry: false,
  mutationFn: (preferences: AiConversationAccountPreferences) =>
   updateAiConversationAccountPreferences(preferences),
  onSuccess: (preferences) => {
   queryClient.setQueryData<AiConversationSettingsOverview>(OVERVIEW_QUERY_KEY, (current) =>
    current ? { ...current, preferences } : current,
   );
   toast.success(t("conversation.saved"));
  },
  onError: (error, _variables, previous) => {
   if (previous) {
    queryClient.setQueryData<AiConversationSettingsOverview>(OVERVIEW_QUERY_KEY, previous);
   }
   toast.error(error instanceof Error ? error.message : t("conversation.saveError"));
  },
  onMutate: async (preferences: AiConversationAccountPreferences) => {
   await queryClient.cancelQueries({ queryKey: OVERVIEW_QUERY_KEY });
   const previous = queryClient.getQueryData<AiConversationSettingsOverview>(OVERVIEW_QUERY_KEY);
   if (previous) {
    queryClient.setQueryData<AiConversationSettingsOverview>(OVERVIEW_QUERY_KEY, {
     ...previous,
     preferences,
    });
   }
   return previous;
  },
 });

 if (overviewQuery.isPending) {
  return (
   <Card variant="section" padding="lg">
    <div className="flex items-center gap-3">
     <Spinner />
     <Typography variant="bodySmall" tone="secondary">
      {t("loading")}
     </Typography>
    </div>
   </Card>
  );
 }

 if (overviewQuery.isError || !overviewQuery.data) {
  return (
   <Card variant="section" padding="lg" className="grid justify-items-start gap-3">
    <Typography as="h2" variant="sectionTitle" weight="bold">
     {t("title")}
    </Typography>
    <Typography as="p" variant="bodySmall" tone="danger">
     {overviewQuery.error instanceof Error ? overviewQuery.error.message : t("loadError")}
    </Typography>
    <Button variant="outline" onClick={() => void overviewQuery.refetch()}>
     {common("actions.retry")}
    </Button>
   </Card>
  );
 }

 const overview = overviewQuery.data;
 const preferences = overview.preferences;
 const characterName = overview.character?.displayName ?? t("overview.noCharacter");
 const relationshipBand = deriveAiConversationRelationshipBand(
  overview.relationship?.familiarityScore ?? null,
 );
 const relationshipLabel = t(`overview.relationshipBands.${relationshipBand}`);
 const isSavingPreferences = preferencesMutation.isPending;

 const savePreferences = (patch: Partial<AiConversationAccountPreferences>) => {
  if (preferencesMutation.isPending) return;
  preferencesMutation.mutate({ ...preferences, ...patch });
 };

 return (
  <>
   <Card variant="section" padding="lg" className="grid gap-5">
    <SectionHeading
     icon={<MessageCircleMore aria-hidden="true" />}
     title={t("title")}
     description={t("description")}
    />

    <section className="grid gap-3" aria-labelledby="ai-conversation-overview-heading">
     <Typography id="ai-conversation-overview-heading" as="h3" variant="cardTitle" weight="bold">
      {t("overview.title")}
     </Typography>
     <div className="grid gap-3 sm:grid-cols-3">
      <OverviewFact label={t("overview.character")} value={characterName} />
      <OverviewFact
       label={t("overview.relationship")}
       value={relationshipLabel}
       detail={overview.relationship?.nickname || undefined}
      />
      <OverviewFact
       label={t("overview.memory")}
       value={preferences.memoryEnabled ? t("overview.memoryOn") : t("overview.memoryOff")}
       status={preferences.memoryEnabled ? "success" : "warning"}
      />
     </div>
    </section>

    <Separator />

    <section className="grid gap-4" aria-labelledby="ai-conversation-defaults-heading">
     <div className="grid gap-1">
      <Typography id="ai-conversation-defaults-heading" as="h3" variant="cardTitle" weight="bold">
       {t("conversation.title")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("conversation.description")}
      </Typography>
     </div>

     <div className="grid gap-4 md:grid-cols-2">
      <PreferenceSelect
       id="ai-default-mode"
       label={t("conversation.defaultMode")}
       description={t("conversation.defaultModeDescription")}
       value={preferences.defaultMode}
       disabled={isSavingPreferences}
       options={[
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
       ]}
       onValueChange={(value) =>
        savePreferences({ defaultMode: aiConversationModeSchema.parse(value) })
       }
      />
      <PreferenceSelect
       id="ai-learner-level"
       label={t("conversation.learnerLevel")}
       description={t("conversation.learnerLevelDescription")}
       value={preferences.learnerLevel}
       disabled={isSavingPreferences}
       options={[
        { value: aiConversationLearnerLevelSchema.enum.beginner, label: t("levels.beginner") },
        {
         value: aiConversationLearnerLevelSchema.enum.intermediate,
         label: t("levels.intermediate"),
        },
        { value: aiConversationLearnerLevelSchema.enum.advanced, label: t("levels.advanced") },
       ]}
       onValueChange={(value) =>
        savePreferences({ learnerLevel: aiConversationLearnerLevelSchema.parse(value) })
       }
      />
      <PreferenceSelect
       id="ai-correction-style"
       label={t("conversation.correctionStyle")}
       description={t("conversation.correctionStyleDescription")}
       value={preferences.defaultCorrectionStyle}
       disabled={isSavingPreferences}
       options={[
        { value: aiConversationCorrectionStyleSchema.enum.light, label: t("corrections.light") },
        {
         value: aiConversationCorrectionStyleSchema.enum.balanced,
         label: t("corrections.balanced"),
        },
        { value: aiConversationCorrectionStyleSchema.enum.strict, label: t("corrections.strict") },
       ]}
       onValueChange={(value) =>
        savePreferences({
         defaultCorrectionStyle: aiConversationCorrectionStyleSchema.parse(value),
        })
       }
      />
      <PreferenceSelect
       id="ai-reply-mode"
       label={t("conversation.replyMode")}
       description={t("conversation.replyModeDescription")}
       value={preferences.defaultReplyMode}
       disabled={isSavingPreferences}
       options={[
        { value: aiConversationReplyModeSchema.enum.adaptive, label: t("replyModes.adaptive") },
        { value: aiConversationReplyModeSchema.enum.chinese, label: t("replyModes.chinese") },
        {
         value: aiConversationReplyModeSchema.enum.bilingual,
         label: t("replyModes.bilingual"),
        },
       ]}
       onValueChange={(value) =>
        savePreferences({ defaultReplyMode: aiConversationReplyModeSchema.parse(value) })
       }
      />
     </div>
    </section>

    <Separator />

    <section className="grid gap-4" aria-labelledby="ai-memory-relationship-heading">
     <div className="grid gap-1">
      <Typography id="ai-memory-relationship-heading" as="h3" variant="cardTitle" weight="bold">
       {t("memory.title")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("memory.description")}
      </Typography>
     </div>

     <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid min-w-0 gap-1">
       <Label htmlFor="ai-account-memory" variant="label" tone="default" weight="bold">
        {t("memory.enabledLabel")}
       </Label>
       <Typography
        as="p"
        id="ai-account-memory-description"
        variant="bodySmall"
        tone="muted"
        leading="standard"
       >
        {t("memory.enabledDescription")}
       </Typography>
      </div>
      <Switch
       id="ai-account-memory"
       checked={preferences.memoryEnabled}
       onCheckedChange={(checked) => savePreferences({ memoryEnabled: checked })}
       disabled={isSavingPreferences}
       aria-describedby="ai-account-memory-description"
       tone="accent"
      />
     </div>

     <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid min-w-0 gap-1">
       <Typography weight="semibold">
        {t("memory.relationshipWith", { name: characterName })}
       </Typography>
       <Typography as="p" variant="bodySmall" tone="muted">
        {t("memory.relationshipDescription", { relationship: relationshipLabel })}
       </Typography>
      </div>
      <Button variant="outline" onClick={() => setMemoryManagerOpen(true)}>
       <Brain data-icon="inline-start" />
       {t("memory.manage")}
      </Button>
     </div>
    </section>
   </Card>

   <MemoryManagerDialog
    open={memoryManagerOpen}
    currentCharacterId={overview.character?.id ?? null}
    currentCharacterName={characterName}
    onOpenChange={setMemoryManagerOpen}
   />
  </>
 );
}

function SectionHeading({
 icon,
 title,
 description,
}: {
 icon: ReactNode;
 title: string;
 description: string;
}) {
 return (
  <div className="flex min-w-0 items-start gap-3">
   <IconTile tone="accent" size="sm">
    {icon}
   </IconTile>
   <div className="grid min-w-0 gap-1">
    <Typography as="h2" variant="sectionTitle" weight="bold">
     {title}
    </Typography>
    <Typography as="p" tone="secondary" leading="standard">
     {description}
    </Typography>
   </div>
  </div>
 );
}

function OverviewFact({
 label,
 value,
 detail,
 status,
}: {
 label: string;
 value: string;
 detail?: string;
 status?: "success" | "warning";
}) {
 return (
  <div className="grid min-w-0 gap-1">
   <Typography variant="caption" tone="muted">
    {label}
   </Typography>
   {status ? (
    <div>
     <Badge variant={status} size="sm" casing="natural">
      {value}
     </Badge>
    </div>
   ) : (
    <Typography weight="semibold" clamp="one">
     {value}
    </Typography>
   )}
   {detail ? (
    <Typography variant="caption" tone="muted" clamp="one">
     {detail}
    </Typography>
   ) : null}
  </div>
 );
}

function PreferenceSelect({
 id,
 label,
 description,
 value,
 options,
 disabled,
 onValueChange,
}: {
 id: string;
 label: string;
 description: string;
 value: string;
 options: ReadonlyArray<{ value: string; label: string }>;
 disabled: boolean;
 onValueChange: (value: string) => void;
}) {
 const descriptionId = `${id}-description`;
 return (
  <div className="grid min-w-0 gap-2">
   <div className="grid gap-1">
    <Label htmlFor={id} variant="label" tone="default" weight="semibold">
     {label}
    </Label>
    <Typography as="p" id={descriptionId} variant="caption" tone="muted">
     {description}
    </Typography>
   </div>
   <Select value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger id={id} width="full" aria-describedby={descriptionId}>
     <SelectValue />
    </SelectTrigger>
    <SelectContent align="start">
     {options.map((option) => (
      <SelectItem key={option.value} value={option.value}>
       {option.label}
      </SelectItem>
     ))}
    </SelectContent>
   </Select>
  </div>
 );
}

function MemoryManagerDialog({
 open,
 currentCharacterId,
 currentCharacterName,
 onOpenChange,
}: {
 open: boolean;
 currentCharacterId: string | null;
 currentCharacterName: string;
 onOpenChange: (open: boolean) => void;
}) {
 const t = useTranslations("AiConversationSettings");
 const common = useTranslations("Common");
 const locale = useLocale();
 const queryClient = useQueryClient();
 const [filter, setFilter] = useState<MemoryFilter>("all");
 const [action, setAction] = useState<MemoryAction>(null);

 const memoriesQuery = useQuery({
  queryKey: MEMORIES_QUERY_KEY,
  queryFn: ({ signal }) => fetchAiConversationManagedMemories({ signal }),
  enabled: open,
  staleTime: 15_000,
  refetchOnWindowFocus: false,
  retry: false,
 });

 const editMutation = useMutation({
  retry: false,
  mutationFn: (input: { memoryId: string; content: string }) =>
   editAiConversationManagedMemory(input),
  onSuccess: (updatedMemory) => {
   queryClient.setQueryData<AiConversationManagedMemory[]>(MEMORIES_QUERY_KEY, (current) =>
    (current ?? []).map((memory) => (memory.id === updatedMemory.id ? updatedMemory : memory)),
   );
   setAction(null);
   toast.success(t("memory.editSaved"));
  },
  onError: (error) => {
   toast.error(error instanceof Error ? error.message : t("memory.actionError"));
  },
 });

 const resolveMutation = useMutation({
  retry: false,
  mutationFn: (memoryId: string) => resolveAiConversationManagedOpenLoop(memoryId),
  onSuccess: (result) => {
   queryClient.setQueryData<AiConversationManagedMemory[]>(MEMORIES_QUERY_KEY, (current) =>
    (current ?? []).filter((memory) => memory.id !== result.memoryId),
   );
   toast.success(t("memory.resolved"));
  },
  onError: (error) => {
   toast.error(error instanceof Error ? error.message : t("memory.actionError"));
  },
 });

 const forgetMutation = useMutation({
  retry: false,
  mutationFn: (memoryId: string) => forgetAiConversationManagedMemory(memoryId),
  onSuccess: (result) => {
   queryClient.setQueryData<AiConversationManagedMemory[]>(MEMORIES_QUERY_KEY, (current) =>
    (current ?? []).filter((memory) => memory.id !== result.memoryId),
   );
   setAction(null);
   toast.success(t("memory.forgotten"));
  },
  onError: (error) => {
   toast.error(error instanceof Error ? error.message : t("memory.actionError"));
  },
 });

 const isMutating = editMutation.isPending || resolveMutation.isPending || forgetMutation.isPending;
 const memories = memoriesQuery.data ?? [];
 const filteredMemories = memories.filter((memory) => {
  if (filter === "global") return memory.characterId === null;
  if (filter === "character") {
   return Boolean(currentCharacterId && memory.characterId === currentCharacterId);
  }
  if (filter === "open-loops") return memory.kind === "open_loop";
  return true;
 });
 const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
 const kindLabels: Record<AiConversationManagedMemory["kind"], string> = {
  fact: t("memory.kinds.fact"),
  preference: t("memory.kinds.preference"),
  habit: t("memory.kinds.habit"),
  goal: t("memory.kinds.goal"),
  episode: t("memory.kinds.episode"),
  open_loop: t("memory.kinds.openLoop"),
  inside_joke: t("memory.kinds.insideJoke"),
 };

 const closeOrReset = (nextOpen: boolean) => {
  if (!nextOpen && isMutating) return;
  if (!nextOpen) setAction(null);
  onOpenChange(nextOpen);
 };

 if (action?.type === "edit") {
  return (
   <Dialog open={open} onOpenChange={closeOrReset}>
    <DialogContent size="lg">
     <DialogHeader>
      <DialogTitle>{t("memory.editTitle")}</DialogTitle>
      <DialogDescription>{t("memory.editDescription")}</DialogDescription>
     </DialogHeader>
     <DialogBody className="grid gap-3">
      <Label htmlFor="ai-memory-edit" variant="label" tone="default" weight="semibold">
       {t("memory.contentLabel")}
      </Label>
      <Textarea
       id="ai-memory-edit"
       rows={6}
       maxLength={600}
       value={action.draft}
       disabled={editMutation.isPending}
       onChange={(event) =>
        setAction({ type: "edit", memory: action.memory, draft: event.target.value })
       }
      />
     </DialogBody>
     <DialogFooter>
      <Button variant="outline" onClick={() => setAction(null)} disabled={editMutation.isPending}>
       {common("actions.cancel")}
      </Button>
      <Button
       onClick={() =>
        editMutation.mutate({ memoryId: action.memory.id, content: action.draft.trim() })
       }
       disabled={!action.draft.trim() || editMutation.isPending}
      >
       {editMutation.isPending ? (
        <Spinner data-icon="inline-start" />
       ) : (
        <Pencil data-icon="inline-start" />
       )}
       {t("memory.saveEdit")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  );
 }

 if (action?.type === "forget") {
  return (
   <Dialog open={open} onOpenChange={closeOrReset}>
    <DialogContent size="sm">
     <DialogHeader>
      <DialogTitle>{t("memory.forgetTitle")}</DialogTitle>
      <DialogDescription>{t("memory.forgetDescription")}</DialogDescription>
     </DialogHeader>
     <DialogBody>
      <Typography as="p" variant="bodySmall" leading="standard">
       {action.memory.content}
      </Typography>
     </DialogBody>
     <DialogFooter>
      <Button variant="outline" onClick={() => setAction(null)} disabled={forgetMutation.isPending}>
       {common("actions.cancel")}
      </Button>
      <Button
       variant="destructive"
       onClick={() => forgetMutation.mutate(action.memory.id)}
       disabled={forgetMutation.isPending}
      >
       {forgetMutation.isPending ? (
        <Spinner data-icon="inline-start" />
       ) : (
        <Trash2 data-icon="inline-start" />
       )}
       {t("memory.forgetConfirm")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  );
 }

 return (
  <Dialog open={open} onOpenChange={closeOrReset}>
   <DialogContent size="lg">
    <DialogHeader>
     <DialogTitle>{t("memory.managerTitle")}</DialogTitle>
     <DialogDescription>{t("memory.managerDescription")}</DialogDescription>
    </DialogHeader>
    <DialogBody className="grid gap-4">
     <SegmentedControl<MemoryFilter>
      value={filter}
      density="touch"
      layout="wrap"
      aria-label={t("memory.filtersAria")}
      items={[
       { key: "all", label: t("memory.filters.all") },
       { key: "global", label: t("memory.filters.global") },
       {
        key: "character",
        label: t("memory.filters.character", { name: currentCharacterName }),
        disabled: !currentCharacterId,
       },
       { key: "open-loops", label: t("memory.filters.openLoops") },
      ]}
      onChange={setFilter}
     />

     {memoriesQuery.isPending ? (
      <div className="flex items-center gap-3 py-4">
       <Spinner />
       <Typography variant="bodySmall" tone="secondary">
        {t("memory.loading")}
       </Typography>
      </div>
     ) : memoriesQuery.isError ? (
      <div className="grid justify-items-start gap-3">
       <Typography as="p" variant="bodySmall" tone="danger">
        {memoriesQuery.error instanceof Error ? memoriesQuery.error.message : t("memory.loadError")}
       </Typography>
       <Button variant="outline" onClick={() => void memoriesQuery.refetch()}>
        {common("actions.retry")}
       </Button>
      </div>
     ) : filteredMemories.length === 0 ? (
      <EmptyState
       size="compact"
       icon={<Brain aria-hidden="true" />}
       title={t("memory.emptyTitle")}
       description={t("memory.emptyDescription")}
      />
     ) : (
      <div className="grid gap-3">
       {filteredMemories.map((memory) => (
        <Card key={memory.id} variant="subtle" padding="sm" className="grid gap-3">
         <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="grid min-w-0 gap-2">
           <Typography as="p" variant="bodySmall" leading="standard" wrapping="preWrap">
            {memory.content}
           </Typography>
           <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" size="sm" casing="natural">
             {kindLabels[memory.kind]}
            </Badge>
            <Badge
             variant={memory.characterId === null ? "info" : "accent"}
             size="sm"
             casing="natural"
            >
             {memory.characterId === null
              ? t("memory.scopeGlobal")
              : t("memory.scopeCharacter", {
                 name: memory.characterName ?? currentCharacterName,
                })}
            </Badge>
            <Typography variant="caption" tone="muted">
             {t("memory.updated", { date: dateFormatter.format(new Date(memory.updatedAt)) })}
            </Typography>
           </div>
          </div>

          <DropdownMenu>
           <DropdownMenuTrigger asChild>
            <Button
             variant="ghost"
             size="icon-toolbar"
             aria-label={t("memory.actionsAria", { content: memory.content })}
             disabled={isMutating}
            >
             <MoreHorizontal />
            </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end" width="sm">
            <DropdownMenuItem
             onSelect={() => setAction({ type: "edit", memory, draft: memory.content })}
            >
             <Pencil />
             {t("memory.edit")}
            </DropdownMenuItem>
            {memory.kind === "open_loop" ? (
             <DropdownMenuItem onSelect={() => resolveMutation.mutate(memory.id)}>
              <CheckCircle2 />
              {t("memory.resolve")}
             </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
             tone="destructive"
             onSelect={() => setAction({ type: "forget", memory })}
            >
             <Trash2 />
             {t("memory.forget")}
            </DropdownMenuItem>
           </DropdownMenuContent>
          </DropdownMenu>
         </div>
        </Card>
       ))}
      </div>
     )}
    </DialogBody>
   </DialogContent>
  </Dialog>
 );
}
