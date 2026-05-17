import type { ReactNode } from "react";
import { Sheet, SheetHeader } from "@/components/ui/sheet";

export function LearningDrawer({
 title,
 children,
 onClose,
 side = "right",
}: {
 title: string;
 children: ReactNode;
 onClose: () => void;
 side?: "right" | "bottom";
}) {
 return (
  <Sheet open onOpenChange={(open) => !open && onClose()} side={side} className="p-5">
   <SheetHeader title={title} onClose={onClose} />
   {children}
  </Sheet>
 );
}
