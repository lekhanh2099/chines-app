"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
 usePublishLessonDraftMutation,
 useUpdateLessonDraftMutation,
} from "@/features/hanzihome/lesson-drafts";
import { LessonDraftMetadataForm } from "@/features/hanzihome/lesson-drafts/components/LessonDraftMetadataForm";
import { VocabDraftImporter } from "@/features/hanzihome/lesson-drafts/components/VocabDraftImporter";
import { GrammarDraftImporter } from "@/features/hanzihome/lesson-drafts/components/GrammarDraftImporter";
import { MarkdownImportPreview } from "@/features/hanzihome/importer/MarkdownImportPreview";
import {
 SmartGrammarImport,
 SmartLessonImport,
} from "@/features/hanzihome/importer/SmartMarkdownImport";
import {
 parseLessonOverviewMarkdownSections,
 updateLessonOverviewMarkdownSection,
} from "@/features/hanzihome/importer/lesson-overview-markdown";
import {
 createEmptyLessonDraftNotes,
 lessonDraftNotesSchema,
} from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import type { LessonDraft } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { cn } from "@/lib/utils";

type LessonDraftEditorProps = {
 draftId: string;
};

type DraftEditorTab =
 | "overview"
 | "vocab"
 | "grammar"
 | "lessonImport"
 | "grammarImport"
 | "import"
 | "preview";

const editorTabs: Array<{
 key: DraftEditorTab;
 label: string;
}> = [
 { key: "overview", label: "Tổng quan" },
 { key: "vocab", label: "Từ vựng" },
 { key: "grammar", label: "Ngữ pháp" },
 { key: "lessonImport", label: "Import bài học" },
 { key: "grammarImport", label: "Import ngữ pháp" },
 { key: "import", label: "Import vocab" },
 { key: "preview", label: "Preview" },
];

function parseEditorTab(value: string | null): DraftEditorTab {
 if (value === "smartImport") return "grammarImport";

 return value === "overview" ||
  value === "vocab" ||
  value === "grammar" ||
  value === "lessonImport" ||
  value === "grammarImport" ||
  value === "import" ||
  value === "preview"
  ? value
  : "overview";
}

function getDraftNotes(draft: LessonDraft) {
 const parsed = lessonDraftNotesSchema.safeParse(draft.content.lesson.notes);

 return parsed.success ? parsed.data : createEmptyLessonDraftNotes();
}

function buildWorkspaceHref({
 courseId,
 lessonId,
}: {
 courseId?: string | null;
 lessonId?: string | null;
}) {
 const params = new URLSearchParams();

 if (courseId) params.set("courseId", courseId);
 if (lessonId) params.set("lessonId", lessonId);

 const query = params.toString();

 return query ? `/hanzihome?${query}` : "/hanzihome";
}

export function LessonDraftEditor({ draftId }: LessonDraftEditorProps) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [activeTab, setActiveTab] = useState<DraftEditorTab>(
  parseEditorTab(searchParams.get("tab")),
 );
 const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

 const draftQuery = useLessonDraftQuery(draftId);
 const deleteMutation = useDeleteLessonDraftMutation();
 const publishMutation = usePublishLessonDraftMutation();
 const updateDraftMutation = useUpdateLessonDraftMutation();

 const draft = draftQuery.data;
 const backHref = draft
  ? buildWorkspaceHref({
     courseId:
      draft.content.lesson.courseId ?? searchParams.get("courseId") ?? undefined,
     lessonId: draft.lessonKey || draft.content.lesson.id || draft.id,
    })
  : buildWorkspaceHref({
     courseId: searchParams.get("courseId"),
     lessonId: draftId.includes("__") ? draftId : null,
    });

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

 const handlePublish = async () => {
  if (!draft) return;

  const result = await publishMutation.mutateAsync(draft.id);

  toast.success("Đã publish bài học");
  router.push(
   `/hanzihome?courseId=${encodeURIComponent(
    result.courseId,
   )}&lessonId=${encodeURIComponent(result.lessonId)}`,
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
        <Link href={backHref}>
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
        <Link href={backHref}>
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
        variant={draft.status === "published" ? "outline" : "default"}
        disabled={publishMutation.isPending}
        isLoading={publishMutation.isPending}
        onClick={() => void handlePublish()}
       >
        {draft.status === "published" ? "Publish lại" : "Publish"}
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
        {(tab.key === "lessonImport" ||
         tab.key === "grammarImport" ||
         tab.key === "import") && (
         <Upload className="h-4 w-4" />
        )}
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

      <LessonOverviewSectionEditor
       draft={draft}
       isSaving={updateDraftMutation.isPending}
       onSave={async ({ sectionId, content }) => {
        const currentNotes = getDraftNotes(draft);
        const overviewMarkdown = updateLessonOverviewMarkdownSection({
         markdown: currentNotes.overviewMarkdown,
         sectionId,
         nextContent: content,
        });

        await updateDraftMutation.mutateAsync({
         draftId: draft.id,
         input: {
          content: {
           ...draft.content,
           lesson: {
            ...draft.content.lesson,
            notes: {
             ...currentNotes,
             overviewMarkdown,
            },
           },
          },
         },
        });

        toast.success("Đã lưu đề mục bài học.");
       }}
      />
     </div>
    )}

    {activeTab === "vocab" && <VocabDraftImporter draft={draft} reviewOnly />}
    {activeTab === "grammar" && (
     <GrammarDraftImporter draft={draft} reviewOnly />
    )}

    {activeTab === "lessonImport" && <SmartLessonImport draft={draft} />}

    {activeTab === "grammarImport" && <SmartGrammarImport draft={draft} />}

    {activeTab === "import" && <MarkdownImportPreview draft={draft} />}

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
  </main>
 );
}

function LessonOverviewSectionEditor({
 draft,
 isSaving,
 onSave,
}: {
 draft: LessonDraft;
 isSaving: boolean;
 onSave: (input: { sectionId: string; content: string }) => Promise<void>;
}) {
 const notes = getDraftNotes(draft);
 const sections = useMemo(
  () => parseLessonOverviewMarkdownSections(notes.overviewMarkdown),
  [notes.overviewMarkdown],
 );
 const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
 const [sectionEdits, setSectionEdits] = useState<Record<string, string>>({});
 const selectedSection =
  sections.find((section) => section.id === selectedSectionId) ??
  sections[0] ??
  null;
 const selectedValue = selectedSection
  ? sectionEdits[selectedSection.id] ?? selectedSection.content
  : "";

 if (sections.length === 0 || !selectedSection) {
  return (
   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-3">
     <div>
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Nội dung bài học
      </p>
      <h2 className="text-xl font-black text-text-primary">
       Chưa có nội dung tổng quan
      </h2>
      <p className="text-sm font-semibold text-text-muted">
       Dùng tab Import bài học để paste markdown và tạo các đề mục học.
      </p>
     </div>
    </div>
   </Card>
  );
 }

 return (
  <Card padding="lg" className="rounded-xl">
   <div className="grid gap-4">
    <div>
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Nội dung bài học
     </p>
     <h2 className="text-xl font-black text-text-primary">
      Sửa theo từng đề mục
     </h2>
     <p className="text-sm font-semibold text-text-muted">
      Nội dung này render trong tab Tổng quan. Sửa từng phần rồi lưu, không cần
      import lại cả bài.
     </p>
    </div>

    <div className="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
     <div className="grid max-h-[32rem] content-start gap-2 overflow-y-auto pr-1">
      {sections.map((section, index) => (
       <button
        key={section.id}
        type="button"
        onClick={() => setSelectedSectionId(section.id)}
        className={cn(
         "rounded-xl border p-3 text-left transition-colors",
         selectedSection.id === section.id
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-default bg-bg-primary hover:bg-bg-subtle",
        )}
       >
        <span className="line-clamp-2 text-sm font-black">
         {index + 1}. {section.title}
        </span>
        <span
         className={cn(
          "mt-1 block text-xs font-bold",
          selectedSection.id === section.id
           ? "text-primary-foreground/80"
           : "text-text-muted",
         )}
        >
         H{section.level}
        </span>
       </button>
      ))}
     </div>

     <div className="grid gap-3">
      <div className="rounded-xl border border-border-default bg-bg-subtle p-3">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Đề mục đang sửa
       </p>
       <h3 className="text-lg font-black text-text-primary">
        {selectedSection.title}
       </h3>
      </div>

      <Textarea
       value={selectedValue}
       onChange={(event) =>
        setSectionEdits((current) => ({
         ...current,
         [selectedSection.id]: event.target.value,
        }))
       }
       className="min-h-80 font-mono text-sm leading-relaxed"
      />

      <div className="flex justify-end">
       <Button
        type="button"
        disabled={isSaving}
        isLoading={isSaving}
        onClick={() =>
         void onSave({
          sectionId: selectedSection.id,
          content: selectedValue,
         }).then(() => {
          setSectionEdits((current) => {
           const next = { ...current };
           delete next[selectedSection.id];
           return next;
          });
         })
        }
       >
        Lưu đề mục
       </Button>
      </div>
     </div>
    </div>
   </div>
  </Card>
 );
}
