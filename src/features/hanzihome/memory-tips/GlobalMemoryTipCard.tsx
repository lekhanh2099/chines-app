"use client";

import Link from "next/link";
import {
 Lightbulb,
 Pencil,
 Pin,
 PinOff,
 Plus,
 RefreshCw,
 Settings,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MemoryTipDialog } from "./MemoryTipDialog";
import { MemoryTipsApiError } from "./memory-tip-api";
import { useRouteMemoryTip } from "./useRouteMemoryTip";
import {
 useMemoryTipsQuery,
 useUpdateMemoryTipMutation,
} from "./useMemoryTips";

type GlobalMemoryTipCardProps = {
 compact?: boolean;
};

export function GlobalMemoryTipCard({
 compact = false,
}: GlobalMemoryTipCardProps) {
 const tipsQuery = useMemoryTipsQuery();
 const tips = (tipsQuery.data ?? []).filter(
  (tip) => tip.scope === "user" && tip.sourceType !== "system",
 );
 const { selectedTip, pickNextTip } = useRouteMemoryTip(tips);
 const updateMutation = useUpdateMemoryTipMutation();
 const isMutating = updateMutation.isPending;

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
    error instanceof MemoryTipsApiError
     ? error.message
     : "Không thể cập nhật nhắc nhanh",
   );
  }
 };

 if (tipsQuery.isLoading) return null;

 if (tipsQuery.error) return null;

 if (!selectedTip) return null;

 return (
  <Card
   padding="md"
   className={cn(
    "rounded-xl border border-border-default bg-bg-primary shadow-theme-sm",
    compact ? "max-h-fit overflow-hidden" : "min-h-28",
   )}
  >
   <div className="grid gap-3 w-full">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="flex min-w-0 gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-subtle text-info-text">
       <Lightbulb className="h-4 w-4" />
      </span>

      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Nhắc nhanh
       </p>
       <h2 className="line-clamp-1 text-base font-black text-text-primary">
        {selectedTip.title}
       </h2>
       <p className="line-clamp-2 whitespace-pre-line text-sm font-semibold leading-relaxed text-text-secondary">
        {selectedTip.body}
       </p>
      </div>
     </div>

     <div className="flex shrink-0 flex-wrap gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={pickNextTip}>
       <RefreshCw className="h-4 w-4" />
       Đổi câu
      </Button>

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

      <MemoryTipDialog
       trigger={
        <Button type="button" variant="outline" size="sm">
         <Plus className="h-4 w-4" />
         Thêm
        </Button>
       }
      />

      <Button type="button" variant="ghost" size="sm" asChild>
       <Link href="/hanzihome/memory-tips">
        <Settings className="h-4 w-4" />
        Quản lý
       </Link>
      </Button>

      <Button
       type="button"
       variant={selectedTip.isPinned ? "default" : "outline"}
       size="sm"
       isLoading={isMutating}
       onClick={togglePin}
      >
       {selectedTip.isPinned ? (
        <PinOff className="h-4 w-4" />
       ) : (
        <Pin className="h-4 w-4" />
       )}
       {selectedTip.isPinned ? "Bỏ ghim" : "Ghim"}
      </Button>
     </div>
    </div>

    {!compact && (selectedTip.formula || selectedTip.exampleZh) && (
     <div className="grid gap-2 rounded-lg border border-border-default bg-bg-subtle p-3">
      {selectedTip.formula && (
       <p className="text-sm font-black text-info-text">
        {selectedTip.formula}
       </p>
      )}
      {selectedTip.exampleZh && (
       <div className="grid gap-1">
        <p className="text-sm font-black text-text-primary">
         {selectedTip.exampleZh}
        </p>
        {selectedTip.examplePinyin && (
         <p className="text-xs font-semibold text-text-secondary">
          {selectedTip.examplePinyin}
         </p>
        )}
        {selectedTip.exampleVi && (
         <p className="text-xs font-semibold text-text-muted">
          {selectedTip.exampleVi}
         </p>
        )}
       </div>
      )}
     </div>
    )}
   </div>
  </Card>
 );
}
