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

type ShortcutLegendItem = readonly [key: string, label: string];

const editingShortcuts: ShortcutLegendItem[] = [
 ["Control", "Phát / tạm dừng"],
 ["Ctrl/⌘ R", "Nghe lại"],
 ["Ctrl/⌘ ↵", "Kiểm tra đáp án"],
 ["Ctrl/⌘ →", "Chuyển sang phần sau"],
 ["Ctrl/⌘ ←", "Quay lại phần trước"],
 ["Esc", "Dừng phát âm"],
];

const generalShortcuts: ShortcutLegendItem[] = [
 ["1 / ←", "Phần trước"],
 ["2 / Control / Space", "Phát / tạm dừng"],
 ["3 / Ctrl/⌘ R / R", "Nghe lại"],
 ["4 / →", "Phần sau"],
 ["5 / L", "Bật / tắt lặp"],
 ["6 / Ctrl/⌘ ↵", "Kiểm tra / Sửa lại"],
 ["Esc", "Dừng phát"],
];

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
      <div className="grid w-80 gap-3">
       <div className="grid gap-1.5">
        <Typography as="h3" variant="bodySmall" weight="black">
         Khi đang gõ trong ô chép
        </Typography>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
         {editingShortcuts.map(([key, label]) => (
          <div key={key} className="contents">
           <ShortcutKey>{key}</ShortcutKey>
           <Typography as="span" variant="caption" tone="muted">
            {label}
           </Typography>
          </div>
         ))}
        </div>
        <Typography as="p" variant="caption" tone="muted" scale="fine" emphasis="italic">
         Phím số 0–9 dùng để gõ năm, tháng, ngày và chọn từ IME bình thường.
        </Typography>
       </div>

       <div className="grid gap-1.5 border-t border-border-default pt-2">
        <Typography as="h3" variant="bodySmall" weight="black">
         Khi ở ngoài ô gõ (xem kết quả / duyệt bài)
        </Typography>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
         {generalShortcuts.map(([key, label]) => (
          <div key={key} className="contents">
           <ShortcutKey>{key}</ShortcutKey>
           <Typography as="span" variant="caption" tone="muted">
            {label}
           </Typography>
          </div>
         ))}
        </div>
       </div>
      </div>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
