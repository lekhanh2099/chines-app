"use client";

import { useMemo } from "react";
import { FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { Typography } from "@/components/ui/typography";
import type { NoteFolder, NoteListItem } from "@/services/notes.service";

import type { LessonLookup } from "./noteContext";
import { NoteCreateDialog } from "./NoteCreateDialog";
import { NoteImportButton } from "./NoteImportButton";
import { NoteListRow } from "./NoteListRow";

export function NoteList({
 notes,
 folders,
 lessonLookup,
 groupByMonth = false,
}: {
 notes: NoteListItem[];
 folders: NoteFolder[];
 lessonLookup: LessonLookup;
 groupByMonth?: boolean;
}) {
 const t = useTranslations("Notes");
 const locale = useLocale();
 const groups = useMemo<[string, NoteListItem[]][]>(() => {
  if (!groupByMonth) return [["", notes]];
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const byMonth = new Map<string, NoteListItem[]>();
  for (const note of notes) {
   const month = monthFormatter.format(new Date(note.updated_at));
   const existing = byMonth.get(month) ?? [];
   existing.push(note);
   byMonth.set(month, existing);
  }
  return Array.from(byMonth.entries());
 }, [groupByMonth, locale, notes]);

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
  <div className="min-h-0 flex-1 overflow-y-auto bg-bg-primary px-3 py-3 scrollbar-soft sm:px-4 lg:px-6 lg:py-4 xl:px-8">
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
   </div>
  </div>
 );
}
