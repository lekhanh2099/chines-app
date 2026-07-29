"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PanelToggleSizeSchema = z.enum(["sm", "md"]);

type PanelToggleButtonProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 label: string;
 className?: string;
 size?: z.infer<typeof PanelToggleSizeSchema>;
};

export function PanelToggleButton({
 open,
 onOpenChange,
 label,
 className,
 size = PanelToggleSizeSchema.enum.sm,
}: PanelToggleButtonProps) {
 const nextOpen = !open;
 const actionLabel = `${nextOpen ? "Mở" : "Thu gọn"} ${label.toLowerCase()}`;
 const Icon = open ? PanelLeftClose : PanelLeftOpen;

 return (
  <Button
   type="button"
   variant="surfaceCard"
   size={size === "sm" ? "icon-xs" : "icon-sm"}
   className={cn("shrink-0", className)}
   aria-label={actionLabel}
   title={actionLabel}
   onClick={() => onOpenChange(nextOpen)}
  >
   <Icon className="size-4" />
  </Button>
 );
}
