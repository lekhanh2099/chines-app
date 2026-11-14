"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";

import type { ArchiveTarget } from "../ai-conversation-workspace-utils";

export function ArchiveConversationDialog({
 target,
 isArchiving,
 error,
 onOpenChange,
 onConfirm,
}: {
 target: ArchiveTarget;
 isArchiving: boolean;
 error: string | null;
 onOpenChange: (open: boolean) => void;
 onConfirm: () => void;
}) {
 const t = useTranslations("AiConversation");
 return (
  <Dialog open onOpenChange={onOpenChange}>
   <DialogContent size="sm">
    <DialogHeader>
     <DialogTitle>{t("history.archiveTitle")}</DialogTitle>
     <DialogDescription>
      {t("history.archiveDescription", { title: target.title })}
     </DialogDescription>
    </DialogHeader>
    {error ? (
     <DialogBody>
      <Typography as="p" variant="bodySmall" tone="danger" role="alert">
       {error}
      </Typography>
     </DialogBody>
    ) : null}
    <DialogFooter>
     <Button
      type="button"
      variant="outline"
      onClick={() => onOpenChange(false)}
      disabled={isArchiving}
     >
      {t("actions.cancel")}
     </Button>
     <Button type="button" variant="warning" onClick={onConfirm} disabled={isArchiving}>
      {isArchiving ? t("history.archiving") : t("history.archiveConfirm")}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
