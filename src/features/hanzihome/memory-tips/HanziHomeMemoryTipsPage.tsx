"use client";

import { useState } from "react";
import { Lightbulb, MoreHorizontal, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/ui/page-header";
import { QueryErrorCard } from "@/components/ui/query-error-card";
import { Typography } from "@/components/ui/typography";
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

const tipTypeLabels: Record<MemoryTip["tipType"], string> = {
 grammar: "Ngữ pháp",
 vocab: "Từ vựng",
 formula: "Công thức",
 custom: "Tự thêm",
};

export function HanziHomeMemoryTipsPage() {
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
   toast.success(tip.isPinned ? "Đã bỏ ghim" : "Đã ghim");
  } catch (error) {
   toast.error(
    error instanceof MemoryTipsApiError ? error.message : "Không thể cập nhật nhắc nhanh",
   );
  }
 };

 const archiveTip = async (tip: MemoryTip) => {
  try {
   await archiveMutation.mutateAsync(tip.id);
   toast.success("Đã chuyển nhắc nhanh vào mục đã xóa");
  } catch (error) {
   toast.error(error instanceof MemoryTipsApiError ? error.message : "Không thể xóa nhắc nhanh");
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
   <main className="grid w-full gap-5">
    <PageHeader
     eyebrow="HanziHome"
     title="Nhắc nhanh"
     description="Giữ lại công thức, mẹo phân biệt và ví dụ dễ quên để xem lại trong lúc học."
     meta={
      <Typography variant="caption" tone="muted" weight="bold">
       {tips.length} mục đang dùng
      </Typography>
     }
     actions={
      <MemoryTipDialog
       trigger={
        <Button type="button" size="toolbar">
         <Plus data-icon="inline-start" />
         Thêm nhắc nhanh
        </Button>
       }
      />
     }
    />

    {tipsQuery.error ? (
     <QueryErrorCard
      title="Không tải được nhắc nhanh"
      description="Dữ liệu nhắc nhanh hiện không khả dụng."
      onRetry={() => void tipsQuery.refetch()}
     />
    ) : null}

    {!tipsQuery.error && tips.length === 0 ? (
     <EmptyState
      surface="subtle"
      size="spacious"
      icon={<Lightbulb />}
      title="Chưa có nhắc nhanh nào"
      description="Thêm một tip ở đây hoặc lưu từ phần từ vựng/ngữ pháp để app có nội dung nhắc lại."
      actions={
       <MemoryTipDialog
        trigger={
         <Button type="button" size="toolbar">
          <Plus data-icon="inline-start" />
          Thêm tip đầu tiên
         </Button>
        }
       />
      }
     />
    ) : null}

    {!tipsQuery.error && tips.length > 0 ? (
     <section className="grid gap-3" aria-label="Danh sách nhắc nhanh">
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
   </main>
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
 const [editOpen, setEditOpen] = useState(false);
 const [deleteOpen, setDeleteOpen] = useState(false);

 return (
  <Card variant="section" padding="lg" className="grid gap-3">
   <div className="flex items-start justify-between gap-3">
    <div className="grid min-w-0 flex-1 gap-1">
     <div className="flex flex-wrap items-center gap-2">
      <Badge variant="default">{tipTypeLabels[tip.tipType]}</Badge>
      {tip.isPinned ? <Badge variant="info">Đang ghim</Badge> : null}
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
       aria-label={`Tác vụ cho ${tip.title}`}
       title="Tác vụ"
       disabled={isMutating}
      >
       <MoreHorizontal />
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end" width="md">
      <DropdownMenuItem onSelect={() => setEditOpen(true)}>
       <Pencil />
       Sửa
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => void onTogglePin(tip)}>
       {tip.isPinned ? <PinOff /> : <Pin />}
       {tip.isPinned ? "Bỏ ghim" : "Ghim"}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem tone="destructive" onSelect={() => setDeleteOpen(true)}>
       <Trash2 />
       Xóa
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
    itemType="nhắc nhanh"
    itemLabel={tip.title}
    open={deleteOpen}
    onOpenChange={setDeleteOpen}
    onConfirm={() => onArchive(tip)}
   />
  </Card>
 );
}
