"use client";

import { FileText } from "lucide-react";

import type { NoteListItem } from "@/services/notes.service";
import type { LessonLookup } from "./noteContext";
import { NoteCreateDialog } from "./NoteCreateDialog";
import { NoteImportButton } from "./NoteImportButton";
import { NoteListRow } from "./NoteListRow";

export function NoteList({
 notes,
 lessonLookup,
}: {
 notes: NoteListItem[];
 lessonLookup: LessonLookup;
}) {
 if (notes.length === 0) {
  return (
   <div className="flex flex-1 items-center justify-center bg-bg-primary px-4 py-10 sm:px-6 lg:px-8">
    <div className="grid max-w-sm gap-4 rounded-2xl border border-border-default bg-bg-card p-6 text-center shadow-theme-sm">
     <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-bg-subtle text-text-muted">
      <FileText className="h-6 w-6" />
     </div>
     <div className="grid gap-1">
      <h2 className="text-lg font-bold text-text-primary">Chưa có ghi chú phù hợp</h2>
      <p className="text-sm font-medium text-text-muted">
       Thử đổi bộ lọc, import file note hoặc tạo ghi chú mới.
      </p>
     </div>
     <div className="flex justify-center gap-2 pt-1">
      <NoteImportButton />
      <NoteCreateDialog />
     </div>
    </div>
   </div>
  );
 }

 return (
  <div className="min-h-0 flex-1 overflow-y-auto bg-bg-primary px-3 py-3 scrollbar-soft sm:px-4 lg:px-6 lg:py-4 xl:px-8">
   <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-theme-sm">
    {notes.map((note) => (
     <NoteListRow key={note.id} note={note} lessonLookup={lessonLookup} />
    ))}
   </div>
  </div>
 );
}
