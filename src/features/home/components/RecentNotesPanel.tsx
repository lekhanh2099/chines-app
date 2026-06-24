import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { ArrowRight, Clock3, FileText } from "lucide-react";

import type { NoteListItem } from "@/services/notes.service";

export function RecentNotesPanel({ notes }: { notes: NoteListItem[] }) {
 return (
  <section className="nova-glass-panel rounded-2xl p-4 sm:p-5" aria-labelledby="recent-notes-title">
   <div className="flex items-center justify-between gap-3">
    <div>
     <h2 id="recent-notes-title" className="text-lg font-black text-text-primary">
      Ghi chú mới cập nhật
     </h2>
     <p className="mt-0.5 text-sm font-medium text-text-muted">
      Tiếp tục các note đang dùng gần đây.
     </p>
    </div>
    <Link
     href="/notes"
     className="flex shrink-0 items-center gap-1 text-sm font-bold text-accent-text"
    >
     Xem tất cả <ArrowRight className="h-4 w-4" />
    </Link>
   </div>

   {notes.length > 0 ? (
    <div className="mt-4 divide-y divide-border-default/70">
     {notes.map((note) => (
      <Link
       key={note.id}
       href={`/notes/${note.id}`}
       className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
      >
       <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-subtle text-text-secondary">
        <FileText className="h-4 w-4" />
       </span>
       <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-text-primary group-hover:text-accent-text">
         {note.title || "Ghi chú chưa đặt tên"}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-text-muted">
         <Clock3 className="h-3 w-3" />
         {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true, locale: vi })}
        </span>
       </span>
       <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
      </Link>
     ))}
    </div>
   ) : (
    <div className="mt-4 rounded-xl border border-dashed border-border-default px-4 py-6 text-center">
     <p className="text-sm font-bold text-text-secondary">Chưa có ghi chú gần đây.</p>
     <Link
      href="/notes?action=new"
      className="mt-2 inline-block text-sm font-bold text-accent-text"
     >
      Tạo ghi chú đầu tiên
     </Link>
    </div>
   )}
  </section>
 );
}
