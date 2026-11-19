"use client";

import type { ComponentProps, ReactNode } from "react";
import { BookOpen, FileText, NotebookPen, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import { usePrefetchNote } from "@/features/notes/hooks/useNotesList";
import { useNotePdfCoverUrl } from "@/features/notes/pdf/useNotePdfLibrary";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { NotePdfAttachment } from "@/services/notes/note-pdf.service";
import type { NoteFolder, NoteListItem } from "@/services/notes/notes.service";

import { NoteItemActions } from "./NoteItemActions";
import type { getNoteContext } from "./noteContext";

type NoteContext = ReturnType<typeof getNoteContext>;

/** A library note as a GoodNotes-style cover with its title, date and actions below. */
export function NoteGridCard({
 note,
 folders,
 context,
 cover,
 onDeleted,
}: {
 note: NoteListItem;
 folders: NoteFolder[];
 context: NoteContext;
 cover: ReactNode;
 onDeleted: () => void;
}) {
 const t = useTranslations("Notes");
 const locale = useLocale();
 const prefetchNote = usePrefetchNote();
 const updatedAt = new Intl.DateTimeFormat(locale, {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
 }).format(new Date(note.updated_at));

 return (
  <article className="group grid min-w-0 content-start gap-2">
   <Card
    asChild
    variant="interactive"
    padding="none"
    className="relative block aspect-[3/4] overflow-hidden"
   >
    <Link
     href={`/notes/${note.id}`}
     onMouseEnter={() => prefetchNote(note.id)}
     onPointerDown={() => prefetchNote(note.id)}
     aria-label={context.displayTitle}
    >
     {cover}
    </Link>
   </Card>
   <div className="flex min-w-0 items-start gap-1">
    <div className="grid min-w-0 flex-1 gap-0.5 px-0.5">
     <Typography as="h3" variant="bodySmall" weight="bold" clamp="two">
      {context.displayTitle}
     </Typography>
     <Typography as="p" variant="caption" tone="muted" clamp="one">
      {note.reading_status
       ? `${t(`readingStatus.${note.reading_status}`)} · ${updatedAt}`
       : updatedAt}
     </Typography>
    </div>
    <NoteItemActions
     note={note}
     folders={folders}
     displayTitle={context.displayTitle}
     onDeleted={onDeleted}
    />
   </div>
  </article>
 );
}

/** Page 1 of the note's PDF, or a PDF placeholder until this device has drawn it. */
export function NotePdfCover({ attachment }: { attachment: NotePdfAttachment }) {
 const t = useTranslations("Notes.grid");
 const url = useNotePdfCoverUrl(attachment);

 return (
  <>
   {url ? (
    // oxlint-disable-next-line next/no-img-element -- local object URL of a cover drawn on this device
    <img
     src={url}
     alt=""
     className="size-full bg-surface object-cover object-top"
     draggable={false}
    />
   ) : (
    <div className="grid size-full place-content-center justify-items-center gap-2 bg-bg-subtle p-4 text-center">
     <IconTile tone="neutral" size="lg">
      <FileText />
     </IconTile>
     <Typography as="span" variant="caption" tone="muted" clamp="three">
      {attachment.file_name}
     </Typography>
    </div>
   )}
   <Badge variant="danger" size="sm" casing="natural" className="absolute bottom-2 left-2">
    {t("pdfPages", { count: attachment.page_count })}
   </Badge>
  </>
 );
}

/** A notebook cover for a text note, coloured by its kind: lesson green, quick amber, regular blue. */
export function NoteNotebookCover({ context }: { context: NoteContext }) {
 const tile: ComponentProps<typeof IconTile>["tone"] =
  context.kind === "lesson" ? "success" : context.kind === "quick" ? "warning" : "accent";
 const surface =
  context.kind === "lesson"
   ? "bg-success-subtle"
   : context.kind === "quick"
     ? "bg-warning-subtle"
     : "bg-accent-subtle";
 const spine =
  context.kind === "lesson"
   ? "bg-info/40"
   : context.kind === "quick"
     ? "bg-warning/50"
     : "bg-accent/40";

 return (
  <div className={cn("relative grid size-full content-between p-4 ps-6", surface)}>
   <span aria-hidden="true" className={cn("absolute inset-y-0 start-0 w-2.5", spine)} />
   <IconTile tone={tile} size="md">
    {context.kind === "lesson" ? (
     <BookOpen />
    ) : context.kind === "quick" ? (
     <Zap />
    ) : (
     <NotebookPen />
    )}
   </IconTile>
   <div className="grid gap-0.5">
    <Typography as="span" variant="label" weight="bold" clamp="one">
     {context.title}
    </Typography>
    <Typography as="span" variant="caption" tone="muted" clamp="two">
     {context.subtitle}
    </Typography>
   </div>
  </div>
 );
}
