import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ActionCardProps = React.ComponentProps<"button"> & {
 asChild?: boolean;
 padding?: VariantProps<typeof cardVariants>["padding"];
};

function ActionCard({ className, padding, asChild = false, ...props }: ActionCardProps) {
 const Comp = asChild ? Slot.Root : "button";

 return (
  <Comp
   data-slot="action-card"
   className={cn(
    cardVariants({ variant: "interactive", padding }),
    "text-left disabled:cursor-not-allowed disabled:opacity-50",
    className,
   )}
   {...(!asChild ? { type: "button" } : {})}
   {...props}
  />
 );
}

export { ActionCard };
export type { ActionCardProps };
