"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { ArrowLeft, Lightbulb, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MemoryTipsSkeleton } from "@/features/hanzihome/memory-tips/MemoryTipsSkeleton";
import { Card } from "@/components/ui/card";
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
   toast.success("Đã xóa nhắc nhanh");
  } catch (error) {
   toast.error(error instanceof MemoryTipsApiError ? error.message : "Không thể xóa nhắc nhanh");
  }
 };

 return (
  <main className="flex w-full max-w-full flex-col gap-4 px-4 py-4 lg:px-8">
   <Card className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="flex min-w-0 items-start gap-3">
      <StudyInstructionText
       as="span"
       tone="info"
       className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-info-subtle"
      >
       <Lightbulb className="h-6 w-6" />
      </StudyInstructionText>

      <div className="grid min-w-0 gap-1">
       <StudyInstructionText
        variant="overline"
        tone="muted"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        HanziHome
       </StudyInstructionText>
       <Typography as="h1" variant="pageTitle" tone="default" weight="black" tracking="tight">
        Quản lý nhắc nhanh
       </Typography>
       <StudyInstructionText tone="muted" weight="semibold">
        Chỉ các tip bạn tự thêm hoặc lưu từ từ vựng/ngữ pháp mới hiện ở đây.
       </StudyInstructionText>
      </div>
     </div>

     <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" asChild>
       <Link href="/" prefetch={false}>
        <ArrowLeft className="h-4 w-4" />
        Về thư viện
       </Link>
      </Button>

      <MemoryTipDialog
       trigger={
        <Button type="button">
         <Plus className="h-4 w-4" />
         Thêm nhắc nhanh
        </Button>
       }
      />
     </div>
    </div>
   </Card>

   {tipsQuery.isLoading && <MemoryTipsSkeleton />}

   {tipsQuery.error && (
    <Card className="rounded-xl border border-border-default">
     <StudyInstructionText role="alert" tone="danger" weight="bold">
      Không tải được nhắc nhanh.
     </StudyInstructionText>
    </Card>
   )}

   {!tipsQuery.isLoading && !tipsQuery.error && tips.length === 0 && (
    <Card className="rounded-xl border border-dashed border-border-default bg-bg-card">
     <div className="grid gap-3 text-center">
      <StudyInstructionText variant="sectionTitle" tone="default" weight="black">
       Chưa có nhắc nhanh nào
      </StudyInstructionText>
      <StudyInstructionText tone="muted" weight="semibold" className="mx-auto max-w-xl">
       Global card ngoài thư viện sẽ chưa hiện. Khi bạn thêm tip ở đây hoặc bấm “Lưu nhắc nhanh”
       trong từ vựng/ngữ pháp, app mới bắt đầu random tips của bạn.
      </StudyInstructionText>
      <div className="flex justify-center">
       <MemoryTipDialog
        trigger={
         <Button type="button">
          <Plus className="h-4 w-4" />
          Thêm tip đầu tiên
         </Button>
        }
       />
      </div>
     </div>
    </Card>
   )}

   {tips.length > 0 && (
    <section className="grid gap-3">
     {tips.map((tip) => (
      <Card
       key={tip.id}
       className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm"
      >
       <div className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
         <div className="grid min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-2">
           <StudyInstructionText
            variant="caption"
            tone="muted"
            weight="black"
            className="rounded-full bg-bg-subtle px-2.5 py-1"
           >
            {tipTypeLabels[tip.tipType]}
           </StudyInstructionText>
           {tip.isPinned && (
            <StudyInstructionText
             variant="caption"
             tone="info"
             weight="black"
             className="rounded-full bg-info-subtle px-2.5 py-1"
            >
             Đang ghim
            </StudyInstructionText>
           )}
          </div>

          <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
           {tip.title}
          </Typography>
          <StudyInstructionText
           tone="secondary"
           weight="semibold"
           leading="relaxed"
           wrapping="preLine"
          >
           {tip.body}
          </StudyInstructionText>
         </div>

         <div className="flex flex-wrap gap-2">
          <MemoryTipDialog
           tip={tip}
           trigger={
            <Button type="button" variant="outline" size="sm" disabled={isMutating}>
             <Pencil className="h-4 w-4" />
             Sửa
            </Button>
           }
          />

          <Button
           type="button"
           variant={tip.isPinned ? "default" : "outline"}
           size="sm"
           disabled={isMutating}
           onClick={() => void togglePin(tip)}
          >
           {tip.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
           {tip.isPinned ? "Bỏ ghim" : "Ghim"}
          </Button>

          <Button
           type="button"
           variant="destructive"
           size="sm"
           disabled={isMutating}
           onClick={() => void archiveTip(tip)}
          >
           <Trash2 className="h-4 w-4" />
           Xóa
          </Button>
         </div>
        </div>

        {(tip.formula || tip.exampleZh) && (
         <div className="grid gap-2 rounded-lg border border-border-default bg-bg-subtle p-3">
          {tip.formula && (
           <StudyInstructionText tone="info" weight="black">
            {tip.formula}
           </StudyInstructionText>
          )}
          {tip.exampleZh && (
           <div className="grid gap-1">
            <StudyInstructionText tone="default" weight="black">
             {tip.exampleZh}
            </StudyInstructionText>
            {tip.examplePinyin && (
             <StudyInstructionText variant="caption" tone="secondary" weight="semibold">
              {tip.examplePinyin}
             </StudyInstructionText>
            )}
            {tip.exampleVi && (
             <StudyInstructionText variant="caption" tone="muted" weight="semibold">
              {tip.exampleVi}
             </StudyInstructionText>
            )}
           </div>
          )}
         </div>
        )}

        {tip.tags.length > 0 && (
         <div className="flex flex-wrap gap-2">
          {tip.tags.map((tag) => (
           <StudyInstructionText
            key={`${tip.id}-${tag}`}
            variant="caption"
            tone="muted"
            weight="bold"
            className="rounded-full border border-border-default bg-bg-subtle px-2.5 py-1"
           >
            {tag}
           </StudyInstructionText>
          ))}
         </div>
        )}
       </div>
      </Card>
     ))}
    </section>
   )}
  </main>
 );
}
