"use client";

import { useMemo, useRef } from "react";
import { FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import type { NoteFolder, NoteListItem } from "@/services/notes/notes.service";
import { getNoteLibraryPage, groupNoteLibraryByMonth } from "@/features/notes/note-library-utils";

import type { LessonLookup } from "./noteContext";
import { NoteCreateDialog } from "./NoteCreateDialog";
import { NoteImportButton } from "./NoteImportButton";
import { NoteListRow } from "./NoteListRow";

export function NoteList({
 notes,
 folders,
 lessonLookup,
 page,
 onPageChange,
 groupByMonth = false,
}: {
 notes: NoteListItem[];
 folders: NoteFolder[];
 lessonLookup: LessonLookup;
 page: number;
 onPageChange: (page: number) => void;
 groupByMonth?: boolean;
}) {
 const t = useTranslations("Notes");
 const locale = useLocale();
 const contentViewportRef = useRef<HTMLDivElement>(null);
 const visiblePage = useMemo(() => getNoteLibraryPage(notes, page), [notes, page]);
 const groups = useMemo(
  () => groupNoteLibraryByMonth(visiblePage.notes, locale, groupByMonth),
  [groupByMonth, locale, visiblePage.notes],
 );

 if (notes.length === 0) {
  return (
   <div className="flex min-h-0 flex-1 items-center justify-center bg-bg-primary px-4 py-10 sm:px-6 lg:px-8">
    <EmptyState
     className="max-w-sm"
     surface="card"
     icon={<FileText />}
     title={t("list.emptyTitle")}
     description={t("list.emptyDescription")}
     actions={
      <>
       <NoteImportButton />
       <NoteCreateDialog folders={folders} />
      </>
     }
    />
   </div>
  );
 }

 return (
  <div
   ref={contentViewportRef}
   className="min-h-0 flex-1 overflow-y-auto bg-bg-primary px-3 py-3 scrollbar-soft sm:px-4 lg:px-6 lg:py-4 xl:px-8"
  >
   <div className="grid gap-4">
    {groups.map(([month, monthNotes]) => (
     <section key={month || "all"} className="grid gap-2">
      {month ? (
       <Typography
        as="h2"
        variant="sectionTitle"
        tone="secondary"
        weight="black"
        transform="capitalize"
        className="px-1"
       >
        {month}
       </Typography>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
       {monthNotes.map((note) => (
        <NoteListRow key={note.id} note={note} folders={folders} lessonLookup={lessonLookup} />
       ))}
      </div>
     </section>
    ))}
    {visiblePage.totalPages > 1 ? (
     <nav
      aria-label={t("list.pagination")}
      className="flex flex-wrap items-center justify-end gap-2"
     >
      <Typography variant="caption" tone="muted" className="mr-auto" aria-live="polite">
       {t("list.range", { start: visiblePage.start, end: visiblePage.end, total: notes.length })}
      </Typography>
      <Button
       type="button"
       size="sm"
       variant="outline"
       disabled={visiblePage.page <= 1}
       onClick={() => {
        onPageChange(visiblePage.page - 1);
        contentViewportRef.current?.scrollTo({ top: 0 });
       }}
      >
       {t("list.previous")}
      </Button>
      <Typography as="span" variant="bodySmall" tone="muted">
       {t("list.page", { page: visiblePage.page, total: visiblePage.totalPages })}
      </Typography>
      <Button
       type="button"
       size="sm"
       variant="outline"
       disabled={visiblePage.page >= visiblePage.totalPages}
       onClick={() => {
        onPageChange(visiblePage.page + 1);
        contentViewportRef.current?.scrollTo({ top: 0 });
       }}
      >
       {t("list.next")}
      </Button>
     </nav>
    ) : null}
   </div>
  </div>
 );
}
