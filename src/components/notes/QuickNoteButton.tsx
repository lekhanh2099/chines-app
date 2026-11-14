"use client";

import type { ComponentProps } from "react";
import { useSelector } from "@tanstack/react-store";
import { Loader2, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { cn } from "@/lib/utils";
import { focusModeStore } from "@/stores/shell/focus-mode-store";

type QuickNoteVariant = ComponentProps<typeof Button>["variant"];

interface QuickNoteButtonProps {
 className?: string;
 variant?: QuickNoteVariant;
 compactOnTablet?: boolean;
 isCreating: boolean;
 onCreate: () => void;
}

export function QuickNoteButton({
 className = "",
 variant = "default",
 compactOnTablet = false,
 isCreating,
 onCreate,
}: QuickNoteButtonProps) {
 const t = useTranslations("Notes");
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);

 return (
  <Button
   type="button"
   variant={variant}
   size={compactOnTablet ? "toolbar" : "touch"}
   onClick={onCreate}
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
