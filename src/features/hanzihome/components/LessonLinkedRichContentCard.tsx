"use client";

import Link from "next/link";
import {
 ExternalLink,
 Loader2,
 Maximize2,
 Pencil,
 Plus,
 Save,
 type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Editor } from "@/components/editor/Editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { useCreateLessonLinkedNote } from "@/features/notes/hooks/useCreateLessonLinkedNote";
import { useLessonLinkedNote } from "@/features/notes/hooks/useLessonLinkedNote";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";
import type { LessonNoteRelationType } from "@/services/notes.service";

type LessonLinkedRichContentCardProps = {
 lesson: HanziHomeLesson;
 relationType: LessonNoteRelationType;
 title: string;
 eyebrow: string;
 description: string;
 emptyText: string;
 createButtonLabel: string;
 editButtonLabel: string;
 toastSuccessText: string;
 toastErrorText: string;
 noteTitle: string;
 tags: string[];
 placeholderText: string;
 icon: LucideIcon;
};

function createInitialContent({
 title,
 placeholderText,
}: {
 title: string;
 placeholderText: string;
}): Record<string, unknown> {
 return {
  root: {
   children: [
    {
     children: [
      {
       detail: 0,
       format: 1,
       mode: "normal",
       style: "",
       text: title,
       type: "text",
       version: 1,
      },
     ],
     direction: "ltr",
     format: "",
     indent: 0,
     type: "heading",
     tag: "h2",
     version: 1,
    },
    {
     children: [
      {
       detail: 0,
       format: 0,
       mode: "normal",
       style: "",
       text: placeholderText,
       type: "text",
       version: 1,
      },
     ],
     direction: "ltr",
     format: "",
     indent: 0,
     type: "paragraph",
     version: 1,
     textFormat: 0,
     textStyle: "",
    },
   ],
   direction: "ltr",
   format: "",
   indent: 0,
   type: "root",
   version: 1,
  },
 };
}

function InlineRichContent({
 noteId,
 editTitle,
 editDescription,
 editButtonLabel,
}: {
 noteId: string;
 editTitle: string;
 editDescription: string;
 editButtonLabel: string;
}) {
 const [editOpen, setEditOpen] = useState(false);
 const queryClient = useQueryClient();
 const { note, isLoading, saveContent, isSaving } = useNoteDetail(noteId);

 const handleEditOpenChange = (nextOpen: boolean) => {
  setEditOpen(nextOpen);

  if (!nextOpen) {
   void queryClient.invalidateQueries({
    queryKey: ["note-detail", noteId],
    exact: true,
   });
  }
 };

 if (isLoading) {
  return (
   <div className="rounded-2xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
    Đang tải nội dung...
   </div>
  );
 }

 if (!note) {
  return (
   <div className="rounded-2xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
    Không tìm thấy nội dung đã gắn với bài này.
   </div>
  );
 }

 return (
  <div className="grid gap-3">
   <div className="max-h-72 overflow-hidden rounded-2xl border border-border-default bg-bg-primary">
    <Editor
     key={`preview-${note.id}-${note.updated_at ?? ""}`}
     initialContent={note.content as Record<string, unknown> | null}
     readOnly
     seamless
    />
   </div>

   <div className="flex flex-wrap justify-end gap-2">
    <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
     <Pencil className="h-4 w-4" />
     {editButtonLabel}
    </Button>

    <Button asChild variant="outline">
     <Link href={`/notes/${noteId}`}>
      <Maximize2 className="h-4 w-4" />
      Mở toàn màn hình
     </Link>
    </Button>
   </div>

   <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
    <DialogContent className="flex h-[90vh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
     <DialogHeader className="shrink-0 border-b border-border-default px-6 py-5">
      <DialogTitle>{editTitle}</DialogTitle>
      <DialogDescription>{editDescription}</DialogDescription>
     </DialogHeader>

     <DialogBody className="min-h-0 flex-1 overflow-y-auto scrollbar-soft  p-0">
      <Editor
       key={`edit-${note.id}`}
       initialContent={note.content as Record<string, unknown> | null}
       onChange={saveContent}
       seamless
      />
     </DialogBody>

     <DialogFooter className="shrink-0 border-t border-border-default bg-bg-card px-6 py-4">
      <div className="flex w-full items-center justify-between gap-3">
       <span className="text-xs font-bold text-text-muted">
        {isSaving ? "Đang lưu..." : "Autosave đang bật"}
       </span>

       <Button type="button" onClick={() => setEditOpen(false)}>
        <Save className="h-4 w-4" />
        Xong
       </Button>
      </div>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 );
}

export function LessonLinkedRichContentCard({
 lesson,
 relationType,
 title,
 eyebrow,
 emptyText,
 createButtonLabel,
 editButtonLabel,
 toastSuccessText,
 toastErrorText,
 noteTitle,
 tags,
 placeholderText,
 icon: Icon,
}: LessonLinkedRichContentCardProps) {
 const linkedNoteQuery = useLessonLinkedNote(lesson.id, relationType);
 const createNoteMutation = useCreateLessonLinkedNote();

 const note = linkedNoteQuery.data;
 const isCreating = createNoteMutation.isPending;

 const handleCreate = () => {
  createNoteMutation.mutate(
   {
    lessonId: lesson.id,
    relationType,
    title: noteTitle,
    category: "general",
    tags,
    content: createInitialContent({
     title: noteTitle,
     placeholderText,
    }),
   },
   {
    onSuccess: () => {
     toast.success(toastSuccessText);
    },
    onError: () => {
     toast.error(toastErrorText);
    },
   },
  );
 };

 return (
  <Card padding="lg" className="rounded-2xl -2xl">
   <div className="grid gap-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
     <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xlbg-bg-subtle">
       <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        {eyebrow}
       </p>
       <h2 className="mt-1 text-xl font-black text-text-primary">{title}</h2>
      </div>
     </div>

     {note ? (
      <Button asChild variant="outline">
       <Link href={`/notes/${note.id}`}>
        <ExternalLink className="h-4 w-4" />
        Mở note
       </Link>
      </Button>
     ) : (
      <Button
       type="button"
       disabled={linkedNoteQuery.isLoading || isCreating}
       onClick={handleCreate}
      >
       {linkedNoteQuery.isLoading || isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
       ) : (
        <Plus className="h-4 w-4" />
       )}
       {createButtonLabel}
      </Button>
     )}
    </div>

    {linkedNoteQuery.isLoading ? (
     <div className="rounded-2xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
      Đang kiểm tra nội dung...
     </div>
    ) : note ? (
     <InlineRichContent
      noteId={note.id}
      editTitle={`Sửa ${title.toLowerCase()}`}
      editDescription="Sửa trực tiếp bằng hệ rich editor chính. Nội dung autosave sau khi nhập."
      editButtonLabel={editButtonLabel}
     />
    ) : (
     <div className="rounded-2xl border border-dashed border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
      {emptyText}
     </div>
    )}
   </div>
  </Card>
 );
}
