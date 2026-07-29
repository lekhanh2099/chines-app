import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
 actionLabel: string;
 onAction: () => void;
 children: ReactNode;
}) {
 return (
  <Card padding="lg" className="rounded-xl">
   <div className="grid gap-3">
    <div className="flex items-start justify-between gap-3">
     <div className="flex min-w-0 items-start gap-3">
      <StudyInstructionText
       as="span"
       tone="accent"
       className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle"
      >
       <Icon className="h-5 w-5" />
      </StudyInstructionText>
      <div className="min-w-0">
       <StudyInstructionText
        variant="overline"
        tone="muted"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        {eyebrow}
       </StudyInstructionText>
       <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
        {title}
       </Typography>
      </div>
     </div>

     <Button type="button" variant="outline" size="sm" onClick={onAction}>
      {actionLabel}
     </Button>
    </div>

    {children}
   </div>
  </Card>
 );
}
