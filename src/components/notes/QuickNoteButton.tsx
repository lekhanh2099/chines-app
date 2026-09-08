"use client";

import type { ComponentProps } from "react";
import { useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { Loader2, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { createClient } from "@/lib/supabase/client";
import { EMPTY_LEXICAL_DOCUMENT } from "@/lib/editor-document";
import { cn } from "@/lib/utils";
import { focusModeStore } from "@/stores/focus-mode-store";

type QuickNoteVariant = ComponentProps<typeof Button>["variant"];

interface QuickNoteButtonProps {
 className?: string;
 variant?: QuickNoteVariant;
 compactOnTablet?: boolean;
}

export function QuickNoteButton({
 className = "",
 variant = "default",
 compactOnTablet = false,
}: QuickNoteButtonProps) {
 const t = useTranslations("Notes");
 const locale = useLocale();
 const [isCreating, setIsCreating] = useState(false);
 const supabase = createClient();
 const router = useRouter();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);

 const handleCreate = async () => {
  if (isCreating) return;
  if (focusModeEnabled) {
   toast.warning(t("quick.focusBlocked"));
   return;
  }

  setIsCreating(true);

  try {
   const user = await getClientSessionUser(supabase);
   if (!user) {
    router.push("/login");
    return;
   }

   const now = new Date();
   const date = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
   }).format(now);
   const title = t("quick.defaultTitle", { date });

   const { data, error } = await supabase
    .from("notes")
    .insert({
     user_id: user.id,
     title,
     tags: ["quick-note"],
     content: EMPTY_LEXICAL_DOCUMENT,
    })
    .select()
    .single();

   if (error) throw error;

   router.push(`/notes/${data.id}`);
  } catch {
   toast.error(t("quick.error"));
  } finally {
   setIsCreating(false);
  }
 };

 return (
  <Button
   type="button"
   variant={variant}
   size={compactOnTablet ? "toolbar" : "touch"}
   onClick={handleCreate}
   disabled={isCreating || focusModeEnabled}
   aria-label={t("quick.label")}
   title={t("quick.label")}
   className={cn(variant === "dashed" && "w-full", className)}
  >
   {isCreating ? (
    <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
   ) : (
    <Zap data-icon="inline-start" className="size-4" />
   )}
   <span className={cn(compactOnTablet && "hidden 2xl:inline")}>{t("quick.button")}</span>
  </Button>
 );
}
