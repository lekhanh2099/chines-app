"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StudySectionCardProps = {
 icon?: LucideIcon;
 eyebrow?: string;
 title: string;
 subtitle?: string;
 actionLabel?: string;
 onAction?: () => void;
 children: ReactNode;
 className?: string;
};

export function StudySectionCard({
 icon: Icon,
 eyebrow,
 title,
 subtitle,
 actionLabel,
 onAction,
 children,
 className,
}: StudySectionCardProps) {
 return (
  <Card padding="lg" className={cn("rounded-xl", className)}>
   <div className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="flex min-w-0 items-start gap-3">
      {Icon && (
       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
        <Icon className="h-5 w-5" />
       </span>
      )}
      <div className="min-w-0">
       {eyebrow && (
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         {eyebrow}
        </p>
       )}
       <h2 className="text-lg font-black text-text-primary">{title}</h2>
       {subtitle && (
        <p className="mt-1 text-sm font-semibold text-text-muted">
         {subtitle}
        </p>
       )}
      </div>
     </div>

     {actionLabel && onAction && (
      <Button type="button" variant="outline" size="sm" onClick={onAction}>
       {actionLabel}
      </Button>
     )}
    </div>

    {children}
   </div>
  </Card>
 );
}

export function DebugRawDataPanel({
 title = "Raw data",
 value,
}: {
 title?: string;
 value: unknown;
}) {
 return (
  <details className="rounded-xl border border-border-default bg-bg-primary">
   <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-text-primary marker:hidden">
    {title}
   </summary>
   <pre className="max-h-[28rem] overflow-auto border-t border-border-default bg-bg-subtle p-4 text-xs font-semibold leading-relaxed text-text-secondary">
    {JSON.stringify(value, null, 2)}
   </pre>
  </details>
 );
}
