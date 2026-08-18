"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, CheckCircle2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";

import {
 editAiConversationManagedMemory,
 fetchAiConversationManagedMemories,
 forgetAiConversationManagedMemory,
 resolveAiConversationManagedOpenLoop,
} from "./ai-conversation-settings.client";
import type { AiConversationManagedMemory } from "./ai-conversation-settings.schema";

const MEMORIES_QUERY_KEY = ["settings", "ai-conversation", "memories"] as const;

type MemoryFilter = "all" | "global" | "character" | "open-loops";
type MemoryAction =
 | { type: "edit"; memory: AiConversationManagedMemory; draft: string }
 | { type: "forget"; memory: AiConversationManagedMemory }
 | null;

type AiConversationMemoryManagerDialogProps = {
 open: boolean;
 currentCharacterId: string | null;
 currentCharacterName: string;
 onOpenChange: (open: boolean) => void;
};

export function AiConversationMemoryManagerDialog({
 open,
 currentCharacterId,
 currentCharacterName,
 onOpenChange,
}: AiConversationMemoryManagerDialogProps) {
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
       autoFocus
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
      <Button
       variant="outline"
       onClick={() => setAction(null)}
       disabled={forgetMutation.isPending}
       autoFocus
      >
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
