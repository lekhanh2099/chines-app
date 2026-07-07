import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function HomeSectionHeader({
 id,
 title,
 description,
 action,
 className,
}: {
 id: string;
 title: string;
 description?: string;
 action?: ReactNode;
 className?: string;
}) {
 return (
  <div className={cn("flex items-end justify-between gap-3", className)}>
   <div className="min-w-0">
    <h2 id={id} className="text-lg font-black tracking-tight text-text-primary">
     {title}
    </h2>
    {description && (
     <p className="mt-1 text-sm font-semibold leading-5 text-text-muted">{description}</p>
    )}
   </div>
   {action}
  </div>
 );
}

export function HomeGlassSection({ className, ...props }: ComponentPropsWithoutRef<"section">) {
 return (
  <section
   {...props}
   className={cn("app-glass-surface rounded-2xl border p-5 shadow-theme-lg", className)}
  />
 );
}

export function HomeIconTile({ children, className }: { children: ReactNode; className?: string }) {
 return (
  <span
   className={cn(
    "flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-accent-subtle text-accent-text shadow-theme-sm",
    className,
   )}
  >
   {children}
  </span>
 );
}

export function HomeArrowIcon({ className }: { className?: string }) {
 return <ArrowRight className={cn("h-4 w-4 shrink-0 text-text-muted", className)} />;
}
