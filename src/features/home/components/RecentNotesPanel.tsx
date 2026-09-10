import { Typography } from "@/components/ui/typography";
import { Clock3, FileText } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { HomeArrowIcon, HomeSectionHeader } from "@/features/home/components/HomePrimitives";
import type { NoteListItem } from "@/services/notes.service";
import { Link } from "@/i18n/navigation";

export function RecentNotesPanel({ notes }: { notes: NoteListItem[] }) {
 const format = useFormatter();
 const now = useNow({ updateInterval: 60_000 });
 const t = useTranslations("Home");

 return (
  <section aria-labelledby="recent-notes-title">
   <Card variant="section" padding="lg" className="grid gap-4">
    <HomeSectionHeader
     id="recent-notes-title"
     title={t("notes.title")}
     description={t("notes.description")}
     action={
      <Button variant="link" size="inline" asChild>
       <Link href="/notes">{t("notes.viewAll")}</Link>
      </Button>
     }
    />

    {notes.length > 0 ? (
     <div className="divide-y divide-border-default/70">
      {notes.map((note) => (
       <Link
        key={note.id}
        href={`/notes/${note.id}`}
        className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
       >
        <IconTile size="sm" tone="neutral">
         <FileText />
        </IconTile>

        <span className="grid min-w-0 flex-1 gap-0.5">
         <Typography
          tone="default"
          weight="bold"
          clamp="one"
          stateTone="groupAccent"
          className="block"
         >
          {note.title || t("notes.untitled")}
         </Typography>
         <Typography
          variant="caption"
          tone="muted"
          weight="semibold"
          className="flex items-center gap-1"
         >
          <Clock3 className="size-3" />
          {format.relativeTime(new Date(note.updated_at), { now })}
         </Typography>
        </span>

        <HomeArrowIcon />
       </Link>
      ))}
     </div>
    ) : (
     <EmptyState
      size="compact"
      title={t("notes.emptyTitle")}
      description={t("notes.emptyDescription")}
      actions={
       <Button asChild size="compact">
        <Link href="/notes?action=new">{t("notes.create")}</Link>
       </Button>
      }
     />
    )}
   </Card>
  </section>
 );
}
