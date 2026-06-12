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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
       <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        {eyebrow}
       </p>
       <h2 className="text-lg font-black text-text-primary">{title}</h2>
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
