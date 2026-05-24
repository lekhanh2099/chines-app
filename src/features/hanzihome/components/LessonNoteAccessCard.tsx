"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

import { Editor } from "@/components/editor/Editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { useCreateLessonLinkedNote } from "@/features/notes/hooks/useCreateLessonLinkedNote";
import { useLessonLinkedNote } from "@/features/notes/hooks/useLessonLinkedNote";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";

type LessonNoteAccessCardProps = {
 lesson: HanziHomeLesson;
};

type MobilePane = "reading" | "note";

function textNode(text: string, format = 0) {
 return {
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text,
  type: "text",
  version: 1,
 };
}

function paragraph(text: string) {
 return {
  children: [textNode(text)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "paragraph",
  version: 1,
  textFormat: 0,
  textStyle: "",
 };
}

function heading(text: string, tag: "h1" | "h2" | "h3" = "h2") {
 return {
  children: [textNode(text, 1)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "heading",
  tag,
  version: 1,
 };
}

function createLessonReadingContent(
 lesson: HanziHomeLesson,
): Record<string, unknown> {
 const grammarLines = lesson.grammar.slice(0, 8).map((point, index) => {
  const structure = point.structuresView[0]
   ? ` — ${point.structuresView[0]}`
   : "";

  return `${index + 1}. ${point.cleanTitle}${structure}`;
 });

 const vocabLines = lesson.vocab.slice(0, 20).map((word, index) => {
  return `${index + 1}. ${word.word} — ${word.pinyin} — ${word.meaning}`;
 });

 return {
  root: {
   children: [
    heading(`Bài ${lesson.lessonNumber}: ${lesson.titleZh}`, "h1"),
    paragraph(""),
    heading("Chốt mẫu cần nhớ", "h2"),
    ...(grammarLines.length > 0
     ? grammarLines.map(paragraph)
     : [paragraph("Chưa có ngữ pháp trong bài này.")]),
    paragraph(""),
    heading("Từ vựng trọng tâm", "h2"),
    ...(vocabLines.length > 0
     ? vocabLines.map(paragraph)
     : [paragraph("Chưa có từ vựng trong bài này.")]),
   ],
   direction: "ltr",
   format: "",
   indent: 0,
   type: "root",
   version: 1,
  },
 };
}

function createPersonalNoteContent(
 lesson: HanziHomeLesson,
): Record<string, unknown> {
 return {
  root: {
   children: [
    heading(`Ghi chú: ${lesson.title}`, "h2"),
    paragraph(""),
    paragraph("Những điểm dễ quên: "),
    paragraph(""),
    paragraph("Câu mẫu tự đặt: "),
    paragraph(""),
    paragraph("Lỗi sai của mình: "),
   ],
   direction: "ltr",
   format: "",
   indent: 0,
   type: "root",
   version: 1,
  },
 };
}

function PaneToggle({
 activePane,
 onChange,
}: {
 activePane: MobilePane;
 onChange: (pane: MobilePane) => void;
}) {
 return (
  <div className="grid grid-cols-2 gap-2 rounded-xl bg-bg-subtle p-1 lg:hidden">
   <button
    type="button"
    onClick={() => onChange("reading")}
    className={[
     "rounded-xl px-3 py-2 text-sm font-black transition-colors",
     activePane === "reading"
      ? "bg-bg-primary text-text-primary shadow-theme-sm"
      : "text-text-muted",
    ].join(" ")}
   >
    Bài đọc
   </button>

   <button
    type="button"
    onClick={() => onChange("note")}
    className={[
     "rounded-xl px-3 py-2 text-sm font-black transition-colors",
     activePane === "note"
      ? "bg-bg-primary text-text-primary shadow-theme-sm"
      : "text-text-muted",
    ].join(" ")}
   >
    Ghi chú
   </button>
  </div>
 );
}

function ReadingPane({
 noteId,
 readingContent,
 onSave,
 className = "",
}: {
 noteId: string;
 readingContent: Record<string, unknown>;
 onSave: (content: Record<string, unknown>) => void;
 className?: string;
}) {
 return (
  <section className={className}>
   <div className="border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-700">
    Bài đọc
   </div>

   <Editor
    key={`lesson-reading-${noteId}`}
    initialContent={readingContent}
    onChange={onSave}
    seamless
   />
  </section>
 );
}

function NotePane({
 noteId,
 content,
 onSave,
 className = "",
}: {
 noteId: string;
 content: Record<string, unknown> | null;
 onSave: (content: Record<string, unknown>) => void;
 className?: string;
}) {
 return (
  <section className={className}>
   <div className="border-b border-orange-100 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-orange-700">
    Ghi chú
   </div>

   <Editor
    key={`lesson-note-${noteId}`}
    initialContent={content}
    onChange={onSave}
    seamless
   />
  </section>
 );
}

function LessonSplitNoteEditor({
 lesson,
 noteId,
}: {
 lesson: HanziHomeLesson;
 noteId: string;
}) {
 const [mobilePane, setMobilePane] = useState<MobilePane>("note");

 const {
  note,
  isLoading,
  saveContent,
  saveReadingContent,
  isSaving,
  isReadingSaving,
  updateSplitView,
 } = useNoteDetail(noteId);

 if (isLoading) {
  return (
   <div className="rounded-xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
    Đang tải note của bài...
   </div>
  );
 }

 if (!note) {
  return (
   <div className="rounded-xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
    Không tìm thấy note đã gắn với bài này.
   </div>
  );
 }

 const readingContent =
  note.reading_content ?? createLessonReadingContent(lesson);
 const splitEnabled = note.split_view_enabled ?? true;

 const handleToggleSplit = () => {
  updateSplitView(!splitEnabled);
 };

 return (
  <div className="grid gap-3">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap gap-2">
     <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
      Bài đọc
     </span>
     <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-orange-700">
      Ghi chú
     </span>
    </div>

    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
     <span className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted">
      <Save className="h-3.5 w-3.5" />
      {isSaving || isReadingSaving ? "Đang lưu..." : "Autosave"}
     </span>

     <Button type="button" variant="outline" onClick={handleToggleSplit}>
      {splitEnabled ? "Đóng Split" : "Mở Split"}
     </Button>

     <Button asChild variant="outline">
      <Link href={`/notes/${note.id}`}>
       <ExternalLink className="h-4 w-4" />
       Mở note
      </Link>
     </Button>
    </div>
   </div>

   {splitEnabled && (
    <PaneToggle activePane={mobilePane} onChange={setMobilePane} />
   )}

   {splitEnabled ? (
    <>
     <div className="hidden min-h-136 overflow-hidden rounded-xl border border-border-default bg-bg-primary lg:grid lg:grid-cols-2">
      <ReadingPane
       noteId={note.id}
       readingContent={readingContent as Record<string, unknown>}
       onSave={saveReadingContent}
       className="min-h-0 border-r border-border-default"
      />

      <NotePane
       noteId={note.id}
       content={note.content as Record<string, unknown> | null}
       onSave={saveContent}
       className="min-h-0"
      />
     </div>

     <div className="min-h-112 overflow-hidden rounded-xl border border-border-default bg-bg-primary lg:hidden">
      {mobilePane === "reading" ? (
       <ReadingPane
        noteId={note.id}
        readingContent={readingContent as Record<string, unknown>}
        onSave={saveReadingContent}
        className="min-h-0"
       />
      ) : (
       <NotePane
        noteId={note.id}
        content={note.content as Record<string, unknown> | null}
        onSave={saveContent}
        className="min-h-0"
       />
      )}
     </div>
    </>
   ) : (
    <div className="min-h-112 overflow-hidden rounded-xl border border-border-default bg-bg-primary sm:min-h-136">
     <NotePane
      noteId={note.id}
      content={note.content as Record<string, unknown> | null}
      onSave={saveContent}
      className="min-h-0"
     />
    </div>
   )}
  </div>
 );
}

export function LessonNoteAccessCard({ lesson }: LessonNoteAccessCardProps) {
 const linkedNoteQuery = useLessonLinkedNote(lesson.id, "main");
 const createNoteMutation = useCreateLessonLinkedNote();

 const note = linkedNoteQuery.data;
 const isCreating = createNoteMutation.isPending;

 const handleCreate = () => {
  createNoteMutation.mutate(
   {
    lessonId: lesson.id,
    relationType: "main",
    title: `Ghi chú: ${lesson.title}`,
    category: "general",
    tags: ["hanzihome", lesson.id, "lesson-note"],
    content: createPersonalNoteContent(lesson),
   },
   {
    onSuccess: () => {
     toast.success("Đã tạo note cho bài học");
    },
    onError: () => {
     toast.error("Không tạo được note cho bài học");
    },
   },
  );
 };

 return (
  <Card padding="lg" className="rounded-xl">
   <div className="grid gap-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
     <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
       <FileText className="h-5 w-5" />
      </span>

      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Lesson note
       </p>
       <h2 className="text-xl font-black text-text-primary">
        Ghi chú riêng của bài
       </h2>
       <p className="text-sm font-semibold text-text-muted">
        Desktop có split view. Mobile dùng nút chuyển Bài đọc / Ghi chú để đỡ
        rối.
       </p>
      </div>
     </div>

     {!note && (
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
       Tạo note cho bài
      </Button>
     )}
    </div>

    {linkedNoteQuery.isLoading ? (
     <div className="rounded-xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
      Đang kiểm tra note...
     </div>
    ) : note ? (
     <LessonSplitNoteEditor lesson={lesson} noteId={note.id} />
    ) : (
     <button
      type="button"
      onClick={handleCreate}
      disabled={isCreating}
      className="rounded-xl border border-dashed border-border-default bg-bg-subtle p-4 text-left text-sm font-semibold text-text-muted transition-colors hover:border-accent-muted hover:bg-accent-subtle disabled:cursor-not-allowed disabled:opacity-60"
     >
      Chưa có note cho bài này. Bấm để tạo split note.
     </button>
    )}
   </div>
  </Card>
 );
}
