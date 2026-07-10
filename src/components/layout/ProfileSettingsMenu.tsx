"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Popover } from "@base-ui/react";
import type { User } from "@supabase/supabase-js";
import { BookOpenCheck, Languages, LockKeyhole, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

import type { Theme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileSettingsMenuProps = {
 user?: User | null;
 theme: Theme;
 lookupEnabled: boolean;
 focusModeEnabled: boolean;
 onToggleTheme: () => void;
 onToggleLookup: () => void;
 onToggleFocusMode: () => void;
};

const focusModeEnabledMessage =
 "Focus mode đã bật. Bạn sẽ ở lại bài hiện tại; chỉ đổi đề mục hoặc tab ghi chú đang mở.";

export function ProfileSettingsMenu({
 user,
 theme,
 lookupEnabled,
 focusModeEnabled,
 onToggleTheme,
 onToggleLookup,
 onToggleFocusMode,
}: ProfileSettingsMenuProps) {
 const [open, setOpen] = useState(false);
 const displayName = user?.user_metadata?.display_name || user?.email || "Bạn";
 const initial = displayName.slice(0, 1).toUpperCase();

 const toggleFocusMode = () => {
  if (!focusModeEnabled) {
   toast.warning(focusModeEnabledMessage, { duration: 5200 });
  }

  onToggleFocusMode();
 };

 return (
  <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
   <Popover.Trigger
    className={cn(
     "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-accent-subtle text-sm font-black text-accent-text shadow-theme-sm outline-none transition hover:bg-bg-elevated focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
     focusModeEnabled && "border-warning/35 bg-warning-subtle text-warning-text",
    )}
    aria-label="Mở hồ sơ và cài đặt học"
    title="Hồ sơ và cài đặt"
   >
    {initial}
   </Popover.Trigger>
   <Popover.Portal>
    <Popover.Positioner
     side="bottom"
     align="end"
     sideOffset={10}
     collisionPadding={12}
     positionMethod="fixed"
     style={{ zIndex: 90 }}
    >
     <Popover.Popup
      initialFocus={false}
      finalFocus={false}
      className="w-[min(21rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-border-default bg-bg-elevated p-2 shadow-theme-lg"
     >
      <div className="border-b border-border-default px-3 py-2">
       <p className="truncate text-sm font-black text-text-primary">{displayName}</p>
       <p className="text-xs font-semibold text-text-muted">Cài đặt học</p>
      </div>

      <div className="grid gap-1 py-2">
       <SettingsStatusRow
        icon={<Languages className="h-4 w-4" />}
        label="Ngôn ngữ"
        value="Tiếng Việt"
       />
       <SettingsActionRow
        icon={<BookOpenCheck className="h-4 w-4" />}
        label="Tra từ"
        description="Popup tra từ khi chọn chữ Hán."
        active={lookupEnabled}
        value={lookupEnabled ? "Bật" : "Tắt"}
        onClick={onToggleLookup}
       />
       <SettingsActionRow
        icon={theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        label="Dark mode"
        description="Đổi giao diện sáng tối."
        active={theme === "dark"}
        value={theme === "dark" ? "Bật" : "Tắt"}
        onClick={onToggleTheme}
       />
       <SettingsActionRow
        icon={<LockKeyhole className="h-4 w-4" />}
        label="Focus mode"
        description="Khóa đổi bài, đổi route và mở note mới."
        active={focusModeEnabled}
        value={focusModeEnabled ? "Đang bật" : "Tắt"}
        onClick={toggleFocusMode}
        warning={focusModeEnabled}
       />
      </div>
     </Popover.Popup>
    </Popover.Positioner>
   </Popover.Portal>
  </Popover.Root>
 );
}

function SettingsStatusRow({
 icon,
 label,
 value,
}: {
 icon: ReactNode;
 label: string;
 value: string;
}) {
 return (
  <div className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2">
   <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-subtle text-text-secondary">
    {icon}
   </span>
   <div className="min-w-0 flex-1">
    <p className="text-sm font-bold text-text-primary">{label}</p>
   </div>
   <span className="shrink-0 rounded-lg border border-border-default bg-bg-card px-2 py-1 text-xs font-black text-text-secondary">
    {value}
   </span>
  </div>
 );
}

function SettingsActionRow({
 icon,
 label,
 description,
 active,
 value,
 warning,
 onClick,
}: {
 icon: ReactNode;
 label: string;
 description: string;
 active: boolean;
 value: string;
 warning?: boolean;
 onClick: () => void;
}) {
 return (
  <Button
   type="button"
   variant={active && !warning ? "active" : "ghost"}
   className={cn(
    "min-h-14 w-full justify-start gap-3 rounded-xl px-3 py-2 text-left",
    warning && "bg-warning-subtle text-warning-text hover:bg-warning-subtle",
   )}
   onClick={onClick}
  >
   <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-card text-current shadow-theme-sm">
    {icon}
   </span>
   <span className="grid min-w-0 flex-1 gap-0.5">
    <span className="text-sm font-black text-text-primary">{label}</span>
    <span className="truncate text-xs font-semibold text-text-muted">{description}</span>
   </span>
   <span
    className={cn(
     "shrink-0 rounded-lg border border-border-default bg-bg-card px-2 py-1 text-xs font-black text-text-secondary",
     active && "border-primary/25 text-accent-text",
     warning && "border-warning/30 text-warning-text",
    )}
   >
    {value}
   </span>
  </Button>
 );
}
