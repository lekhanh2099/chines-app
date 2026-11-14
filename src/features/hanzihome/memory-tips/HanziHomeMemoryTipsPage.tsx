"use client";

import { useState } from "react";
import { Lightbulb, MoreHorizontal, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { PageHeader } from "@/components/ui/layout/page-header";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { Typography } from "@/components/ui/display/typography";
import { SoftDeleteConfirmDialog } from "@/features/hanzihome/editing/components/SoftDeleteConfirmDialog";
import { MemoryTipsSkeleton } from "@/features/hanzihome/memory-tips/MemoryTipsSkeleton";
import { MemoryTipDialog } from "./MemoryTipDialog";
import { MemoryTipsApiError } from "./memory-tip-api";
import { getUserVisibleMemoryTips } from "./memory-tip.utils";
import type { MemoryTip } from "./memory-tip.schema";
import {
 useArchiveMemoryTipMutation,
 useMemoryTipsQuery,
 useUpdateMemoryTipMutation,
} from "./useMemoryTips";

export function HanziHomeMemoryTipsPage() {
 const t = useTranslations("MemoryTips");
 const tipsQuery = useMemoryTipsQuery();
 const updateMutation = useUpdateMemoryTipMutation();
 const archiveMutation = useArchiveMemoryTipMutation();
 const tips = getUserVisibleMemoryTips(tipsQuery.data ?? []);
 const isMutating = updateMutation.isPending || archiveMutation.isPending;

 const togglePin = async (tip: MemoryTip) => {
  try {
   await updateMutation.mutateAsync({
    tipId: tip.id,
    input: { isPinned: !tip.isPinned },
   });
   toast.success(tip.isPinned ? t("toast.unpinned") : t("toast.pinned"));
  } catch (error) {
   toast.error(error instanceof MemoryTipsApiError ? error.message : t("toast.updateError"));
  }
 };

 const archiveTip = async (tip: MemoryTip) => {
  try {
   await archiveMutation.mutateAsync(tip.id);
   toast.success(t("toast.archived"));
  } catch (error) {
   toast.error(error instanceof MemoryTipsApiError ? error.message : t("toast.archiveError"));
   throw error;
  }
 };

 if (tipsQuery.isLoading) {
  return (
   <PageContainer>
    <MemoryTipsSkeleton />
   </PageContainer>
  );
 }

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-5">
    <PageHeader
     eyebrow="HanziHome"
     title={t("title")}
     description={t("description")}
     meta={
      <Typography variant="caption" tone="muted" weight="bold">
       {t("count", { count: tips.length })}
      </Typography>
     }
     actions={
      <MemoryTipDialog
       trigger={
        <Button type="button" size="toolbar">
         <Plus data-icon="inline-start" />
         {t("add")}
        </Button>
       }
      />
     }
    />

    {tipsQuery.error ? (
     <QueryErrorCard
      title={t("loadError.title")}
      description={t("loadError.description")}
      onRetry={() => void tipsQuery.refetch()}
     />
    ) : null}

    {!tipsQuery.error && tips.length === 0 ? (
     <EmptyState
      surface="subtle"
      size="spacious"
      icon={<Lightbulb />}
      title={t("empty.title")}
      description={t("empty.description")}
      actions={
       <MemoryTipDialog
        trigger={
         <Button type="button" size="toolbar">
          <Plus data-icon="inline-start" />
          {t("empty.addFirst")}
         </Button>
        }
       />
      }
     />
    ) : null}

    {!tipsQuery.error && tips.length > 0 ? (
     <section className="grid gap-3" aria-label={t("listAria")}>
      {tips.map((tip) => (
       <MemoryTipCard
        key={tip.id}
        tip={tip}
        isMutating={isMutating}
        onTogglePin={togglePin}
        onArchive={archiveTip}
       />
      ))}
     </section>
    ) : null}
   </div>
  </PageContainer>
 );
}

function MemoryTipCard({
 tip,
 isMutating,
 onTogglePin,
 onArchive,
}: {
 tip: MemoryTip;
 isMutating: boolean;
 onTogglePin: (tip: MemoryTip) => Promise<void>;
 onArchive: (tip: MemoryTip) => Promise<void>;
}) {
 const t = useTranslations("MemoryTips");
 const tDeleteItem = useTranslations("Common.softDelete.itemTypes");
 const [editOpen, setEditOpen] = useState(false);
 const [deleteOpen, setDeleteOpen] = useState(false);

 return (
  <Card variant="section" padding="lg" className="grid gap-3">
   <div className="flex items-start justify-between gap-3">
    <div className="grid min-w-0 flex-1 gap-1">
     <div className="flex flex-wrap items-center gap-2">
      <Badge variant="default">{t(`types.${tip.tipType}`)}</Badge>
      {tip.isPinned ? <Badge variant="info">{t("card.pinned")}</Badge> : null}
     </div>
     <Typography as="h2" variant="sectionTitle" weight="black">
      {tip.title}
     </Typography>
     <Typography as="p" variant="body" tone="secondary" wrapping="preLine">
      {tip.body}
     </Typography>
    </div>

    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <Button
       type="button"
       variant="ghost"
       size="icon-toolbar"
       aria-label={t("card.actionsAria", { title: tip.title })}
       title={t("card.actions")}
       disabled={isMutating}
      >
       <MoreHorizontal />
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end" width="md">
      <DropdownMenuItem onSelect={() => setEditOpen(true)}>
       <Pencil />
       {t("card.edit")}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => void onTogglePin(tip)}>
       {tip.isPinned ? <PinOff /> : <Pin />}
       {tip.isPinned ? t("card.unpin") : t("card.pin")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem tone="destructive" onSelect={() => setDeleteOpen(true)}>
       <Trash2 />
       {t("card.delete")}
      </DropdownMenuItem>
     </DropdownMenuContent>
    </DropdownMenu>
   </div>

   {tip.formula || tip.exampleZh ? (
    <Card variant="subtle" padding="sm" className="grid gap-2">
     {tip.formula ? (
      <Typography variant="label" tone="info" weight="black">
       {tip.formula}
      </Typography>
     ) : null}
     {tip.exampleZh ? (
      <div className="grid gap-1">
       <Typography tone="default" weight="black">
        {tip.exampleZh}
       </Typography>
       {tip.examplePinyin ? (
        <Typography variant="caption" tone="secondary" weight="semibold">
         {tip.examplePinyin}
        </Typography>
       ) : null}
       {tip.exampleVi ? (
        <Typography variant="caption" tone="muted" weight="semibold">
         {tip.exampleVi}
        </Typography>
       ) : null}
      </div>
     ) : null}
    </Card>
   ) : null}

   {tip.tags.length > 0 ? (
    <div className="flex flex-wrap gap-2">
     {tip.tags.map((tag) => (
      <Badge key={`${tip.id}-${tag}`} variant="default" size="sm">
       {tag}
      </Badge>
     ))}
    </div>
   ) : null}

   <MemoryTipDialog tip={tip} open={editOpen} onOpenChange={setEditOpen} />
   <SoftDeleteConfirmDialog
    itemType={tDeleteItem("memoryTip")}
    itemLabel={tip.title}
    open={deleteOpen}
    onOpenChange={setDeleteOpen}
    onConfirm={() => onArchive(tip)}
   />
  </Card>
 );
}
