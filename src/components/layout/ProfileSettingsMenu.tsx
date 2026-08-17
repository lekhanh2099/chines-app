"use client";

import type { JsonFieldValue } from "@/types/json";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOut, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { useRouter } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

type ProfileSettingsMenuProps = {
 user?: User | null;
 focusModeEnabled: boolean;
};

function readMetadataText(user: ProfileSettingsMenuProps["user"], keys: string[]) {
 for (const key of keys) {
  const value: JsonFieldValue = user?.user_metadata?.[key];
  if (typeof value === "string" && value.trim()) return value.trim();
 }
 return null;
}

function getProfile(
 user: ProfileSettingsMenuProps["user"],
 options: { missingEmail: string; defaultName: string; locale: string },
) {
 const email = user?.email ?? options.missingEmail;
 const emailName = user?.email?.split("@")[0] || options.defaultName;
 const name = readMetadataText(user, ["full_name", "name", "display_name"]) ?? emailName;
 const avatarCandidate = readMetadataText(user, ["avatar_url", "picture"]);
 const avatarUrl = avatarCandidate?.startsWith("https://") ? avatarCandidate : null;
 const provider = typeof user?.app_metadata?.provider === "string" ? user.app_metadata.provider : null;

 return {
  name,
  email,
  avatarUrl,
  initial: name.slice(0, 1).toLocaleUpperCase(options.locale),
  providerLabel: provider === "google" ? "Google" : provider === "email" ? "Email" : "Supabase",
 };
}

export function ProfileSettingsMenu({ user, focusModeEnabled }: ProfileSettingsMenuProps) {
 const router = useRouter();
 const locale = useLocale();
 const tCommon = useTranslations("Common");
 const tShell = useTranslations("Shell");
 const [open, setOpen] = useState(false);
 const profile = getProfile(user, {
  missingEmail: tShell("profile.missingEmail"),
  defaultName: tShell("profile.defaultName"),
  locale,
 });
 const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
 const showAvatar = Boolean(profile.avatarUrl && failedAvatarUrl !== profile.avatarUrl);

 const handleLogout = async () => {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
   toast.error(tShell("profile.logoutFailed"), { description: error.message });
   return;
  }

  setOpen(false);
  toast.success(tShell("profile.logoutSuccess"));
  router.replace("/login");
  router.refresh();
 };

 return (
  <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
   <Popover.Trigger
    render={
     <Button variant={focusModeEnabled ? "warning" : "ghost"} size="icon" className="shrink-0" />
    }
    aria-label={tShell("profile.open")}
    title={tShell("profile.title")}
   >
    <Avatar size="sm" tone={focusModeEnabled ? "neutral" : "accent"}>
     {showAvatar && profile.avatarUrl ? (
      <AvatarImage
       src={profile.avatarUrl}
       alt=""
       referrerPolicy="no-referrer"
       onError={() => setFailedAvatarUrl(profile.avatarUrl)}
      />
     ) : null}
     <AvatarFallback>{profile.initial}</AvatarFallback>
    </Avatar>
   </Popover.Trigger>
   <Popover.Portal>
    <BasePopoverPositioner
     side="bottom"
     align="end"
     sideOffset={10}
     collisionPadding={12}
     positionMethod="fixed"
    >
     <BasePopoverPopup initialFocus={false} finalFocus={false} variant="profile">
      <div className="flex items-center gap-3 border-b border-border-default px-3 py-3">
       <Avatar size="lg" tone="accent">
        {showAvatar && profile.avatarUrl ? (
         <AvatarImage
          src={profile.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailedAvatarUrl(profile.avatarUrl)}
         />
        ) : null}
        <AvatarFallback>{profile.initial}</AvatarFallback>
       </Avatar>
       <div className="min-w-0 flex-1">
        <Typography as="p" variant="label" tone="default" weight="black" clamp="one">
         {profile.name}
        </Typography>
        <Typography
         as="p"
         variant="caption"
         tone="muted"
         weight="semibold"
         clamp="one"
         className="flex items-center gap-1.5"
        >
         <Mail className="size-3 shrink-0" />
         <Typography as="span" clamp="one">
          {profile.email}
         </Typography>
        </Typography>
       </div>
       <Badge variant="default" size="sm">
        <ShieldCheck />
        {profile.providerLabel}
       </Badge>
      </div>

      <div className="grid gap-2 border-b border-border-default p-2">
       <Typography variant="caption" tone="muted" weight="bold" className="px-1">
        {tCommon("language")}
       </Typography>
       <LocaleSwitcher />
      </div>

      <div className="p-2">
       <Button
        type="button"
        variant="menuDestructive"
        size="menu"
        align="start"
        className="w-full"
        onClick={handleLogout}
       >
        <LogOut data-icon="inline-start" />
        {tCommon("actions.signOut")}
       </Button>
      </div>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
