import { Typography } from "@/components/ui/display/typography";
import { Clock3, FileText } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { IconTile } from "@/components/ui/display/icon-tile";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { HomeArrowIcon, HomeSectionHeader } from "@/features/home/components/HomePrimitives";
import type { HomeDashboardModel } from "@/features/home/types";
import { Link } from "@/i18n/navigation";

export function RecentNotesPanel({
 notes,
 loading,
 unavailable,
 onRetry,
}: {
 notes: HomeDashboardModel["recentNotes"];
 loading: HomeDashboardModel["recentNotesLoading"];
 unavailable: HomeDashboardModel["recentNotesUnavailable"];
 onRetry: HomeDashboardModel["retryRecentNotes"];
}) {
 const format = useFormatter();
 const now = useNow({ updateInterval: 60_000 });
 const t = useTranslations("Home");
 const common = useTranslations("Common");

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

    {loading ? (
     <div aria-busy="true" aria-label={t("notes.loading")} className="grid animate-pulse gap-3">
      {Array.from({ length: 3 }, (_, index) => (
       <div key={index} className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-bg-subtle" />
        <div className="grid min-w-0 flex-1 gap-1">
         <div className="h-4 w-48 max-w-full rounded-md bg-bg-subtle" />
         <div className="h-3 w-28 rounded-full bg-bg-subtle" />
        </div>
       </div>
      ))}
     </div>
    ) : null}
    {unavailable ? (
     <QueryErrorCard
      title={t("notes.loadErrorTitle")}
      description={t("notes.loadErrorDescription")}
      retryLabel={common("actions.retry")}
      onRetry={onRetry}
     />
    ) : null}
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
    ) : !unavailable && !loading ? (
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
    ) : null}
   </Card>
  </section>
 );
}
