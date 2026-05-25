"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Lightbulb,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MemoryTipDialog } from "./MemoryTipDialog";
import { MemoryTipsApiError } from "./memory-tip-api";
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
  const tips = (tipsQuery.data ?? []).filter((tip) => tip.sourceType !== "system");
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
        error instanceof MemoryTipsApiError
          ? error.message
          : "Không thể cập nhật nhắc nhanh",
      );
    }
  };

  const archiveTip = async (tip: MemoryTip) => {
    try {
      await archiveMutation.mutateAsync(tip.id);
      toast.success("Đã xóa nhắc nhanh");
    } catch (error) {
      toast.error(
        error instanceof MemoryTipsApiError
          ? error.message
          : "Không thể xóa nhắc nhanh",
      );
    }
  };

  return (
    <main className="flex w-full max-w-full flex-col gap-4 px-4 py-4 lg:px-8">
      <Card className="rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-info-subtle text-info-text">
              <Lightbulb className="h-6 w-6" />
            </span>

            <div className="grid min-w-0 gap-1">
              <p className="text-xs font-black uppercase tracking-wide text-text-muted">
                HanziHome
              </p>
              <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
                Quản lý nhắc nhanh
              </h1>
              <p className="text-sm font-semibold text-text-muted">
                Chỉ các tip bạn tự thêm hoặc lưu từ từ vựng/ngữ pháp mới hiện ở đây.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/">
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

      {tipsQuery.isLoading && (
        <Card className="rounded-xl border border-border-default">
          <p className="text-sm font-bold text-text-muted">
            Đang tải nhắc nhanh...
          </p>
        </Card>
      )}

      {tipsQuery.error && (
        <Card className="rounded-xl border border-border-default">
          <p role="alert" className="text-sm font-bold text-destructive">
            Không tải được nhắc nhanh.
          </p>
        </Card>
      )}

      {!tipsQuery.isLoading && !tipsQuery.error && tips.length === 0 && (
        <Card className="rounded-xl border border-dashed border-border-default bg-bg-card">
          <div className="grid gap-3 text-center">
            <p className="text-lg font-black text-text-primary">
              Chưa có nhắc nhanh nào
            </p>
            <p className="mx-auto max-w-xl text-sm font-semibold text-text-muted">
              Global card ngoài thư viện sẽ chưa hiện. Khi bạn thêm tip ở đây
              hoặc bấm “Lưu nhắc nhanh” trong từ vựng/ngữ pháp, app mới bắt đầu
              random tips của bạn.
            </p>
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
                      <span className="rounded-full bg-bg-subtle px-2.5 py-1 text-xs font-black text-text-muted">
                        {tipTypeLabels[tip.tipType]}
                      </span>
                      {tip.isPinned && (
                        <span className="rounded-full bg-info-subtle px-2.5 py-1 text-xs font-black text-info-text">
                          Đang ghim
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-black text-text-primary">
                      {tip.title}
                    </h2>
                    <p className="whitespace-pre-line text-sm font-semibold leading-relaxed text-text-secondary">
                      {tip.body}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <MemoryTipDialog
                      tip={tip}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isMutating}
                        >
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
                      {tip.isPinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
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
                      <p className="text-sm font-black text-info-text">
                        {tip.formula}
                      </p>
                    )}
                    {tip.exampleZh && (
                      <div className="grid gap-1">
                        <p className="text-sm font-black text-text-primary">
                          {tip.exampleZh}
                        </p>
                        {tip.examplePinyin && (
                          <p className="text-xs font-semibold text-text-secondary">
                            {tip.examplePinyin}
                          </p>
                        )}
                        {tip.exampleVi && (
                          <p className="text-xs font-semibold text-text-muted">
                            {tip.exampleVi}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {tip.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tip.tags.map((tag) => (
                      <span
                        key={`${tip.id}-${tag}`}
                        className="rounded-full border border-border-default bg-bg-subtle px-2.5 py-1 text-xs font-bold text-text-muted"
                      >
                        {tag}
                      </span>
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
