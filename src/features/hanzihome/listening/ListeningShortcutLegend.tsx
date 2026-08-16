"use client";

import { Keyboard } from "lucide-react";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
 BasePopoverTrigger,
} from "@/components/ui/base-popover";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";

const shortcuts = [
 ["1 / ←", "Phần trước"],
 ["2 / Space", "Phát / tạm dừng"],
 ["3 / R", "Nghe lại"],
 ["4 / →", "Phần sau"],
 ["5 / L", "Bật / tắt lặp"],
 ["Esc", "Dừng phát"],
 ["Ctrl/⌘ ↵", "Kiểm tra câu đang nhập"],
] as const;

function ShortcutKey({ children }: { children: string }) {
 return (
  <kbd>
   <Badge size="sm" casing="natural">
    {children}
   </Badge>
  </kbd>
 );
}

export function ListeningShortcutLegend() {
 return (
  <Popover.Root modal={false}>
   <BasePopoverTrigger aria-label="Xem phím tắt nghe chép">
    <Keyboard data-icon="inline-start" />
    Phím tắt
   </BasePopoverTrigger>
   <Popover.Portal>
    <BasePopoverPositioner
     side="bottom"
     align="end"
     sideOffset={8}
     collisionPadding={12}
     positionMethod="fixed"
    >
     <BasePopoverPopup variant="menu" initialFocus={false} finalFocus={false}>
      <Typography as="h3" variant="bodySmall" weight="black">
       Phím tắt nghe chép
      </Typography>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
       {shortcuts.map(([key, label]) => (
        <div key={key} className="contents">
         <ShortcutKey>{key}</ShortcutKey>
         <Typography as="span" variant="caption" tone="muted">
          {label}
         </Typography>
        </div>
       ))}
      </div>
      <Typography as="p" variant="caption" tone="muted" className="border-t border-border-default pt-2">
       Khi đang gõ trong ô trả lời, các phím số và Space vẫn nhập bình thường; dùng Ctrl/⌘ + Enter để kiểm tra.
      </Typography>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}