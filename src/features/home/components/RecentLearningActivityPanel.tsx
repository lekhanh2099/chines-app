import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import type { HomeDashboardModel } from "@/features/home/types";
import { HomeSectionHeader } from "@/features/home/components/HomePrimitives";

const resultLabels = {
 known: "Đã biết",
 hard: "Còn khó",
 again: "Ôn lại",
} satisfies Record<HomeDashboardModel["recentActivity"][number]["result"], string>;

const resultVariants = {
 known: "success",
 hard: "warning",
 again: "danger",
} satisfies Record<
 HomeDashboardModel["recentActivity"][number]["result"],
 "danger" | "success" | "warning"
>;

export function RecentLearningActivityPanel({
 items,
}: {
 items: HomeDashboardModel["recentActivity"];
}) {
 return (
  <section aria-labelledby="recent-learning-activity-title">
   <Card variant="section" padding="lg">
    <HomeSectionHeader
     id="recent-learning-activity-title"
     title="Hoạt động gần đây"
     description="Những mục bạn vừa ôn và kết quả đã ghi nhận."
    />

    {items.length > 0 ? (
     <div className="mt-4 divide-y divide-border-default/70">
      {items.map((item) => (
       <div key={item.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
        <IconTile size="sm" tone="neutral">
         <History />
        </IconTile>
        <div className="min-w-0 flex-1">
         <Typography as="p" tone="default" weight="bold" clamp="one">
          {item.label}
         </Typography>
         <Typography as="p" variant="caption" tone="muted" className="mt-0.5">
          {item.kindLabel} · {formatDistanceToNow(new Date(item.answeredAt), { addSuffix: true, locale: vi })}
         </Typography>
        </div>
        <Badge variant={resultVariants[item.result]} size="sm">
         {resultLabels[item.result]}
        </Badge>
       </div>
      ))}
     </div>
    ) : (
     <Typography as="p" variant="bodySmall" tone="muted" className="mt-4">
      Chưa có lượt ôn gần đây. Khi bạn đánh giá flashcard, hoạt động sẽ xuất hiện ở đây.
     </Typography>
    )}
   </Card>
  </section>
 );
}
