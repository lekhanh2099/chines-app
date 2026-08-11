import { type ReactNode } from "react";
import Link from "next/link";
import { Bookmark, CheckCircle2, History, Repeat2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import type { HomeDashboardModel } from "@/features/home/types";

export function HomeLearningPulse({
 pulse,
}: {
 pulse: HomeDashboardModel["learningPulse"];
}) {
 return (
  <section aria-labelledby="home-learning-pulse-title">
   <Card variant="section" padding="lg">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="min-w-0">
      <Typography
       id="home-learning-pulse-title"
       as="h2"
       variant="sectionTitle"
       tone="default"
       weight="black"
      >
       Nhịp học
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted" className="mt-1">
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

    <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5">
     <PulseStat
      icon={<Repeat2 />}
      value={pulse.reviewCount}
      label="Đang học / còn khó"
      tone="warning"
     />
     <PulseStat
      icon={<CheckCircle2 />}
      value={pulse.knownCount}
      label="Đã biết"
      tone="info"
     />
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
    </div>

    <Typography as="p" variant="caption" tone="muted" className="mt-5">
     {pulse.trackedCount > 0
      ? `${pulse.trackedCount} mục đã có trạng thái học. Nhóm đầu gồm các mục đang học hoặc đang đánh dấu khó; đây không phải lịch đến hạn SRS.`
      : "Chưa có tiến độ để tổng hợp. Bắt đầu học hoặc đánh dấu trạng thái để dashboard tự cập nhật."}
    </Typography>
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
 value: number;
 label: string;
 tone: "accent" | "info" | "neutral" | "warning";
}) {
 return (
  <div className="flex min-w-0 items-start gap-3">
   <IconTile size="sm" tone={tone}>
    {icon}
   </IconTile>
   <div className="min-w-0">
    <Typography as="p" variant="sectionTitle" tone="default" weight="black">
     {value}
    </Typography>
    <Typography as="p" variant="caption" tone="muted" className="mt-0.5">
     {label}
    </Typography>
   </div>
  </div>
 );
}
