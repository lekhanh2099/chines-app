"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Textarea } from "@/components/ui/forms/textarea";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";

import {
 MAX_MANUAL_SCRIPT_CHARS,
 parseManualScript,
 type ParsedManualScript,
} from "../model/manual-script";

export function ManualScriptDialog({
 open,
 onOpenChange,
 durationMs,
 onApply,
}: {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 durationMs: number;
 onApply: (parsed: ParsedManualScript) => void;
}) {
 const t = useTranslations("YoutubeShadowing");
 const [draft, setDraft] = useState("");

 const parsed = useMemo(() => parseManualScript(draft, durationMs), [draft, durationMs]);

 function handleApply() {
  if (parsed.segments.length === 0) return;
  onApply(parsed);
  onOpenChange(false);
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent size="lg" scrollMode="content" closeLabel={t("manualDialog.close")}>
    <DialogHeader>
     <DialogTitle>{t("manualDialog.title")}</DialogTitle>
     <DialogDescription>{t("manualDialog.description")}</DialogDescription>
    </DialogHeader>
    <DialogBody>
     <Textarea
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      rows={10}
      maxLength={MAX_MANUAL_SCRIPT_CHARS}
      placeholder={t("manualDialog.placeholder")}
      aria-label={t("manualDialog.textareaAria")}
     />
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography as="p" variant="bodySmall" tone="secondary" aria-live="polite">
       {t("manualDialog.preview", {
        total: parsed.segments.length,
        timed: parsed.isTimed ? parsed.segments.length : parsed.timedCount,
       })}
      </Typography>
      {parsed.segments.length > 0 && !parsed.isTimed ? (
       <Typography as="p" variant="caption" tone="muted">
        {t("manualDialog.untimedNotice")}
       </Typography>
      ) : null}
     </div>
    </DialogBody>
    <DialogFooter>
     <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
      {t("manualDialog.cancel")}
     </Button>
     <Button
      type="button"
      variant="default"
      disabled={parsed.segments.length === 0}
      onClick={handleApply}
     >
      {t("manualDialog.apply")}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
