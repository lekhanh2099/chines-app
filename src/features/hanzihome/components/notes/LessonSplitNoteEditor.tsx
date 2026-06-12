"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNoteDetail } from "@/features/notes/hooks/useNoteDetail";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";

import { LessonReadingPane } from "./LessonReadingPane";
import { NotePaneToggle } from "./NotePaneToggle";
import { PersonalNotePane } from "./PersonalNotePane";
import { createLessonReadingContent } from "./lessonNoteContent";
import type { MobileNotePane } from "./types";

export function LessonSplitNoteEditor({ noteId }: { noteId: string }) {
 const { lesson } = useHanziHomeRuntime();
 const [mobilePane, setMobilePane] = useState<MobileNotePane>("note");
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
   <div className="rounded-xl border border-border-default bg-bg-subtle p-4  font-semibold text-text-muted">
    Đang tải note của bài...
   </div>
  );
 }

 if (!note) {
  return (
   <div className="rounded-xl border border-border-default bg-bg-subtle p-4  font-semibold text-text-muted">
    Không tìm thấy note đã gắn với bài này.
   </div>
  );
 }

 const readingContent =
  (note.reading_content as Record<string, unknown> | null) ?? createLessonReadingContent(lesson);
 const content = note.content as Record<string, unknown> | null;
 const splitEnabled = note.split_view_enabled ?? true;

 return (
  <div className="grid gap-3">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap gap-2">
     <span className="rounded-full bg-info-subtle px-3 py-1 text-xs font-black uppercase tracking-wide text-info-text">
      Bài đọc
     </span>
     <span className="rounded-full bg-warning-subtle px-3 py-1 text-xs font-black uppercase tracking-wide text-warning-text">
      Ghi chú
     </span>
    </div>
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
     <span className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted">
      <Save className="h-3.5 w-3.5" />
      {isSaving || isReadingSaving ? "Đang lưu..." : "Autosave"}
     </span>
     <Button type="button" variant="outline" onClick={() => updateSplitView(!splitEnabled)}>
     {splitEnabled ? "Đóng Split" : "Mở Split"}
    </Button>
    <Button asChild variant="outline">
      <Link href={`/notes/${note.id}`} prefetch={false}>
       <ExternalLink className="h-4 w-4" />
       Mở note
      </Link>
     </Button>
    </div>
   </div>

   {splitEnabled ? <NotePaneToggle activePane={mobilePane} onChange={setMobilePane} /> : null}

   {splitEnabled ? (
    <>
     <div className="hidden min-h-136 overflow-hidden rounded-xl border border-border-default bg-bg-primary lg:grid lg:grid-cols-2">
      <LessonReadingPane
       noteId={note.id}
       readingContent={readingContent}
       onSave={saveReadingContent}
       className="min-h-0 border-r border-border-default"
      />
      <PersonalNotePane
       noteId={note.id}
       content={content}
       onSave={saveContent}
       className="min-h-0"
      />
     </div>
     <div className="min-h-112 overflow-hidden rounded-xl border border-border-default bg-bg-primary lg:hidden">
      {mobilePane === "reading" ? (
       <LessonReadingPane
        noteId={note.id}
        readingContent={readingContent}
        onSave={saveReadingContent}
        className="min-h-0"
       />
      ) : (
       <PersonalNotePane
        noteId={note.id}
        content={content}
        onSave={saveContent}
        className="min-h-0"
       />
      )}
     </div>
    </>
   ) : (
    <div className="min-h-112 overflow-hidden rounded-xl border border-border-default bg-bg-primary sm:min-h-136">
     <PersonalNotePane
      noteId={note.id}
      content={content}
      onSave={saveContent}
      className="min-h-0"
     />
    </div>
   )}
  </div>
 );
}
