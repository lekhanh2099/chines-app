"use client";

import type { MutationStatus } from "@tanstack/react-query";
import { Check, Cloud, CloudOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";

export function SaveStatusBadge({
 status,
 onRetry,
}: {
 status: MutationStatus;
 onRetry: () => void;
}) {
 const t = useTranslations("Notes.editor.save");
 const common = useTranslations("Common");
 if (status === "idle") return null;

 const config = {
  pending: {
   icon: <Cloud className="h-3.5 w-3.5 animate-pulse" />,
   label: t("saving"),
   className: "text-text-muted",
   visibility: "flex",
  },
  success: {
   icon: <Check className="h-3.5 w-3.5" />,
   label: t("saved"),
   className: "text-success",
   visibility: "hidden sm:flex",
  },
  error: {
   icon: <CloudOff className="h-3.5 w-3.5" />,
   label: t("error"),
   className: "text-danger",
   visibility: "flex",
  },
 };

 const current = config[status];

 return (
  <div
   className={`${current.visibility} h-9 items-center gap-1.5 rounded-xl px-1 text-xs font-medium ${current.className} animate-in fade-in xl:px-2`}
   title={current.label}
   aria-label={current.label}
  >
   {current.icon}
   <span className="hidden xl:inline">{current.label}</span>
   {status === "error" ? (
    <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
     {common("actions.retry")}
    </Button>
   ) : null}
  </div>
 );
}
