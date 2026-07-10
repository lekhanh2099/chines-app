"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PanelToggleButtonProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 label: string;
 className?: string;
 size?: "sm" | "md";
};

export function PanelToggleButton({
 open,
 onOpenChange,
 label,
 className,
 size = "sm",
}: PanelToggleButtonProps) {
 const nextOpen = !open;
 const actionLabel = `${nextOpen ? "Mở" : "Thu gọn"} ${label.toLowerCase()}`;
 const Icon = open ? PanelLeftClose : PanelLeftOpen;

 return (
  <Button
   type="button"
   variant="surfaceCard"
   size={size === "sm" ? "icon-xs" : "icon-sm"}
   className={cn("shrink-0 border-border-default shadow-theme-sm", className)}
   aria-label={actionLabel}
   title={actionLabel}
   onClick={() => onOpenChange(nextOpen)}
  >
   <Icon className="size-4" />
  </Button>
 );
}
