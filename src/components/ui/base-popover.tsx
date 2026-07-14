"use client";

import { Popover } from "@base-ui/react";
import * as React from "react";

import { cn } from "@/lib/utils";

function BasePopoverPositioner({
 className,
 ...props
}: React.ComponentProps<typeof Popover.Positioner>) {
 return <Popover.Positioner className={cn("z-[120]", className)} {...props} />;
}

export { Popover as BasePopover, BasePopoverPositioner };
