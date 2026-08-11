import { Typography } from "@/components/ui/typography";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { Clock3, FileText } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { HomeArrowIcon, HomeSectionHeader } from "@/features/home/components/HomePrimitives";
import type { NoteListItem } from "@/services/notes.service";

export function RecentNotesPanel({ notes }: { notes: NoteListItem[] }) {
 return (
  <section aria-labelledby="recent-notes-title">
   <Card variant="section" padding="lg">
    <HomeSectionHeader
     id="recent-notes-title"
     title="Ghi chú mới cập nhật"
     description="Tiếp tục các note đang dùng gần đây."
     action={
      <Button variant="link" size="inline" asChild>
       <Link href="/notes">Xem tất cả</Link>
      </Button>
     }
    />

    {notes.length > 0 ? (
     <div className="mt-4 divide-y divide-border-default/70">
      {notes.map((note) => (
       <Link
        key={note.id}
        href={`/notes/${note.id}`}
        className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
       >
        <IconTile size="sm" tone="neutral">
         <FileText />
        </IconTile>

        <span className="min-w-0 flex-1">
         <Typography
          tone="default"
          weight="bold"
          clamp="one"
          stateTone="groupAccent"
          className="block"
         >
          {note.title || "Ghi chú chưa đặt tên"}
         </Typography>
         <Typography
          variant="caption"
          tone="muted"
          weight="semibold"
          className="mt-0.5 flex items-center gap-1"
         >
          <Clock3 className="size-3" />
          {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true, locale: vi })}
         </Typography>
        </span>

        <HomeArrowIcon />
       </Link>
      ))}
     </div>
    ) : (
     <EmptyState
      size="compact"
      title="Chưa có ghi chú gần đây"
      description="Tạo một ghi chú khi cần giữ lại nội dung đang học."
      className="mt-4"
      actions={
       <Button asChild size="compact">
        <Link href="/notes?action=new">Tạo ghi chú</Link>
       </Button>
      }
     />
    )}
   </Card>
  </section>
 );
}
