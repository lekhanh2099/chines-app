import type * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionWrapperProps = React.ComponentProps<typeof Card> & {
 contentClassName?: string;
};

function SectionWrapper({
 className,
 contentClassName,
 children,
 variant = "section",
 padding = "md",
 ...rest
}: SectionWrapperProps) {
 return (
  <Card className={className} variant={variant} padding={padding} {...rest}>
   <div className={cn("flex flex-col gap-4", contentClassName)}>{children}</div>
  </Card>
 );
}

export { SectionWrapper };
