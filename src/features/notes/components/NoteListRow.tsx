"use client";

import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { BookOpen, Clock, FileText, NotebookPen, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NoteListItem } from "@/services/notes.service";
import type { LessonLookup } from "./noteContext";
import { getNoteContext } from "./noteContext";

const contextIconClassName = "h-4 w-4 shrink-0";

function getContextIcon(kind: ReturnType<typeof getNoteContext>["kind"]) {
 if (kind === "lesson") return <BookOpen className={contextIconClassName} />;
 if (kind === "quick") return <Zap className={contextIconClassName} />;
 return <NotebookPen className={contextIconClassName} />;
}

function getContextClasses(kind: ReturnType<typeof getNoteContext>["kind"]) {
 if (kind === "lesson") return "border-info/30 bg-info-subtle text-info-text";
 if (kind === "quick") return "border-warning/30 bg-warning-subtle text-warning-text";
 return "border-border-default bg-bg-subtle text-text-secondary";
}

export function NoteListRow({
 note,
 lessonLookup,
}: {
 note: NoteListItem;
 lessonLookup: LessonLookup;
}) {
 const context = getNoteContext(note, lessonLookup);
 const updatedAt = format(new Date(note.updated_at), "dd/MM/yy", { locale: vi });

 return (
  <Link
   href={`/notes/${note.id}`}
   className="group grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border-default px-5 py-4 transition-colors hover:bg-bg-card-hover sm:px-8"
  >
   <div className="flex min-w-0 items-start gap-3">
    <span
     className={cn(
      "mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border",
      getContextClasses(context.kind),
     )}
    >
     {getContextIcon(context.kind)}
    </span>

    <div className="min-w-0 grid gap-2">
     <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="truncate font-bold text-text-primary transition-colors group-hover:text-text-primary/80">
       {note.title || "Ghi chú chưa đặt tên"}
      </span>
      <Badge variant={context.kind === "lesson" ? "info" : "default"} size="sm">
       {context.title}
      </Badge>
     </div>

     <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-text-muted">
      <span className="truncate">{context.subtitle}</span>
      {context.relationLabel ? <span className="text-text-muted/60">/</span> : null}
      {context.relationLabel ? <span>{context.relationLabel}</span> : null}
     </div>

     {context.badges.length > 0 ? (
      <div className="flex flex-wrap gap-1.5">
       {context.badges.slice(0, 4).map((badge) => (
        <span
         key={badge}
         className="rounded-full border border-border-default bg-bg-primary px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-[0.14em] text-text-muted"
        >
         {badge}
        </span>
       ))}
      </div>
     ) : null}
    </div>
   </div>

   <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
    <FileText className="hidden h-3.5 w-3.5 sm:block" />
    <Clock className="h-3.5 w-3.5" />
    <span className="tabular-nums">{updatedAt}</span>
   </div>
  </Link>
 );
}
