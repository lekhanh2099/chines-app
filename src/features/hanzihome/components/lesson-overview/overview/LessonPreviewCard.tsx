import { Typography } from "@/components/ui/typography";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";

export function LessonPreviewCard({
 icon: Icon,
 eyebrow,
 title,
 actionLabel,
 onAction,
 children,
}: {
 icon: LucideIcon;
 eyebrow: string;
 title: string;
 actionLabel?: string;
 onAction?: () => void;
 children: ReactNode;
}) {
 return (
  <Card variant="section" padding="lg">
   <div className="grid gap-3">
    <div className="flex items-start justify-between gap-3">
     <div className="flex min-w-0 items-start gap-3">
      <IconTile>
       <Icon />
      </IconTile>
      <div className="min-w-0">
       <Typography
        variant="overline"
        tone="muted"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        {eyebrow}
       </Typography>
       <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
        {title}
       </Typography>
      </div>
     </div>

     {actionLabel && onAction ? (
      <Button type="button" variant="outline" size="toolbar" onClick={onAction}>
       {actionLabel}
      </Button>
     ) : null}
    </div>

    {children}
   </div>
  </Card>
 );
}
