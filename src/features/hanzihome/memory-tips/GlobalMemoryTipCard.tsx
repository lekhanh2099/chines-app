"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Lightbulb, Pencil, Pin, PinOff, Plus, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { MemoryTipDialog } from "./MemoryTipDialog";
import { MemoryTipsApiError } from "./memory-tip-api";
import { getUserVisibleMemoryTips } from "./memory-tip.utils";
import { useRouteMemoryTip } from "./useRouteMemoryTip";
import { useMemoryTipsQuery, useUpdateMemoryTipMutation } from "./useMemoryTips";

type GlobalMemoryTipCardProps = {
 compact?: boolean;
 showEmptyState?: boolean;
 contentOnly?: boolean;
 className?: string;
};

export function GlobalMemoryTipCard({
 compact = false,
 showEmptyState = false,
 contentOnly = false,
 className,
}: GlobalMemoryTipCardProps) {
 const tipsQuery = useMemoryTipsQuery();
 const tips = useMemo(() => getUserVisibleMemoryTips(tipsQuery.data ?? []), [tipsQuery.data]);
 const { selectedTip, pickNextTip } = useRouteMemoryTip(tips);
 const updateMutation = useUpdateMemoryTipMutation();
 const isMutating = updateMutation.isPending;
 const canEditSelectedTip = selectedTip?.scope === "user";

 const togglePin = async () => {
  if (!selectedTip) return;

  try {
   await updateMutation.mutateAsync({
    tipId: selectedTip.id,
    input: { isPinned: !selectedTip.isPinned },
   });
   toast.success(selectedTip.isPinned ? "Đã bỏ ghim" : "Đã ghim");
  } catch (error) {
   toast.error(
    error instanceof MemoryTipsApiError ? error.message : "Không thể cập nhật nhắc nhanh",
   );
  }
 };

 if (tipsQuery.isLoading) {
  if (!showEmptyState) return null;

  return (
   <Card
    padding="md"
    className={cn(
     "rounded-xl border border-border-default bg-bg-primary shadow-theme-sm",
     compact ? "max-h-fit overflow-hidden" : "min-h-28",
     className,
    )}
   >
    <div
     className="flex h-full min-h-28 animate-pulse items-center gap-3"
     aria-busy="true"
     aria-live="polite"
    >
     <span className="size-9 shrink-0 rounded-xl bg-bg-subtle" />
     <div className="grid min-w-0 flex-1 gap-2">
      <div className="h-3 w-20 rounded-full bg-bg-subtle" />
      <div className="h-4 w-48 max-w-full rounded-md bg-bg-subtle" />
      <div className="h-3 w-3/4 rounded-full bg-bg-subtle" />
     </div>
     <span className="sr-only">Đang tải mẹo nhớ</span>
    </div>
   </Card>
  );
 }

 if (tipsQuery.error) return null;

 if (!selectedTip) {
  if (!showEmptyState) return null;

  return (
   <Card
    padding="md"
    className={cn(
     "rounded-xl border border-border-default bg-bg-primary shadow-theme-sm",
     compact ? "max-h-fit overflow-hidden" : "min-h-28",
     className,
    )}
   >
    <div className="grid h-full min-h-32 gap-3">
     <div className="flex min-w-0 gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-subtle text-info-text">
       <Lightbulb className="h-4 w-4" />
      </span>
      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">Nhắc nhanh</p>
       <h2 className="text-base font-black text-text-primary">Chưa có mẹo nhớ</h2>
       <p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-text-secondary">
        Thêm tip ngắn để app nhắc lại khi bạn quay về trang học.
       </p>
      </div>
     </div>

     {!contentOnly ? (
      <div className="mt-auto flex flex-wrap gap-2">
       <MemoryTipDialog
        trigger={
         <Button type="button" variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Thêm
         </Button>
        }
       />
       <Button type="button" variant="ghost" size="sm" asChild>
        <Link href="/memory-tips" prefetch={false}>
         <Settings className="h-4 w-4" />
         Quản lý
        </Link>
       </Button>
      </div>
     ) : null}
    </div>
   </Card>
  );
 }

 return (
  <Card
   padding="md"
   className={cn(
    "rounded-xl border border-border-default bg-bg-primary shadow-theme-sm",
    compact ? "max-h-fit overflow-hidden" : "min-h-28",
    className,
   )}
  >
   <div className="relative grid w-full gap-3">
    {contentOnly && selectedTip.isPinned ? (
     <span
      className="absolute right-0 top-0 rounded-full bg-bg-subtle/80 p-1.5 text-accent-text"
      aria-label="Tip đã ghim"
     >
      <Pin className="h-3.5 w-3.5" />
     </span>
    ) : null}

    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="flex min-w-0 gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-subtle text-info-text">
       <Lightbulb className="h-4 w-4" />
      </span>

      <div className="min-w-0 pr-8">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">Nhắc nhanh</p>
       <h2 className="line-clamp-1 text-base font-black text-text-primary">{selectedTip.title}</h2>
       <p className="line-clamp-2 whitespace-pre-line  font-semibold leading-relaxed text-text-secondary">
        {selectedTip.body}
       </p>
      </div>
     </div>

     {!contentOnly ? (
      <div className="flex shrink-0 flex-wrap gap-2">
       <Button type="button" variant="ghost" size="sm" onClick={pickNextTip}>
        <RefreshCw className="h-4 w-4" />
        Đổi câu
       </Button>

       {canEditSelectedTip && (
        <MemoryTipDialog
         key={selectedTip.id}
         tip={selectedTip}
         trigger={
          <Button type="button" variant="outline" size="sm">
           <Pencil className="h-4 w-4" />
           Sửa
          </Button>
         }
        />
       )}

       <MemoryTipDialog
        trigger={
         <Button type="button" variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Thêm
         </Button>
        }
       />

       <Button type="button" variant="ghost" size="sm" asChild>
        <Link href="/memory-tips" prefetch={false}>
         <Settings className="h-4 w-4" />
         Quản lý
        </Link>
       </Button>

       {canEditSelectedTip && (
        <Button
         type="button"
         variant={selectedTip.isPinned ? "default" : "outline"}
         size="sm"
         onClick={togglePin}
        >
         {isMutating ? (
          <Spinner data-icon="inline-start" />
         ) : selectedTip.isPinned ? (
          <PinOff data-icon="inline-start" />
         ) : (
          <Pin data-icon="inline-start" />
         )}
         {selectedTip.isPinned ? "Bỏ ghim" : "Ghim"}
        </Button>
       )}
      </div>
     ) : null}
    </div>

    {!compact && (selectedTip.formula || selectedTip.exampleZh) && (
     <div className="grid gap-2 rounded-lg border border-border-default bg-bg-subtle p-3">
      {selectedTip.formula && <p className=" font-black text-info-text">{selectedTip.formula}</p>}
      {selectedTip.exampleZh && (
       <div className="grid gap-1">
        <p className="font-black text-text-primary">{selectedTip.exampleZh}</p>
        {selectedTip.examplePinyin && (
         <p className="text-xs font-semibold text-text-secondary">{selectedTip.examplePinyin}</p>
        )}
        {selectedTip.exampleVi && (
         <p className="text-xs font-semibold text-text-muted">{selectedTip.exampleVi}</p>
        )}
       </div>
      )}
     </div>
    )}
   </div>
  </Card>
 );
}
