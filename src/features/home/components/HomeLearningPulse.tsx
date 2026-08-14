import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, History, Repeat2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import type { HomeDashboardModel } from "@/features/home/types";

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
       Ưu tiên việc cần làm tiếp theo thay vì chỉ đếm tổng tiến độ.
      </Typography>
     </div>
     <div className="flex flex-wrap items-center gap-2">
      {pulse.weakPracticeCount > 0 ? (
       <Button variant="outline" size="toolbar" asChild>
        <Link href="/practice-errors" prefetch={false}>
         <CircleAlert data-icon="inline-start" />
         Luyện lỗi
        </Link>
       </Button>
      ) : null}
      <Button variant="outline" size="toolbar" asChild>
       <Link href="/review" prefetch={false}>
        <Repeat2 data-icon="inline-start" />
        Ôn ngay
       </Link>
      </Button>
     </div>
    </div>

    <div className="grid grid-cols-2 gap-5">
     <PulseStat icon={<Repeat2 />} value={pulse.dueCount} label="Đến hạn" tone="warning" />
     <PulseStat
      icon={<CircleAlert />}
      value={pulse.weakPracticeCount}
      label="Lỗi cần luyện"
      tone="neutral"
     />
     <PulseStat
      icon={<History />}
      value={pulse.reviewedTodayCount}
      label="Đã ôn hôm nay"
      tone="accent"
     />
     <PulseStat icon={<CheckCircle2 />} value={pulse.knownCount} label="Đã biết" tone="info" />
    </div>

    <Typography as="p" variant="caption" tone="muted">
     {pulse.trackedCount > 0
      ? `${pulse.trackedCount} mục đã có trạng thái học. Lịch đến hạn dùng level và lần ôn gần nhất; lỗi luyện nghe hiện được giữ cục bộ trên trình duyệt này.`
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
