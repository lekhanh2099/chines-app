"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Lightbulb, Pencil, Pin, PinOff, Plus, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
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
    variant="section"
    padding="md"
    className={cn(compact ? "max-h-fit overflow-hidden" : "min-h-28", className)}
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
    variant="section"
    padding="md"
    className={cn(compact ? "max-h-fit overflow-hidden" : "min-h-28", className)}
   >
    <div className="grid h-full min-h-32 gap-3">
     <div className="flex min-w-0 gap-3">
      <IconTile size="sm" tone="info">
       <Lightbulb />
      </IconTile>
      <div className="grid min-w-0 gap-1">
       <StudyInstructionText
        variant="overline"
        tone="muted"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        Nhắc nhanh
       </StudyInstructionText>
       <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
        Chưa có mẹo nhớ
       </Typography>
       <StudyInstructionText
        variant="bodySmall"
        tone="secondary"
        weight="semibold"
        clamp="two"
        leading="relaxed"
       >
        Thêm tip ngắn để app nhắc lại khi bạn quay về trang học.
       </StudyInstructionText>
      </div>
     </div>

     {!contentOnly ? (
      <div className="mt-auto flex flex-wrap gap-2">
       <MemoryTipDialog
        trigger={
         <Button type="button" variant="outline" size="toolbar">
          <Plus />
          Thêm
         </Button>
        }
       />
       <Button type="button" variant="ghost" size="toolbar" asChild>
        <Link href="/memory-tips" prefetch={false}>
         <Settings />
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
   variant="section"
   padding="md"
   className={cn(compact ? "max-h-fit overflow-hidden" : "min-h-28", className)}
  >
   <div className="relative grid w-full gap-3">
    {contentOnly && selectedTip.isPinned ? (
     <Badge variant="accent" size="sm" className="absolute right-0 top-0" aria-label="Tip đã ghim">
      <Pin />
     </Badge>
    ) : null}

    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="flex min-w-0 gap-3">
      <IconTile size="sm" tone="info">
       <Lightbulb />
      </IconTile>

      <div className="min-w-0 pr-8">
       <StudyInstructionText
        variant="overline"
        tone="muted"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        Nhắc nhanh
       </StudyInstructionText>
       <Typography as="h2" variant="sectionTitle" tone="default" weight="black" clamp="one">
        {selectedTip.title}
       </Typography>
       <StudyInstructionText
        tone="secondary"
        weight="semibold"
        clamp="two"
        leading="relaxed"
        wrapping="preLine"
       >
        {selectedTip.body}
       </StudyInstructionText>
      </div>
     </div>

     {!contentOnly ? (
      <div className="flex shrink-0 flex-wrap gap-2">
       <Button type="button" variant="ghost" size="toolbar" onClick={pickNextTip}>
        <RefreshCw />
        Đổi câu
       </Button>

       {canEditSelectedTip ? (
        <MemoryTipDialog
         key={selectedTip.id}
         tip={selectedTip}
         trigger={
          <Button type="button" variant="outline" size="toolbar">
           <Pencil />
           Sửa
          </Button>
         }
        />
       ) : null}

       <MemoryTipDialog
        trigger={
         <Button type="button" variant="outline" size="toolbar">
          <Plus />
          Thêm
         </Button>
        }
       />

       <Button type="button" variant="ghost" size="toolbar" asChild>
        <Link href="/memory-tips" prefetch={false}>
         <Settings />
         Quản lý
        </Link>
       </Button>

       {canEditSelectedTip ? (
        <Button
         type="button"
         variant={selectedTip.isPinned ? "default" : "outline"}
         size="toolbar"
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
       ) : null}
      </div>
     ) : null}
    </div>

    {!compact && (selectedTip.formula || selectedTip.exampleZh) ? (
     <>
      <Separator />
      <div className="grid gap-2">
       {selectedTip.formula ? (
        <StudyInstructionText tone="info" weight="black">
         {selectedTip.formula}
        </StudyInstructionText>
       ) : null}
       {selectedTip.exampleZh ? (
        <div className="grid gap-1">
         <StudyInstructionText tone="default" weight="black">
          {selectedTip.exampleZh}
         </StudyInstructionText>
         {selectedTip.examplePinyin ? (
          <StudyInstructionText variant="caption" tone="secondary" weight="semibold">
           {selectedTip.examplePinyin}
          </StudyInstructionText>
         ) : null}
         {selectedTip.exampleVi ? (
          <StudyInstructionText variant="caption" tone="muted" weight="semibold">
           {selectedTip.exampleVi}
          </StudyInstructionText>
         ) : null}
        </div>
       ) : null}
      </div>
     </>
    ) : null}
   </div>
  </Card>
 );
}
