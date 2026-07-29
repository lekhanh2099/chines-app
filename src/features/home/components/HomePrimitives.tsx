import { Typography } from "@/components/ui/typography";
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
    <Typography
     as="h2"
     variant="sectionTitle"
     id={id}
     tone="default"
     weight="black"
     tracking="tight"
    >
     {title}
    </Typography>
    {description && (
     <Typography
      as="p"
      variant="bodySmall"
      tone="muted"
      weight="semibold"
      leading="compact"
      className="mt-1"
     >
      {description}
     </Typography>
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
  <Typography
   as="span"
   tone="accent"
   className={cn(
    "flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-accent-subtle shadow-theme-sm",
    className,
   )}
  >
   {children}
  </Typography>
 );
}

export function HomeArrowIcon({ className }: { className?: string }) {
 return <ArrowRight className={cn("h-4 w-4 shrink-0 text-text-muted", className)} />;
}
