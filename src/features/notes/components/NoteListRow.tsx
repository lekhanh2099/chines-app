"use client";

import { BookOpen, Clock, FileText, NotebookPen, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { usePrefetchNote } from "@/features/notes/hooks/useNotesList";
import { getNoteFolderBreadcrumb } from "@/features/notes/note-library-utils";
import { Link } from "@/i18n/navigation";
import type { NoteFolder, NoteListItem } from "@/services/notes/notes.service";

import { NoteItemActions } from "./NoteItemActions";
import type { LessonLookup } from "./noteContext";
import { getNoteContext } from "./noteContext";
import { useNoteContextLabels } from "./useNoteContextLabels";

function getContextIcon(kind: ReturnType<typeof getNoteContext>["kind"]) {
 if (kind === "lesson") return <BookOpen />;
 if (kind === "quick") return <Zap />;
 return <NotebookPen />;
}

function getContextTone(kind: ReturnType<typeof getNoteContext>["kind"]) {
 if (kind === "lesson") return "info";
 if (kind === "quick") return "warning";
 return "neutral";
}

export function NoteListRow({
 note,
 folders,
 lessonLookup,
 pdfPages,
 onDeleted,
}: {
 note: NoteListItem;
 folders: NoteFolder[];
 lessonLookup: LessonLookup;
 /** Page count of the note's PDF, when it holds one. */
 pdfPages?: number;
 onDeleted: () => void;
}) {
 const t = useTranslations("Notes");
 const locale = useLocale();
 const contextLabels = useNoteContextLabels();
 const context = getNoteContext(note, lessonLookup, contextLabels);
 const updatedAt = new Intl.DateTimeFormat(locale, {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
 }).format(new Date(note.updated_at));
 const folderBreadcrumb = getNoteFolderBreadcrumb(note.folder_id, folders);
 const prefetchNote = usePrefetchNote();
 const readingStatusLabel = (status: NonNullable<NoteListItem["reading_status"]>) =>
  t(`readingStatus.${status}`);

 return (
  <>
   <article className="group grid grid-cols-[minmax(0,1fr)_auto] border-b border-border-default transition-colors last:border-b-0 hover:bg-bg-subtle/70">
    <Link
     href={`/notes/${note.id}`}
     onMouseEnter={() => prefetchNote(note.id)}
     onPointerDown={() => prefetchNote(note.id)}
     className="min-w-0 px-3 py-3 sm:px-4 lg:px-5 lg:py-4"
    >
     <div className="flex min-w-0 items-start gap-3">
      <IconTile
       tone={pdfPages === undefined ? getContextTone(context.kind) : "neutral"}
       size="sm"
       className="translate-y-0.5"
      >
       {pdfPages === undefined ? getContextIcon(context.kind) : <FileText />}
      </IconTile>

      <div className="grid min-w-0 gap-1.5">
       <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Typography tone="default" weight="bold" clamp="one">
         {context.displayTitle}
        </Typography>
        {note.reading_status ? (
         <Badge variant="purple" size="sm" casing="natural">
          {readingStatusLabel(note.reading_status)}
         </Badge>
        ) : (
         <Badge
          variant={context.kind === "lesson" ? "purple" : "default"}
          size="sm"
          casing="natural"
         >
          {context.title}
         </Badge>
        )}
       </div>

       <Typography
        as="div"
        variant="caption"
        tone="muted"
        weight="medium"
        className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
       >
        {folderBreadcrumb ? <span>{folderBreadcrumb}</span> : null}
        {folderBreadcrumb && (note.source_label || context.subtitle) ? <span>/</span> : null}
        <Typography as="span" variant="caption" tone="muted" weight="medium" clamp="one">
         {note.source_label || context.subtitle}
        </Typography>
        {note.source_author ? <span>· {note.source_author}</span> : null}
       </Typography>

       <div className="flex flex-wrap items-center gap-1.5">
        {pdfPages === undefined ? null : (
         <Badge variant="danger" size="sm" casing="natural">
          {t("grid.pdfPages", { count: pdfPages })}
         </Badge>
        )}
        {context.badges.slice(1, 4).map((tag) => (
         <Badge key={tag} size="sm" casing="natural">
          {tag}
         </Badge>
        ))}
        <Typography
         variant="caption"
         tone="muted"
         weight="semibold"
         className="flex items-center gap-1"
        >
         <Clock className="size-3.5" /> {updatedAt}
        </Typography>
       </div>
      </div>
     </div>
    </Link>

    <div className="flex items-start gap-1 px-2 py-3 lg:py-4">
     <NoteItemActions
      note={note}
      folders={folders}
      displayTitle={context.displayTitle}
      onDeleted={onDeleted}
     />
    </div>
   </article>
  </>
 );
}
