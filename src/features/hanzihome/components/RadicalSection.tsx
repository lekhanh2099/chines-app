import { Typography } from "@/components/ui/typography";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function RadicalSection({
 title,
 children,
 className,
}: {
 title: string;
 children: ReactNode;
 className?: string;
}) {
 return (
  <section
   className={cn(
    "grid content-start gap-2 rounded-xl bg-bg-subtle p-4 text-base leading-relaxed text-text-secondary",
    className,
   )}
  >
   <Typography as="h4" variant="cardTitle" tone="default" weight="black">
    {title}
   </Typography>
   {children}
  </section>
 );
}
