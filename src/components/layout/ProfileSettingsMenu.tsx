"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Popover } from "@base-ui/react";
import type { User } from "@supabase/supabase-js";
import {
 BookOpenCheck,
 Languages,
 LockKeyhole,
 LogOut,
 Mail,
 Moon,
 Settings,
 Settings2,
 ShieldCheck,
 Sun,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Theme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { LessonReadingSettingsDialogContent } from "@/features/hanzihome/components/lesson-overview/LessonReadingSettings";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
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

function readMetadataText(user: User | null | undefined, keys: string[]) {
 for (const key of keys) {
  const value: unknown = user?.user_metadata?.[key];
  if (typeof value === "string" && value.trim()) return value.trim();
 }
 return null;
}

function getProfile(user: User | null | undefined) {
 const email = user?.email ?? "Chưa có email";
 const emailName = user?.email?.split("@")[0] || "Bạn";
 const name = readMetadataText(user, ["full_name", "name", "display_name"]) ?? emailName;
 const avatarCandidate = readMetadataText(user, ["avatar_url", "picture"]);
 const avatarUrl = avatarCandidate?.startsWith("https://") ? avatarCandidate : null;
 const provider =
  typeof user?.app_metadata?.provider === "string" ? user.app_metadata.provider : null;

 return {
  name,
  email,
  avatarUrl,
  initial: name.slice(0, 1).toLocaleUpperCase("vi-VN"),
  providerLabel: provider === "google" ? "Google" : provider === "email" ? "Email" : "Supabase",
 };
}

export function ProfileSettingsMenu({
 user,
 theme,
 lookupEnabled,
 focusModeEnabled,
 onToggleTheme,
 onToggleLookup,
 onToggleFocusMode,
}: ProfileSettingsMenuProps) {
 const router = useRouter();
 const [open, setOpen] = useState(false);
 const [readingSettingsOpen, setReadingSettingsOpen] = useState(false);
 const learning = useLearningState({ enabled: open || readingSettingsOpen });
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const profile = getProfile(user);
 const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
 const showAvatar = Boolean(profile.avatarUrl && failedAvatarUrl !== profile.avatarUrl);

 const updateDisplayMode = (updates: Partial<typeof displayMode>) => {
  learning.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...updates } });
 };

 const toggleFocusMode = () => {
  if (!focusModeEnabled) {
   toast.warning(focusModeEnabledMessage, { duration: 5200 });
  }

  onToggleFocusMode();
 };

 const handleLogout = async () => {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
   toast.error("Đăng xuất thất bại", { description: error.message });
   return;
  }

  setOpen(false);
  toast.success("Đã đăng xuất");
  router.replace("/login");
  router.refresh();
 };

 return (
  <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
   <Popover.Trigger
    className={cn(
     "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-accent-subtle text-sm font-black text-accent-text shadow-theme-sm outline-none transition hover:bg-bg-elevated focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20",
     focusModeEnabled && "border-warning/35 bg-warning-subtle text-warning-text",
    )}
    aria-label="Mở hồ sơ và cài đặt học"
    title="Hồ sơ và cài đặt"
   >
    {showAvatar && profile.avatarUrl ? (
     // Google profile images are user metadata and can use changing CDN hosts.
     // eslint-disable-next-line @next/next/no-img-element
     <img
      src={profile.avatarUrl}
      alt=""
      className="h-full w-full rounded-full object-cover"
      referrerPolicy="no-referrer"
      onError={() => setFailedAvatarUrl(profile.avatarUrl)}
     />
    ) : (
     profile.initial
    )}
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
      className="max-h-[calc(100dvh-1rem)] w-[min(23rem,calc(100vw-1rem))] overflow-x-hidden overflow-y-auto rounded-2xl border border-border-default bg-bg-elevated p-2 shadow-theme-lg scrollbar-soft"
     >
      <div className="flex items-center gap-3 border-b border-border-default px-3 py-3">
       <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-default bg-accent-subtle text-sm font-black text-accent-text">
        {showAvatar && profile.avatarUrl ? (
         // eslint-disable-next-line @next/next/no-img-element
         <img
          src={profile.avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailedAvatarUrl(profile.avatarUrl)}
         />
        ) : (
         profile.initial
        )}
       </div>
       <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-text-primary">{profile.name}</p>
        <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-text-muted">
         <Mail className="h-3 w-3 shrink-0" />
         <span className="truncate">{profile.email}</span>
        </p>
       </div>
       <span className="flex shrink-0 items-center gap-1 rounded-lg border border-border-default bg-bg-card px-2 py-1 text-xs font-black text-text-secondary">
        <ShieldCheck className="h-3 w-3" />
        {profile.providerLabel}
       </span>
      </div>

      <div className="px-3 pt-3 text-xs font-black uppercase tracking-wide text-text-muted">
       Cài đặt học
      </div>
      <div className="grid gap-1 py-2">
       <SettingsStatusRow
        icon={<Languages className="h-4 w-4" />}
        label="Ngôn ngữ"
        value="Tiếng Việt"
       />
       <SettingsNavigationRow
        icon={<Settings2 className="h-4 w-4" />}
        label="Cài đặt đọc"
        description="Font, cỡ chữ, pinyin, nghĩa và đáp án."
        value={learning.isLoading ? "Đang tải" : "Mở"}
        onClick={() => {
         setReadingSettingsOpen(true);
         setOpen(false);
        }}
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

      <div className="grid gap-1 border-t border-border-default pt-2">
       <Link
        href="/settings"
        onClick={() => setOpen(false)}
        className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-text-primary transition hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
       >
        <Settings className="h-4 w-4 text-text-secondary" />
        Cài đặt tài khoản
       </Link>
       <Button
        type="button"
        variant="ghost"
        className="min-h-11 w-full justify-start gap-3 rounded-xl px-3 py-2 text-danger hover:bg-danger-subtle hover:text-danger"
        onClick={handleLogout}
       >
        <LogOut className="h-4 w-4" />
        Đăng xuất
       </Button>
      </div>
     </Popover.Popup>
    </Popover.Positioner>
   </Popover.Portal>
   <Dialog open={readingSettingsOpen} onOpenChange={setReadingSettingsOpen}>
    <LessonReadingSettingsDialogContent
     displayMode={displayMode}
     isLoading={learning.isLoading}
     onChange={updateDisplayMode}
    />
   </Dialog>
  </Popover.Root>
 );
}

function SettingsNavigationRow({
 icon,
 label,
 description,
 value,
 onClick,
}: {
 icon: ReactNode;
 label: string;
 description: string;
 value: string;
 onClick: () => void;
}) {
 return (
  <Button
   type="button"
   variant="ghost"
   className="min-h-14 w-full justify-start gap-3 rounded-xl px-3 py-2 text-left"
   onClick={onClick}
  >
   <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-card text-current shadow-theme-sm">
    {icon}
   </span>
   <span className="grid min-w-0 flex-1 gap-0.5">
    <span className="text-sm font-black text-text-primary">{label}</span>
    <span className="truncate text-xs font-semibold text-text-muted">{description}</span>
   </span>
   <span className="shrink-0 rounded-lg border border-border-default bg-bg-card px-2 py-1 text-xs font-black text-text-secondary">
    {value}
   </span>
  </Button>
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
