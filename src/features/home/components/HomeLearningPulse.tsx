import type { ComponentProps, ReactNode } from "react";
import { Bookmark, CheckCircle2, FileText, History, Repeat2, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import type { HomeDashboardModel } from "@/features/home/types";
import { Link } from "@/i18n/navigation";

export function HomeLearningPulse({ pulse }: { pulse: HomeDashboardModel["learningPulse"] }) {
 return (
  <section aria-labelledby="home-learning-pulse-title">
   <Card variant="section" padding="lg" className="grid gap-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid min-w-0 gap-1">
      <Typography
       id="home-learning-pulse-title"
       as="h2"
       variant="sectionTitle"
       tone="default"
       weight="black"
      >
       Nhịp học
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Những tín hiệu cần chú ý từ tiến độ hiện tại.
      </Typography>
     </div>
     <Button variant="outline" size="toolbar" asChild>
      <Link href="/dictionary" prefetch={false}>
       <Repeat2 data-icon="inline-start" />
       Mở SRS
      </Link>
     </Button>
    </div>

    <div className="grid grid-cols-2 gap-5">
     <PulseStat
      icon={<Repeat2 />}
      value={pulse.reviewCount}
      label="Đang học / còn khó"
      tone="warning"
     />
     <PulseStat icon={<CheckCircle2 />} value={pulse.knownCount} label="Đã biết" tone="info" />
     <PulseStat
      icon={<History />}
      value={pulse.reviewedTodayCount}
      label="Đã ôn hôm nay"
      tone="accent"
     />
     <PulseStat
      icon={<Bookmark />}
      value={pulse.bookmarkedCount}
      label="Đã đánh dấu"
      tone="neutral"
     />
     <PulseStat icon={<Repeat2 />} value={pulse.srsDueCount} label="SRS đến hạn" tone="warning" />
     <PulseStat
      icon={<Workflow />}
      value={pulse.learningLoopDueCount}
      label="Learning Loop đến hạn"
      tone="accent"
     />
     <PulseStat
      icon={<FileText />}
      value={`${pulse.readerCompletedCount}/${pulse.readerDocumentCount}`}
      label="Reader đã hoàn thành"
      tone="info"
     />
    </div>

    <Typography as="p" variant="caption" tone="muted">
     {pulse.trackedCount > 0
      ? `${pulse.trackedCount} mục đã có trạng thái học. Nhóm đầu gồm các mục đang học hoặc đang đánh dấu khó; đây không phải lịch đến hạn SRS.`
      : "Chưa có tiến độ để tổng hợp. Bắt đầu học hoặc đánh dấu trạng thái để dashboard tự cập nhật."}
    </Typography>
    {pulse.overviewUnavailable ? (
     <Typography as="p" variant="caption" tone="danger">
      Không tải được phần tổng quan SRS, Learning Loop và Reader. Tiến độ học hiện tại vẫn hiển thị.
     </Typography>
    ) : null}
   </Card>
  </section>
 );
}

function PulseStat({
 icon,
 value,
 label,
 tone,
}: {
 icon: ReactNode;
 value: number | string;
 label: string;
 tone: NonNullable<ComponentProps<typeof IconTile>["tone"]>;
}) {
 return (
  <div className="flex min-w-0 items-start gap-3">
   <IconTile size="sm" tone={tone}>
    {icon}
   </IconTile>
   <div className="grid min-w-0 gap-0.5">
    <Typography as="p" variant="sectionTitle" tone="default" weight="black">
     {value}
    </Typography>
    <Typography as="p" variant="caption" tone="muted">
     {label}
    </Typography>
   </div>
  </div>
 );
}
