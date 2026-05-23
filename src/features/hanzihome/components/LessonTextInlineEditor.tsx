"use client";

import { FileText, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

import { Editor } from "@/components/editor/Editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { useCreateLessonLinkedNote } from "@/features/notes/hooks/useCreateLessonLinkedNote";
import { useLessonLinkedNote } from "@/features/notes/hooks/useLessonLinkedNote";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";

type LessonTextInlineEditorProps = {
 lesson: HanziHomeLesson;
};

function createLessonTextInitialContent(
 lesson: HanziHomeLesson,
): Record<string, unknown> {
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
       text: `Bài khóa: ${lesson.title}`,
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
       text: "Dán hoặc soạn nội dung bài khóa ở đây...",
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

function LessonTextEditorBody({ noteId }: { noteId: string }) {
 const { note, isLoading, saveContent, isSaving } = useNoteDetail(noteId);

 if (isLoading) {
  return (
   <div className="rounded-2xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
    Đang tải bài khóa...
   </div>
  );
 }

 if (!note) {
  return (
   <div className="rounded-2xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
    Không tìm thấy bài khóa đã gắn với lesson này.
   </div>
  );
 }

 return (
  <div className="grid gap-2">
   <div className="min-h-56 rounded-2xl border border-border-default bg-bg-primary">
    <Editor
     key={`lesson-text-${note.id}`}
     initialContent={note.content as Record<string, unknown> | null}
     onChange={saveContent}
     seamless
    />
   </div>

   <div className="flex items-center justify-end gap-2 text-xs font-bold text-text-muted">
    <Save className="h-3.5 w-3.5" />
    {isSaving ? "Đang lưu bài khóa..." : "Autosave đang bật"}
   </div>
  </div>
 );
}

export function LessonTextInlineEditor({
 lesson,
}: LessonTextInlineEditorProps) {
 const linkedTextQuery = useLessonLinkedNote(lesson.id, "lesson_text");
 const createTextMutation = useCreateLessonLinkedNote();

 const note = linkedTextQuery.data;

 const handleCreate = () => {
  createTextMutation.mutate(
   {
    lessonId: lesson.id,
    relationType: "lesson_text",
    title: `Bài khóa: ${lesson.title}`,
    category: "general",
    tags: ["hanzihome", lesson.id, "lesson-text"],
    content: createLessonTextInitialContent(lesson),
   },
   {
    onSuccess: () => {
     toast.success("Đã tạo bài khóa");
    },
    onError: () => {
     toast.error("Không tạo được bài khóa");
    },
   },
  );
 };

 return (
  <Card padding="lg" className="rounded-2xl ">
   <div className="grid gap-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
     <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bg-subtle">
       <FileText className="h-5 w-5" />
      </span>

      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Lesson text
       </p>
       <h2 className="mt-1 text-xl font-black text-text-primary">Bài khóa</h2>
      </div>
     </div>

     {!note && (
      <Button
       type="button"
       disabled={linkedTextQuery.isLoading || createTextMutation.isPending}
       onClick={handleCreate}
      >
       {linkedTextQuery.isLoading || createTextMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
       ) : (
        <Plus className="h-4 w-4" />
       )}
       Tạo bài khóa
      </Button>
     )}
    </div>

    {linkedTextQuery.isLoading ? (
     <div className="rounded-2xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
      Đang kiểm tra bài khóa...
     </div>
    ) : note ? (
     <LessonTextEditorBody noteId={note.id} />
    ) : (
     <button
      type="button"
      onClick={handleCreate}
      disabled={createTextMutation.isPending}
      className="rounded-2xl border border-dashed border-border-default bg-bg-subtle p-5 text-left text-sm font-semibold text-text-muted transition-colors hover:border-accent-muted hover:bg-accent-subtle disabled:cursor-not-allowed disabled:opacity-60"
     >
      Chưa có bài khóa cho lesson này. Bấm vào đây để tạo vùng soạn bài khóa.
     </button>
    )}
   </div>
  </Card>
 );
}
