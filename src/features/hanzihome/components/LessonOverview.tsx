"use client";

import { useMemo, useState } from "react";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/LessonNoteAccessCard";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import {
 deleteLessonOverviewMarkdownSection,
 parseLessonOverviewMarkdownSections,
 updateLessonOverviewMarkdownSection,
} from "@/features/hanzihome/importer/lesson-overview-markdown";
import {
 useLessonDraftQuery,
 useUpdateLessonDraftMutation,
} from "@/features/hanzihome/lesson-drafts";
import {
 createEmptyLessonDraftNotes,
 lessonDraftNotesSchema,
} from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import { cn } from "@/lib/utils";
import type {
 HanziHomeLesson,
 HanziHomeModule,
 UserLearningState,
} from "@/features/hanzihome/types";
import type { LessonDraft } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";

type LessonOverviewProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 onOpenModule: (module: HanziHomeModule) => void;
};

function getDraftNotes(draft: LessonDraft) {
 const parsed = lessonDraftNotesSchema.safeParse(draft.content.lesson.notes);

 return parsed.success ? parsed.data : createEmptyLessonDraftNotes();
}

export function LessonOverview({ lesson, onOpenModule }: LessonOverviewProps) {
 const overviewMarkdown = lesson.notes?.overviewMarkdown?.trim();
 const editableDraftId =
  lesson.draftId ??
  (lesson.isDbBacked && lesson.courseId !== "hanyu-jiaocheng"
   ? lesson.id
   : null);
 const draftQuery = useLessonDraftQuery(editableDraftId);
 const updateDraftMutation = useUpdateLessonDraftMutation();
 const editableDraft = draftQuery.data ?? null;
 const sections = useMemo(
  () => parseLessonOverviewMarkdownSections(overviewMarkdown ?? ""),
  [overviewMarkdown],
 );
 const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
 const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
 const [editContent, setEditContent] = useState("");
 const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
 const selectedSection =
  sections.find((section) => section.id === selectedSectionId) ??
  sections[0] ??
  null;
 const canEdit = Boolean(editableDraftId);
 const isEditing =
  Boolean(selectedSection) && editingSectionId === selectedSection?.id;

 const startEdit = () => {
  if (!selectedSection) return;
  setEditingSectionId(selectedSection.id);
  setEditContent(selectedSection.content);
 };

 const saveSection = async () => {
  if (!editableDraft || !selectedSection) {
   toast.error("Chưa tải xong dữ liệu để sửa.");
   return;
  }

  const currentNotes = getDraftNotes(editableDraft);
  const nextOverviewMarkdown = updateLessonOverviewMarkdownSection({
   markdown: currentNotes.overviewMarkdown,
   sectionId: selectedSection.id,
   nextContent: editContent,
  });

  await updateDraftMutation.mutateAsync({
   draftId: editableDraft.id,
   input: {
    content: {
     ...editableDraft.content,
     lesson: {
      ...editableDraft.content.lesson,
      notes: {
       ...currentNotes,
       overviewMarkdown: nextOverviewMarkdown,
      },
     },
    },
   },
  });

  setEditingSectionId(null);
  setEditContent("");
  toast.success("Đã lưu đề mục.");
 };

 const deleteSection = async () => {
  if (!editableDraft || !selectedSection) {
   toast.error("Chưa tải xong dữ liệu để xóa.");
   return;
  }

  const currentNotes = getDraftNotes(editableDraft);
  const nextOverviewMarkdown = deleteLessonOverviewMarkdownSection({
   markdown: currentNotes.overviewMarkdown,
   sectionId: selectedSection.id,
  });

  await updateDraftMutation.mutateAsync({
   draftId: editableDraft.id,
   input: {
    content: {
     ...editableDraft.content,
     lesson: {
      ...editableDraft.content.lesson,
      notes: {
       ...currentNotes,
       overviewMarkdown: nextOverviewMarkdown,
      },
     },
    },
   },
  });

  setSelectedSectionId(null);
  setEditingSectionId(null);
  setEditContent("");
  setDeleteDialogOpen(false);
  toast.success("Đã xóa đề mục.");
 };

 return (
  <div className="grid gap-3">
   {selectedSection ? (
    <Card padding="lg" className="rounded-xl">
     <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div>
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         Bài học
        </p>
        <h2 className="text-xl font-black text-text-primary">
         Nội dung tổng quan
        </h2>
        <p className="text-sm font-semibold text-text-muted">
         {sections.length} đề mục · chọn từng phần để học, không cần kéo hết bài.
        </p>
       </div>

       <div className="flex flex-wrap gap-2">
        <Button
         type="button"
         variant="outline"
         size="sm"
         onClick={() => onOpenModule("grammar")}
        >
         Mở ngữ pháp
        </Button>

        {canEdit ? (
         <>
          <Button
           type="button"
           variant="ghost"
           size="sm"
           disabled={draftQuery.isLoading || updateDraftMutation.isPending}
           onClick={isEditing ? () => setEditingSectionId(null) : startEdit}
          >
           {isEditing ? (
            <X className="h-4 w-4" />
           ) : (
            <Pencil className="h-4 w-4" />
           )}
           {isEditing ? "Hủy sửa" : "Sửa đề mục"}
          </Button>

          <Button
           type="button"
          variant="ghost"
          size="sm"
          disabled={draftQuery.isLoading || updateDraftMutation.isPending}
           onClick={() => setDeleteDialogOpen(true)}
          >
           <Trash2 className="h-4 w-4" />
           Xóa
          </Button>
         </>
        ) : null}
       </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
       <div className="grid max-h-[28rem] content-start gap-2 overflow-y-auto pr-1">
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

       <section className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-4">
        <h3 className="mb-3 text-lg font-black text-text-primary">
         {selectedSection.title}
        </h3>
        {isEditing ? (
         <div className="grid gap-3">
          <Textarea
           value={editContent}
           onChange={(event) => setEditContent(event.target.value)}
           className="min-h-72 font-mono text-sm leading-relaxed"
          />

          <div className="flex justify-end">
           <Button
            type="button"
            disabled={updateDraftMutation.isPending}
            isLoading={updateDraftMutation.isPending}
            onClick={() => void saveSection()}
           >
            <Save className="h-4 w-4" />
            Lưu đề mục
           </Button>
          </div>
         </div>
        ) : (
         <div className="max-h-[32rem] overflow-y-auto pr-2">
          <MarkdownContent
           content={selectedSection.content || selectedSection.title}
          />
         </div>
        )}
       </section>
      </div>
     </div>
    </Card>
   ) : null}

   <LessonNoteAccessCard lesson={lesson} />

   <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>Xóa đề mục bài học</DialogTitle>
      <DialogDescription>
       Đề mục “{selectedSection?.title}” sẽ bị xóa khỏi nội dung tổng quan.
       Hành động này không thể hoàn tác.
      </DialogDescription>
     </DialogHeader>

     <DialogFooter>
      <Button
       type="button"
       variant="outline"
       disabled={updateDraftMutation.isPending}
       onClick={() => setDeleteDialogOpen(false)}
      >
       Hủy
      </Button>

      <Button
       type="button"
       variant="destructive"
       disabled={updateDraftMutation.isPending}
       isLoading={updateDraftMutation.isPending}
       onClick={() => void deleteSection()}
      >
       <Trash2 className="h-4 w-4" />
       Xóa đề mục
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 );
}
