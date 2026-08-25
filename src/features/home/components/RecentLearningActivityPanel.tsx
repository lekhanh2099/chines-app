import type { ComponentProps } from "react";
import { History } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import { HomeSectionHeader } from "@/features/home/components/HomePrimitives";
import type { HomeDashboardModel } from "@/features/home/types";

const resultVariants = {
 known: "success",
 hard: "warning",
 again: "danger",
} satisfies Record<
 HomeDashboardModel["recentActivity"][number]["result"],
 NonNullable<ComponentProps<typeof Badge>["variant"]>
>;

export function RecentLearningActivityPanel({
 items,
}: {
 items: HomeDashboardModel["recentActivity"];
}) {
 const format = useFormatter();
 const now = useNow({ updateInterval: 60_000 });
 const t = useTranslations("Home");
 const resultLabels = {
  known: t("activity.results.known"),
  hard: t("activity.results.hard"),
  again: t("activity.results.again"),
 } satisfies Record<HomeDashboardModel["recentActivity"][number]["result"], string>;

 return (
  <section aria-labelledby="recent-learning-activity-title">
   <Card variant="section" padding="lg" className="grid gap-4">
    <HomeSectionHeader
     id="recent-learning-activity-title"
     title={t("activity.title")}
     description={t("activity.description")}
    />

    {items.length > 0 ? (
     <div className="divide-y divide-border-default/70">
      {items.map((item) => (
       <div key={item.key} className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
        <IconTile size="sm" tone="neutral">
         <History />
        </IconTile>
        <div className="grid min-w-0 flex-1 gap-2">
         <div className="grid gap-0.5">
          <Typography as="p" tone="default" weight="bold" clamp="one">
           {item.label}
          </Typography>
          <Typography as="p" variant="caption" tone="muted">
           {item.kindLabel} · {format.relativeTime(new Date(item.answeredAt), { now })}
          </Typography>
         </div>
         <Badge
          variant={resultVariants[item.result]}
          size="sm"
          className="justify-self-start sm:hidden"
         >
          {resultLabels[item.result]}
         </Badge>
        </div>
        <Badge variant={resultVariants[item.result]} size="sm" className="hidden sm:inline-flex">
         {resultLabels[item.result]}
        </Badge>
       </div>
      ))}
     </div>
    ) : (
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("activity.empty")}
     </Typography>
    )}
   </Card>
  </section>
 );
}
