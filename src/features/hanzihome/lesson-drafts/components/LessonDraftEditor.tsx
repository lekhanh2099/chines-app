"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 useDeleteLessonDraftMutation,
 useLessonDraftQuery,
 useUpdateLessonDraftMutation,
} from "@/features/hanzihome/lesson-drafts";
import { LessonDraftMetadataForm } from "@/features/hanzihome/lesson-drafts/components/LessonDraftMetadataForm";
import { VocabDraftImporter } from "@/features/hanzihome/lesson-drafts/components/VocabDraftImporter";
import { GrammarDraftImporter } from "@/features/hanzihome/lesson-drafts/components/GrammarDraftImporter";
import { MarkdownImportPreview } from "@/features/hanzihome/importer/MarkdownImportPreview";

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

function parseEditorTab(value: string | null): DraftEditorTab {
 return value === "overview" ||
  value === "vocab" ||
  value === "grammar" ||
  value === "preview"
  ? value
  : "overview";
}

export function LessonDraftEditor({ draftId }: LessonDraftEditorProps) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [activeTab, setActiveTab] = useState<DraftEditorTab>(
  parseEditorTab(searchParams.get("tab")),
 );
 const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
 const [markdownImportOpen, setMarkdownImportOpen] = useState(false);

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

  await deleteMutation.mutateAsync(draft.id);
  toast.success("Đã xóa bài nháp");
  setDeleteDialogOpen(false);
  router.push("/hanzihome");
 };

 if (draftQuery.isLoading) {
  return (
   <main className="hanzihome-static-page">
    <div className="w-full max-w-full">
     <Card padding="lg" className="rounded-xl">
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
    <div className="grid w-full max-w-full gap-4">
     <Card padding="lg" className="rounded-xl">
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
   <div className="grid w-full max-w-full gap-4">
    <Card padding="md" className="rounded-xl">
     <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
       <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/hanzihome">
         <ArrowLeft className="h-4 w-4" />
         HanziHome
        </Link>
       </Button>

       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Draft editor
       </p>

       <h1 className="truncate text-2xl font-black text-text-primary sm:text-3xl">
        {draft.lessonNumber ? `Bài ${draft.lessonNumber}: ` : ""}
        {draft.titleZh}
       </h1>

       <p className="text-sm font-bold text-text-muted">
        {draft.titleVi || draft.lessonKey} · {draft.status}
       </p>
      </div>

      <div className="flex flex-wrap gap-2">
       <Button
        type="button"
        variant="outline"
        onClick={() => setMarkdownImportOpen(true)}
       >
        <Upload className="h-4 w-4" />
        Import Markdown
       </Button>

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
        onClick={() => setDeleteDialogOpen(true)}
       >
        <Trash2 className="h-4 w-4" />
        Xóa draft
       </Button>
      </div>
     </div>
    </Card>

    <div className="grid gap-3 md:grid-cols-3">
     <Card padding="sm" className="rounded-xl">
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Từ vựng
      </p>
      <p className="text-2xl font-black text-text-primary">
       {draftStats.vocab}
      </p>
     </Card>

     <Card padding="sm" className="rounded-xl">
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Ngữ pháp
      </p>
      <p className="text-2xl font-black text-text-primary">
       {draftStats.grammar}
      </p>
     </Card>

     <Card padding="sm" className="rounded-xl">
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Flashcards
      </p>
      <p className="text-2xl font-black text-text-primary">
       {draftStats.flashcards}
      </p>
     </Card>
    </div>

    <Card padding="sm" className="rounded-xl">
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
     <div className="grid gap-4">
      <Card padding="lg" className="rounded-xl">
       <div className="grid gap-3">
        <div>
         <p className="text-xs font-black uppercase tracking-wide text-text-muted">
          Thông tin bài
         </p>
         <h2 className="text-xl font-black text-text-primary">Metadata</h2>
         <p className="text-sm font-semibold text-text-muted">
          Sửa thông tin cơ bản của bài. Từ vựng và ngữ pháp sẽ thêm ở tab riêng.
         </p>
        </div>

        <LessonDraftMetadataForm draft={draft} />
       </div>
      </Card>
     </div>
    )}

    {activeTab === "vocab" && <VocabDraftImporter draft={draft} reviewOnly />}
    {activeTab === "grammar" && (
     <GrammarDraftImporter draft={draft} reviewOnly />
    )}

    {activeTab === "preview" && (
     <Card padding="lg" className="rounded-xl">
      <div className="grid gap-3">
       <FileText className="h-6 w-6 text-text-muted" />
       <h2 className="text-xl font-black text-text-primary">Preview</h2>
       <p className="text-sm font-semibold text-text-muted">
        Preview sẽ render draft như một lesson thật sau khi vocab/grammar editor
        có dữ liệu.
       </p>
      </div>
     </Card>
    )}
   </div>

   <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>Xác nhận xóa bài nháp</DialogTitle>
      <DialogDescription>
       Bài nháp “{draft.titleZh}” sẽ bị xóa khỏi danh sách draft. Hành động này
       không thể hoàn tác.
      </DialogDescription>
     </DialogHeader>

     <DialogFooter>
      <Button
       type="button"
       variant="outline"
       disabled={deleteMutation.isPending}
       onClick={() => setDeleteDialogOpen(false)}
      >
       Hủy
      </Button>

      <Button
       type="button"
       variant="destructive"
       disabled={deleteMutation.isPending}
       onClick={() => void handleDelete()}
      >
       <Trash2 className="h-4 w-4" />
       {deleteMutation.isPending ? "Đang xóa..." : "Xóa bài nháp"}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>

   <Dialog open={markdownImportOpen} onOpenChange={setMarkdownImportOpen}>
    <DialogContent className="max-h-[94vh] max-w-6xl overflow-hidden">
     <DialogHeader>
      <DialogTitle>Import Markdown</DialogTitle>
      <DialogDescription>
       Dán markdown AI-generated để parse cấu trúc và xem mapping theo profile.
       Chỉ ghi vào draft khi bấm Apply.
      </DialogDescription>
     </DialogHeader>

     <MarkdownImportPreview draft={draft} />
    </DialogContent>
   </Dialog>
  </main>
 );
}
