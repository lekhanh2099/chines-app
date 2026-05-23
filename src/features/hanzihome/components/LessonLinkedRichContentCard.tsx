"use client";

import Link from "next/link";
import { ExternalLink, Loader2, Plus, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { useCreateLessonLinkedNote } from "@/features/notes/hooks/useCreateLessonLinkedNote";
import { useLessonLinkedNote } from "@/features/notes/hooks/useLessonLinkedNote";
import type { LessonNoteRelationType } from "@/services/notes.service";
import { useNoteTabsStore } from "@/stores/note-tabs-store";
import { NoteEditorPanel } from "@/components/notes/NoteEditorPanel";

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

function InlineRichContent({}: {
 noteId: string;
 editTitle: string;
 editDescription: string;
 editButtonLabel: string;
}) {
 const tabs = useNoteTabsStore((s) => s.tabs);
 const activeNoteId = useNoteTabsStore((s) => s.activeNoteId);

 return (
  <div className="">
   {tabs.map((tab) => (
    <NoteEditorPanel
     key={tab.noteId}
     noteId={tab.noteId}
     isVisible={tab.noteId === activeNoteId}
    />
   ))}
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
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bg-subtle">
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
