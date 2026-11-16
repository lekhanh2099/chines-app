"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
 BasePopoverTrigger,
} from "@/components/ui/overlays/base-popover";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { useRouter } from "@/i18n/navigation";

/**
 * The shared "(i)" of study lists: hover (or tap on touch) previews `children`;
 * pressing it with a mouse or keyboard opens the detail page at `href`.
 */
export function DetailHint({
 href,
 label,
 open,
 onOpenChange,
 children,
}: {
 href: string;
 label: string;
 open: boolean;
 onOpenChange: (open: boolean) => void;
 children: ReactNode;
}) {
 const router = useRouter();
 const coarsePointer = useCoarsePointer();

 return (
  <Popover.Root
   open={open}
   onOpenChange={(nextOpen, details) => {
    if (details.reason === "trigger-press" && !coarsePointer) {
     router.push(href);
     return;
    }
    onOpenChange(nextOpen);
   }}
  >
   <BasePopoverTrigger
    appearance="hint"
    openOnHover
    delay={150}
    closeDelay={120}
    aria-label={label}
   >
    <Info />
   </BasePopoverTrigger>
   <Popover.Portal>
    <BasePopoverPositioner side="bottom" align="start" sideOffset={6} collisionPadding={12}>
     <BasePopoverPopup variant="lookup">
      <div className="grid gap-3 p-3" data-no-inspector="true">
       {children}
      </div>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
