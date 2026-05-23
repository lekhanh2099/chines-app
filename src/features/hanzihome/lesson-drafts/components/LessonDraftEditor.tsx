"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, GraduationCap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useDeleteLessonDraftMutation,
  useLessonDraftQuery,
  useUpdateLessonDraftMutation,
} from "@/features/hanzihome/lesson-drafts";
import { LessonDraftMetadataForm } from "@/features/hanzihome/lesson-drafts/components/LessonDraftMetadataForm";
import { VocabDraftImporter } from "@/features/hanzihome/lesson-drafts/components/VocabDraftImporter";

type LessonDraftEditorProps = {
  draftId: string;
};

type DraftEditorTab = "overview" | "vocab" | "grammar" | "preview";

const editorTabs: Array<{
  key: DraftEditorTab;
  label: string;
}> = [
  { key: "overview", label: "Tổng quan" },
  { key: "vocab", label: "Từ vựng" },
  { key: "grammar", label: "Ngữ pháp" },
  { key: "preview", label: "Preview" },
];

export function LessonDraftEditor({ draftId }: LessonDraftEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DraftEditorTab>("overview");

  const draftQuery = useLessonDraftQuery(draftId);
  const deleteMutation = useDeleteLessonDraftMutation();
  const updateMutation = useUpdateLessonDraftMutation();

  const draft = draftQuery.data;

  const draftStats = useMemo(() => {
    if (!draft) {
      return {
        vocab: 0,
        grammar: 0,
        flashcards: 0,
      };
    }

    return {
      vocab: draft.content.vocab.length,
      grammar: draft.content.grammarPoints.length,
      flashcards: draft.content.flashcards.length,
    };
  }, [draft]);

  const handlePublishToggle = async () => {
    if (!draft) return;

    const nextStatus = draft.status === "published" ? "draft" : "published";

    await updateMutation.mutateAsync({
      draftId: draft.id,
      input: {
        status: nextStatus,
      },
    });

    toast.success(
      nextStatus === "published"
        ? "Đã publish bài. Bài này sẽ xuất hiện trong HanziHome."
        : "Đã chuyển bài về draft.",
    );
  };

  const handleDelete = async () => {
    if (!draft) return;

    const confirmed = window.confirm(`Xóa bài nháp "${draft.titleZh}"?`);

    if (!confirmed) return;

    await deleteMutation.mutateAsync(draft.id);
    toast.success("Đã xóa bài nháp");
    router.push("/hanzihome");
  };

  if (draftQuery.isLoading) {
    return (
      <main className="hanzihome-static-page">
        <div className="mx-auto w-full max-w-7xl">
          <Card padding="lg" className="rounded-2xl">
            <p className="text-sm font-semibold text-text-muted">
              Đang tải bài nháp...
            </p>
          </Card>
        </div>
      </main>
    );
  }

  if (draftQuery.error || !draft) {
    return (
      <main className="hanzihome-static-page">
        <div className="mx-auto grid w-full max-w-7xl gap-4">
          <Card padding="lg" className="rounded-2xl">
            <div className="grid gap-4">
              <p className="text-sm font-semibold text-text-muted">
                Không tìm thấy bài nháp.
              </p>

              <Button asChild variant="outline">
                <Link href="/hanzihome">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại HanziHome
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="hanzihome-static-page">
      <div className="mx-auto grid w-full max-w-7xl gap-4">
        <Card padding="md" className="rounded-2xl">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <Button asChild variant="ghost" size="sm" className="mb-2 w-fit">
                <Link href="/hanzihome">
                  <ArrowLeft className="h-4 w-4" />
                  HanziHome
                </Link>
              </Button>

              <p className="text-xs font-black uppercase tracking-wide text-text-muted">
                Draft editor
              </p>

              <h1 className="mt-1 truncate text-2xl font-black text-text-primary sm:text-3xl">
                {draft.lessonNumber ? `Bài ${draft.lessonNumber}: ` : ""}
                {draft.titleZh}
              </h1>

              <p className="mt-1 text-sm font-bold text-text-muted">
                {draft.titleVi || draft.lessonKey} · {draft.status}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={draft.status === "published" ? "outline" : "default"}
                disabled={updateMutation.isPending}
                onClick={() => void handlePublishToggle()}
              >
                {draft.status === "published" ? "Unpublish" : "Publish"}
              </Button>

              <Button
                type="button"
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => void handleDelete()}
              >
                <Trash2 className="h-4 w-4" />
                Xóa draft
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          <Card padding="sm" className="rounded-2xl">
            <p className="text-xs font-black uppercase tracking-wide text-text-muted">
              Từ vựng
            </p>
            <p className="mt-1 text-2xl font-black text-text-primary">
              {draftStats.vocab}
            </p>
          </Card>

          <Card padding="sm" className="rounded-2xl">
            <p className="text-xs font-black uppercase tracking-wide text-text-muted">
              Ngữ pháp
            </p>
            <p className="mt-1 text-2xl font-black text-text-primary">
              {draftStats.grammar}
            </p>
          </Card>

          <Card padding="sm" className="rounded-2xl">
            <p className="text-xs font-black uppercase tracking-wide text-text-muted">
              Flashcards
            </p>
            <p className="mt-1 text-2xl font-black text-text-primary">
              {draftStats.flashcards}
            </p>
          </Card>
        </div>

        <Card padding="sm" className="rounded-2xl">
          <div className="flex flex-wrap gap-2">
            {editorTabs.map((tab) => (
              <Button
                key={tab.key}
                type="button"
                variant={activeTab === tab.key ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </Card>

        {activeTab === "overview" && (
          <Card padding="lg" className="rounded-2xl">
            <div className="grid gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-text-muted">
                  Thông tin bài
                </p>
                <h2 className="mt-1 text-xl font-black text-text-primary">
                  Metadata
                </h2>
                <p className="mt-1 text-sm font-semibold text-text-muted">
                  Sửa thông tin cơ bản của bài. Từ vựng và ngữ pháp sẽ thêm ở tab riêng.
                </p>
              </div>

              <LessonDraftMetadataForm draft={draft} />
            </div>
          </Card>
        )}

        {activeTab === "vocab" && <VocabDraftImporter draft={draft} />}

        {activeTab === "grammar" && (
          <Card padding="lg" className="rounded-2xl">
            <div className="grid gap-3">
              <GraduationCap className="h-6 w-6 text-text-muted" />
              <h2 className="text-xl font-black text-text-primary">
                Ngữ pháp
              </h2>
              <p className="text-sm font-semibold text-text-muted">
                Phase sau sẽ thêm grammar point editor: title, formula, explanation, examples, notes.
              </p>
            </div>
          </Card>
        )}

        {activeTab === "preview" && (
          <Card padding="lg" className="rounded-2xl">
            <div className="grid gap-3">
              <FileText className="h-6 w-6 text-text-muted" />
              <h2 className="text-xl font-black text-text-primary">
                Preview
              </h2>
              <p className="text-sm font-semibold text-text-muted">
                Preview sẽ render draft như một lesson thật sau khi vocab/grammar editor có dữ liệu.
              </p>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
